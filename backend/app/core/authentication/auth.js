'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config');

const tokenBlacklist = new Set();
const refreshTokenStore = new Map();

function hashPassword(password) {
  return bcrypt.hash(password, 10);
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

function issueRefreshToken(payload) {
  const token = crypto.randomBytes(64).toString('hex');
  refreshTokenStore.set(token, {
    userId: payload.userId || payload.id,
    email: payload.email,
    role: payload.role || payload.userType,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

function authenticateToken(req, res, next) {
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

    if (decoded.jti && tokenBlacklist.has(decoded.jti)) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Token has been revoked'
      });
    }

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

function handleRefreshToken(req, res) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'MISSING_TOKEN', message: 'refreshToken is required' });
  }

  const stored = refreshTokenStore.get(refreshToken);
  if (!stored || Date.now() > stored.expiresAt) {
    if (stored) refreshTokenStore.delete(refreshToken);
    return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' });
  }

  const newAccessToken = issueAccessToken({
    userId: stored.userId,
    email: stored.email,
    role: stored.role
  });

  return res.json({ success: true, accessToken: newAccessToken });
}

function handleLogout(req, res) {
  const { refreshToken } = req.body || {};
  const authHeader = req.headers['authorization'];
  const rawToken = authHeader && authHeader.split(' ')[1];

  if (rawToken) {
    try {
      const decoded = jwt.decode(rawToken);
      if (decoded && decoded.jti) {
        tokenBlacklist.add(decoded.jti);
      }
    } catch (_) {}
  }

  if (refreshToken) {
    refreshTokenStore.delete(refreshToken);
  }

  return res.json({ success: true, message: 'Logged out successfully' });
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
