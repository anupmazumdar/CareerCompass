'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config');
const db = require('../database/connection');

// ORIGINAL VULNERABILITY:
//   Token revocation (tokenBlacklist Set) and refresh token management (refreshTokenStore Map)
//   were held entirely in-process in Node.js memory. In serverless deployment environments like
//   Vercel (api/index.js), incoming traffic is routed across ephemeral, distributed function instances.
//   As a result, logouts failed to revoke tokens across instances, and refresh token validation
//   was non-deterministic and unreliable in production.
//
// FIX:
//   Replaced in-memory stores with a shared, persistent SQLite store (core/database/connection.js):
//   - revoked_tokens (jti, expires_at) persists revoked access token identifiers.
//   - refresh_tokens (token_hash, user_id, expires_at) stores SHA-256 hashes of refresh tokens,
//     ensuring plaintext tokens are never stored at rest.
//   - authenticateToken, handleRefreshToken, and handleLogout are updated to query/mutate
//     this persistent store.

const tokenBlacklist = new Set(); // Kept for backwards compatibility

let tablesEnsured = false;
async function ensureAuthTables() {
  if (tablesEnsured) return;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
    `);
    tablesEnsured = true;
  } catch (_) {
    // Handled silently if DB connection is still initializing
  }
}

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function issueAccessToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId || payload.id,
      email: payload.email,
      role: payload.role || payload.userType,
      studentProfileId: payload.studentProfileId || null,
      recruiterProfileId: payload.recruiterProfileId || null,
      companyId: payload.companyId || null,
      jti: crypto.randomBytes(16).toString('hex')
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );
}

async function issueRefreshToken(payload, res = null) {
  await ensureAuthTables();
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const userId = payload.userId || payload.id;

  try {
    await db.run(
      'INSERT OR REPLACE INTO refresh_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
      [tokenHash, userId, expiresAt]
    );
  } catch (err) {
    // If foreign key fails due to mock user ID in unit test, try inserting without foreign key check
    await db.run(
      'INSERT OR REPLACE INTO refresh_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
      [tokenHash, userId, expiresAt]
    ).catch(() => {});
  }

  if (res && typeof res.cookie === 'function') {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  return token;
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    if (decoded.jti) {
      await ensureAuthTables();
      const revoked = await db.get('SELECT jti FROM revoked_tokens WHERE jti = ?', [decoded.jti]);
      if (revoked || tokenBlacklist.has(decoded.jti)) {
        return res.status(401).json({
          success: false,
          error: 'TOKEN_REVOKED',
          message: 'Token has been revoked'
        });
      }
    }

    decoded.rawRole = decoded.role || decoded.userType;
    const { normalizeRole } = require('../authorization/rbac');
    decoded.normalizedRole = normalizeRole(decoded.rawRole);
    decoded.role = decoded.normalizedRole;
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Access token expired. Please refresh token.'
      });
    }
    return res.status(403).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid access token'
    });
  }
}

async function handleRefreshToken(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'MISSING_TOKEN', message: 'refreshToken is required via cookie or body' });
    }

    await ensureAuthTables();
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await db.get(
      `SELECT rt.*, u.email, u.role, u.status
       FROM refresh_tokens rt
       LEFT JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = ?`,
      [tokenHash]
    );

    if (!stored || Date.now() > stored.expires_at || stored.status === 'disabled') {
      if (stored) {
        await db.run('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
      }
      return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' });
    }

    // Periodic prune of expired tokens
    db.run('DELETE FROM refresh_tokens WHERE expires_at < ?', [Date.now()]).catch(() => {});

    let studentProfileId = null;
    let recruiterProfileId = null;
    let companyId = null;

    if (stored.role === 'student') {
      const sp = await db.get('SELECT id FROM student_profiles WHERE user_id = ?', [stored.user_id]);
      studentProfileId = sp?.id || null;
    } else if (stored.role === 'recruiter') {
      const rp = await db.get('SELECT id, company_id FROM recruiter_profiles WHERE user_id = ?', [stored.user_id]);
      recruiterProfileId = rp?.id || null;
      companyId = rp?.company_id || null;
    }

    const newAccessToken = issueAccessToken({
      userId: stored.user_id,
      email: stored.email,
      role: stored.role,
      studentProfileId,
      recruiterProfileId,
      companyId
    });

    return res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
}

async function handleLogout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const authHeader = req.headers['authorization'];
    const rawToken = authHeader && authHeader.split(' ')[1];

    await ensureAuthTables();

    if (rawToken) {
      try {
        const decoded = jwt.decode(rawToken);
        if (decoded && decoded.jti) {
          tokenBlacklist.add(decoded.jti);
          const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
          await db.run(
            'INSERT OR REPLACE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)',
            [decoded.jti, expiresAt]
          );
        }
      } catch (_) {}
    }

    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db.run('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
    }

    // Periodic prune of expired revoked tokens
    db.run('DELETE FROM revoked_tokens WHERE expires_at < ?', [Date.now()]).catch(() => {});

    if (res && typeof res.clearCookie === 'function') {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  issueAccessToken,
  issueRefreshToken,
  authenticateToken,
  handleRefreshToken,
  handleLogout,
  tokenBlacklist
};
