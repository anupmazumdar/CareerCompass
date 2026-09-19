'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');
const db = require('../../app/core/database/connection');
const config = require('../../app/core/config');
const { issueAccessToken } = require('../../app/core/authentication/auth');

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('JWT Security - Production Fail-Closed Secrets and Token Verification', async (t) => {
  await t.test('1. Valid access token succeeds against authenticated endpoint', async () => {
    const validToken = issueAccessToken({ userId: 9999, email: 'jwt-valid@test.edu', role: 'student' });
    const res = await fetch(`${baseUrl}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    // Should pass JWT verification (might be 404 because student profile not created, but NOT 401/403)
    assert.notEqual(res.status, 401, 'Valid JWT should authenticate successfully');
  });

  await t.test('2. Forged token with invalid signature is rejected with 403/401', async () => {
    const forgedToken = jwt.sign(
      { userId: 1, role: 'admin', email: 'admin@target.com' },
      'wrong-secret-key-attacker-guess-1234567890',
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const res = await fetch(`${baseUrl}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${forgedToken}` }
    });
    assert.equal(res.status, 403, 'Forged JWT signature must be rejected');
  });

  await t.test('3. Expired token is rejected with 403', async () => {
    const expiredToken = jwt.sign(
      { userId: 9999, role: 'student', email: 'expired@test.edu' },
      config.jwt.accessSecret,
      { algorithm: 'HS256', expiresIn: '-1s' }
    );
    const res = await fetch(`${baseUrl}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.equal(res.status, 403, 'Expired JWT must be rejected');
    const data = await res.json();
    assert.equal(data.error, 'TOKEN_EXPIRED');
  });

  await t.test('4. Algorithm "none" attack is rejected', async () => {
    // Unsigned token with "alg": "none"
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ userId: 1, role: 'admin', email: 'admin@target.com' })).toString('base64url');
    const unsignedToken = `${header}.${payload}.`;

    const res = await fetch(`${baseUrl}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${unsignedToken}` }
    });
    assert.equal(res.status, 403, 'Algorithm "none" token must be rejected');
  });

  await t.test('5. Revoked token in database is rejected', async () => {
    const jti = 'revoked-test-jti-' + Date.now();
    const token = jwt.sign(
      { userId: 9999, role: 'student', email: 'revoked@test.edu', jti },
      config.jwt.accessSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Add jti to revoked_tokens table
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    await db.run('INSERT OR REPLACE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)', [jti, expiresAt]);

    const res = await fetch(`${baseUrl}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 401, 'Revoked token must be rejected with 401');
    const data = await res.json();
    assert.equal(data.error, 'TOKEN_REVOKED');
  });

  await t.test('6. Production fail-closed validation throws if secret is missing or weak', () => {
    const { validateProductionSecrets } = require('../../app/core/config');
    assert.throws(
      () => validateProductionSecrets({ NODE_ENV: 'production' }),
      /CRITICAL SECURITY CONFIGURATION ERROR/,
      'Must fail closed in production without JWT secret'
    );

    assert.throws(
      () => validateProductionSecrets({ NODE_ENV: 'production', JWT_SECRET: 'short' }),
      /CRITICAL SECURITY CONFIGURATION ERROR/,
      'Must fail closed in production with weak JWT secret'
    );
  });
});
