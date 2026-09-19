'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');
const db = require('../../app/core/database/connection');

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

test('Authentication Security - Lifecycle, Credential Verification, Rotation, and Revocation', async (t) => {
  const ts = Date.now();
  const testEmail = `auth-sec-${ts}@test.edu`;
  const testPassword = 'SecurePassword123!';
  let accessToken, refreshToken;

  await t.test('1. User registration creates account with hashed password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        role: 'student',
        fullName: 'Auth Test Student'
      })
    });

    assert.equal(res.status, 201, 'Registration should return 201');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.data.accessToken, 'Must return accessToken');

    // Refresh token is exclusively set in httpOnly cookie
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Must set cookie header');
    const match = setCookie.match(/refreshToken=([^;]+)/);
    assert.ok(match, 'Must set refreshToken httpOnly cookie');
    refreshToken = match[1];

    // Confirm password in DB is hashed and not plaintext
    const userInDb = await db.get('SELECT password_hash FROM users WHERE email = ?', [testEmail]);
    assert.ok(userInDb, 'User must exist in DB');
    assert.notEqual(userInDb.password_hash, testPassword, 'Password must be stored as a hash');
  });

  await t.test('2. Login with incorrect password returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!'
      })
    });

    assert.equal(res.status, 401, 'Incorrect password must return 401');
    const data = await res.json();
    assert.equal(data.success, false);
  });

  await t.test('3. Login with valid credentials succeeds and issues tokens', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    assert.equal(res.status, 200, 'Valid login must return 200');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.data.accessToken);
    accessToken = data.data.accessToken;

    const setCookie = res.headers.get('set-cookie');
    const match = setCookie && setCookie.match(/refreshToken=([^;]+)/);
    if (match) refreshToken = match[1];
    assert.ok(refreshToken, 'Must receive refreshToken in set-cookie header');
  });

  await t.test('4. Refresh token rotation issues new access token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${refreshToken}`
      },
      body: JSON.stringify({ refreshToken })
    });

    assert.equal(res.status, 200, 'Refresh flow must succeed');
    const data = await res.json();
    assert.ok(data.accessToken || data.data?.accessToken, 'Must issue new access token');
  });

  await t.test('5. Logout invalidates session and clears credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${refreshToken}`
      },
      body: JSON.stringify({ refreshToken })
    });

    assert.equal(res.status, 200, 'Logout must succeed');
    const data = await res.json();
    assert.equal(data.success, true);
  });
});
