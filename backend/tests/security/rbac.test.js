'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');
const db = require('../../app/core/database/connection');
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

test('RBAC Security - Server-side Role Enforcement & Fix 1 Verification', async () => {
  const studentToken = issueAccessToken({ userId: 101, email: 'student@test.edu', role: 'student' });
  const recruiterToken = issueAccessToken({ userId: 202, email: 'recruiter@test.com', role: 'recruiter' });

  // 1. Student attempts to access admin stats -> 403 Forbidden
  const studentAdminStats = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(studentAdminStats.status, 403, 'Student must be denied from admin stats');

  // 2. Recruiter token attempts to access student /api/students/me -> 403 Forbidden
  const recruiterStudentMe = await fetch(`${baseUrl}/api/students/me`, {
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  assert.equal(recruiterStudentMe.status, 403, 'Recruiter must be denied from student profile me');

  // 3. Recruiter attempts to access admin stats -> 403 Forbidden
  const recruiterAdminStats = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  assert.equal(recruiterAdminStats.status, 403, 'Recruiter must be denied from admin stats');

  // 4. Anonymous request to protected endpoint -> 401 Unauthorized
  const anonMe = await fetch(`${baseUrl}/api/students/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.equal(anonMe.status, 401, 'Anonymous request must be rejected with 401');

  // 5. SQL Injection Resilience test
  const sqliRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: "' OR '1'='1' --",
      password: 'arbitrary_password'
    })
  });
  assert.equal(sqliRes.status, 401, 'SQL injection attempt must fail with 401 Unauthorized');

  // 6. Employer token attempts admin endpoint -> 403 Forbidden
  const employerToken = issueAccessToken({ userId: 303, email: 'employer@test.com', role: 'employer' });
  const employerAdminStats = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${employerToken}` }
  });
  assert.equal(employerAdminStats.status, 403, 'Employer must be denied from admin stats');

  // 7. IDOR: Student attempting to access another student profile -> 403 Forbidden
  const studentOtherProfile = await fetch(`${baseUrl}/api/students/999999`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(studentOtherProfile.status, 403, 'Student must be denied from viewing other student profiles');

  // 8. SECURITY FIX 1 (Part 2): New company registration defaults to pending verificationStatus
  const uniqueCompany = `TestCo_${Date.now()}`;
  const regNewCompanyRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `founder_${Date.now()}@testco.com`,
      password: 'secure_password_123',
      role: 'recruiter',
      companyName: uniqueCompany
    })
  });
  assert.equal(regNewCompanyRes.status, 201, 'Recruiter registration must succeed');
  const companyRecord = await db.get('SELECT verification_status FROM companies WHERE name = ?', [uniqueCompany]);
  assert.equal(companyRecord.verification_status, 'pending', 'New company must have verification_status: pending');

  // 9. SECURITY FIX 1 (Part 1): Joining an existing company sets isCompanyAdmin: false
  const regJoinCompanyRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `member_${Date.now()}@testco.com`,
      password: 'secure_password_123',
      role: 'recruiter',
      companyName: uniqueCompany
    })
  });
  assert.equal(regJoinCompanyRes.status, 201, 'Joining existing company must succeed');
  const joinData = await regJoinCompanyRes.json();
  const recruiterProfile = await db.get(
    'SELECT is_company_admin FROM recruiter_profiles WHERE user_id = ?',
    [joinData.data.user.id]
  );
  assert.equal(recruiterProfile.is_company_admin, 0, 'User joining existing company must have is_company_admin = false');

  // 10. SECURITY FIX 1 (Part 3): Recruiter at pending company cannot access candidate PII
  const pendingRecruiterToken = joinData.data.accessToken;
  const candidateAccessRes = await fetch(`${baseUrl}/api/students/1`, {
    headers: { Authorization: `Bearer ${pendingRecruiterToken}` }
  });
  assert.equal(candidateAccessRes.status, 403, 'Recruiter at pending company must be denied candidate access');
  const candidateData = await candidateAccessRes.json();
  assert.match(candidateData.message, /pending verification/i, 'Must indicate pending verification');

  // 11. AUDIT FIX 1: Anonymous call to removed legacy /api/candidates returns 404
  const legacyCandidatesRes = await fetch(`${baseUrl}/api/candidates`);
  assert.equal(legacyCandidatesRes.status, 404, 'Legacy unauthenticated /api/candidates must return 404');

  // 12. AUDIT FIX 3: /api/admin/questions route guard
  const anonQuestionsRes = await fetch(`${baseUrl}/api/admin/questions`);
  assert.equal(anonQuestionsRes.status, 401, 'Anonymous request to /api/admin/questions must be rejected with 401');

  const studentQuestionsRes = await fetch(`${baseUrl}/api/admin/questions`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(studentQuestionsRes.status, 403, 'Student request to /api/admin/questions must be rejected with 403');

  // 13. AUDIT FIX 2: IDOR protection on PATCH /api/applications/:id/status
  const compA = await db.run('INSERT INTO companies (name, verification_status) VALUES (?, ?)', [`CompA_${Date.now()}`, 'verified']);
  const compB = await db.run('INSERT INTO companies (name, verification_status) VALUES (?, ?)', [`CompB_${Date.now()}`, 'verified']);

  const userA = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`rec_a_${Date.now()}@a.com`, 'hash', 'recruiter', 'Recruiter A']);
  await db.run('INSERT INTO recruiter_profiles (user_id, company_id) VALUES (?, ?)', [userA.lastID, compA.lastID]);
  const tokenRecruiterA = issueAccessToken({ userId: userA.lastID, email: 'rec_a@a.com', role: 'recruiter', companyId: compA.lastID });

  const userB = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`rec_b_${Date.now()}@b.com`, 'hash', 'recruiter', 'Recruiter B']);
  const recB = await db.run('INSERT INTO recruiter_profiles (user_id, company_id) VALUES (?, ?)', [userB.lastID, compB.lastID]);

  const jobB = await db.run(
    'INSERT INTO jobs (company_id, created_by_recruiter_id, title, description, location, status) VALUES (?, ?, ?, ?, ?, ?)',
    [compB.lastID, recB.lastID, 'Job at B', 'Description B', 'Remote', 'published']
  );

  const userStudent = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`student_${Date.now()}@uni.edu`, 'hash', 'student', 'Student B']);
  const studentProf = await db.run('INSERT INTO student_profiles (user_id, headline) VALUES (?, ?)', [userStudent.lastID, 'Headline']);
  const appB = await db.run('INSERT INTO applications (job_id, student_id, status) VALUES (?, ?, ?)', [jobB.lastID, studentProf.lastID, 'applied']);

  const idorPatchRes = await fetch(`${baseUrl}/api/applications/${appB.lastID}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenRecruiterA}`
    },
    body: JSON.stringify({ status: 'shortlisted' })
  });
  assert.equal(idorPatchRes.status, 403, 'Recruiter from different company must be denied from updating application status');

  // 14. AUDIT FIX 5: Serverless token revocation via persistent store
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(logoutRes.status, 200, 'Logout must succeed');

  const revokedMeRes = await fetch(`${baseUrl}/api/students/me`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(revokedMeRes.status, 401, 'Revoked token must be rejected with 401 Unauthorized');
});

