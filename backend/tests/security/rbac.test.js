'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');
const { issueAccessToken } = require('../../app/core/authentication/auth');

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('RBAC Security - Server-side Role Enforcement', async () => {
  const studentToken = issueAccessToken({ userId: 101, email: 'student@test.edu', role: 'student' });
  const recruiterToken = issueAccessToken({ userId: 202, email: 'recruiter@test.com', role: 'recruiter' });

  // 1. Student attempts to post a job -> 403 Forbidden
  const studentJobPost = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({ title: 'Illegal Job', description: 'desc', location: 'Remote' })
  });
  assert.equal(studentJobPost.status, 403, 'Student must be denied from posting jobs');

  // 2. Student attempts to access admin stats -> 403 Forbidden
  const studentAdminStats = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(studentAdminStats.status, 403, 'Student must be denied from admin stats');

  // 3. Recruiter attempts to access student /api/students/me -> 403 Forbidden
  const recruiterStudentMe = await fetch(`${baseUrl}/api/students/me`, {
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  assert.equal(recruiterStudentMe.status, 403, 'Recruiter must be denied from student profile me');

  // 4. Recruiter attempts to access admin stats -> 403 Forbidden
  const recruiterAdminStats = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  assert.equal(recruiterAdminStats.status, 403, 'Recruiter must be denied from admin stats');

  // 5. Anonymous request to protected jobs endpoint -> 401 Unauthorized
  const anonPost = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Anon Job' })
  });
  assert.equal(anonPost.status, 401, 'Anonymous request must be rejected with 401');

  // 6. SQL Injection Resilience test
  const sqliRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: "' OR '1'='1' --",
      password: "arbitrary_password"
    })
  });
  assert.equal(sqliRes.status, 401, 'SQL injection attempt must fail with 401 Unauthorized');
});
