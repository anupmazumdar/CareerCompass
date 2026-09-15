'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { app, startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0); // dynamic port
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('Auth Integration - Register, Login, Me, and Error Handling', async () => {
  const uniqueEmail = `test_student_${Date.now()}@talentai.edu`;

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongPassword@123',
      role: 'student',
      fullName: 'Integration Test Student'
    })
  });
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  assert.equal(regData.success, true);
  assert.ok(regData.data.accessToken);
  assert.ok(regData.data.refreshToken);
  assert.equal(regData.data.user.role, 'student');

  // 2. Duplicate registration attempt -> 409 Conflict
  const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongPassword@123',
      role: 'student'
    })
  });
  assert.equal(dupRes.status, 409);

  // 3. Login with correct credentials
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongPassword@123'
    })
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.success, true);
  assert.ok(loginData.data.accessToken);
  const token = loginData.data.accessToken;

  // 4. Login with wrong password -> 401 Unauthorized
  const wrongLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'WrongPassword@123'
    })
  });
  assert.equal(wrongLoginRes.status, 401);

  // 5. GET /api/auth/me with valid Bearer token
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.success, true);
  assert.equal(meData.data.email, uniqueEmail);

  // 6. GET /api/auth/me without token -> 401 Unauthorized
  const noTokenRes = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(noTokenRes.status, 401);
});
