'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');
const db = require('../../app/core/database/connection');
const { issueAccessToken } = require('../../app/core/authentication/auth');

let server;
let baseUrl;

let studentAUser, studentBUser;
let studentAProfile, studentBProfile;
let studentAToken, studentBToken;

let recruiterUser, recruiterCompany, recruiterToken;
let otherRecruiterUser, otherCompany, otherRecruiterToken;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const ts = Date.now();

  // Companies
  const c1 = await db.run('INSERT INTO companies (name, verification_status) VALUES (?, ?)', [`PIIComp1-${ts}`, 'verified']);
  const c2 = await db.run('INSERT INTO companies (name, verification_status) VALUES (?, ?)', [`PIIComp2-${ts}`, 'verified']);
  recruiterCompany = c1.lastID;
  otherCompany = c2.lastID;

  // Students
  const uA = await db.run('INSERT INTO users (email, phone, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)', [`piiStuA-${ts}@test.edu`, '+91-9876543210', 'hash', 'student', 'PII Candidate A']);
  const uB = await db.run('INSERT INTO users (email, phone, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)', [`piiStuB-${ts}@test.edu`, '+91-9123456789', 'hash', 'student', 'PII Candidate B']);
  studentAUser = uA.lastID;
  studentBUser = uB.lastID;

  const spA = await db.run('INSERT INTO student_profiles (user_id, headline, bio, cgpa) VALUES (?, ?, ?, ?)', [studentAUser, 'AI Researcher', 'Passionate about ML', 9.2]);
  const spB = await db.run('INSERT INTO student_profiles (user_id, headline, bio, cgpa) VALUES (?, ?, ?, ?)', [studentBUser, 'Web Engineer', 'Fullstack engineer', 8.5]);
  studentAProfile = spA.lastID;
  studentBProfile = spB.lastID;

  // Student A adds private goal
  await db.run('INSERT INTO student_goals (student_id, title, description, category) VALUES (?, ?, ?, ?)', [studentAProfile, 'Secret Dream: Quit and launch startup', 'Private founder goals', 'career']);

  studentAToken = issueAccessToken({ userId: studentAUser, email: `piiStuA-${ts}@test.edu`, role: 'student' });
  studentBToken = issueAccessToken({ userId: studentBUser, email: `piiStuB-${ts}@test.edu`, role: 'student' });

  // Recruiters
  const rU = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`piiRecruiter-${ts}@comp1.com`, 'hash', 'recruiter', 'Recruiter 1']);
  recruiterUser = rU.lastID;
  const rp1 = await db.run('INSERT INTO recruiter_profiles (user_id, company_id) VALUES (?, ?)', [recruiterUser, recruiterCompany]);
  recruiterToken = issueAccessToken({ userId: recruiterUser, email: `piiRecruiter-${ts}@comp1.com`, role: 'recruiter' });

  const rU2 = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`piiOtherRecruiter-${ts}@comp2.com`, 'hash', 'recruiter', 'Recruiter 2']);
  otherRecruiterUser = rU2.lastID;
  await db.run('INSERT INTO recruiter_profiles (user_id, company_id) VALUES (?, ?)', [otherRecruiterUser, otherCompany]);
  otherRecruiterToken = issueAccessToken({ userId: otherRecruiterUser, email: `piiOtherRecruiter-${ts}@comp2.com`, role: 'recruiter' });

  // Job for Company 1
  const j1 = await db.run('INSERT INTO jobs (company_id, created_by_recruiter_id, title, description, location) VALUES (?, ?, ?, ?, ?)', [recruiterCompany, rp1.lastID, 'ML Engineer', 'ML', 'Remote']);

  // Candidate A applies to Company 1 Job
  await db.run('INSERT INTO applications (job_id, student_id, status) VALUES (?, ?, ?)', [j1.lastID, studentAProfile, 'applied']);
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('Candidate PII Protection - Least Privilege Serializers and Data Minimization', async (t) => {
  await t.test('1. Student A receives own complete profile including private goals', async () => {
    const res = await fetch(`${baseUrl}/api/students/me`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.data.full_name, 'PII Candidate A');
    assert.ok(Array.isArray(data.data.goals) && data.data.goals.length > 0, 'Own profile must include personal goals');
  });

  await t.test('2. Student B CANNOT view Student A candidate profile (Negative IDOR)', async () => {
    const res = await fetch(`${baseUrl}/api/students/${studentAProfile}`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert.equal(res.status, 403, 'Student B must be denied from viewing Student A');
  });

  await t.test('3. Recruiter 2 (no application) CANNOT view Student A candidate profile', async () => {
    const res = await fetch(`${baseUrl}/api/students/${studentAProfile}`, {
      headers: { Authorization: `Bearer ${otherRecruiterToken}` }
    });
    assert.equal(res.status, 403, 'Unrelated recruiter must be denied with 403');
  });

  await t.test('4. Authorized Recruiter 1 receives candidate data with sensitive PII and goals redacted', async () => {
    const res = await fetch(`${baseUrl}/api/students/${studentAProfile}`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert.equal(res.status, 200, 'Authorized recruiter should see applicant');
    const data = await res.json();
    const candidate = data.data;

    // Allowed recruiter fields:
    assert.equal(candidate.full_name, 'PII Candidate A');
    assert.equal(candidate.headline, 'AI Researcher');
    assert.equal(candidate.cgpa, 9.2);

    // Redacted sensitive fields:
    assert.equal(candidate.phone, undefined, 'Personal phone number must be omitted for recruiters');
    assert.equal(candidate.goals, undefined, 'Private student goals must be omitted for recruiters');
  });
});
