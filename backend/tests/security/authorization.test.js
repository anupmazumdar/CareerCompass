'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');
const db = require('../../app/core/database/connection');
const { issueAccessToken } = require('../../app/core/authentication/auth');

let server;
let baseUrl;
let employerToken;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const ts = Date.now();
  const c = await db.run('INSERT INTO companies (name, verification_status) VALUES (?, ?)', [`EmployerTestComp-${ts}`, 'verified']);
  const u = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`employer-${ts}@test.com`, 'hash', 'recruiter', 'Employer User']);
  await db.run('INSERT INTO recruiter_profiles (user_id, company_id) VALUES (?, ?)', [u.lastID, c.lastID]);
  employerToken = issueAccessToken({ userId: u.lastID, email: `employer-${ts}@test.com`, role: 'employer' });
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('Authorization & RBAC Security - Role Boundaries and Canonical Normalization', async (t) => {
  const studentToken = issueAccessToken({ userId: 1001, email: 'student-role@test.edu', role: 'student' });
  const candidateToken = issueAccessToken({ userId: 1002, email: 'candidate-role@test.edu', role: 'candidate' });
  const recruiterToken = issueAccessToken({ userId: 2001, email: 'recruiter-role@test.com', role: 'recruiter' });
  const adminToken = issueAccessToken({ userId: 3001, email: 'admin-role@test.org', role: 'admin' });
  const invalidRoleToken = issueAccessToken({ userId: 4001, email: 'hacker@test.com', role: 'superhacker' });

  await t.test('1. Anonymous requests to protected routes are rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/students/me`);
    assert.equal(res.status, 401, 'Anonymous request must return 401 Unauthorized');
  });

  await t.test('2. Candidate role alias normalizes and accesses student-restricted endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${candidateToken}` }
    });
    // Not 403 Forbidden: allowed past role guard
    assert.notEqual(res.status, 403, 'Candidate alias must satisfy requireRole(student)');
  });

  await t.test('3. Employer role alias normalizes and accesses recruiter-restricted endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${employerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Test', description: 'Desc', location: 'Remote' })
    });
    assert.equal(res.status, 201, 'Employer alias must satisfy requireRole(recruiter) and post job');
  });

  await t.test('4. Student cannot access recruiter job posting endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Test', description: 'Desc', location: 'Remote' })
    });
    assert.equal(res.status, 403, 'Student role must be rejected with 403');
  });

  await t.test('5. Recruiter cannot access student profile endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/students/me`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert.equal(res.status, 403, 'Recruiter role must be rejected with 403 on student profile');
  });

  await t.test('6. Non-admin roles are strictly blocked from admin stats', async () => {
    const studentRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(studentRes.status, 403, 'Student blocked from admin stats');

    const recruiterRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert.equal(recruiterRes.status, 403, 'Recruiter blocked from admin stats');
  });

  await t.test('7. Admin role accesses admin stats successfully', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200, 'Admin role must be granted access');
    const data = await res.json();
    assert.equal(data.success, true);
  });

  await t.test('8. Tampered or unapproved role claims are rejected with 403', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${invalidRoleToken}` }
    });
    assert.equal(res.status, 403, 'Arbitrary role claim must be rejected with 403');
  });
});
