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

let companyA, companyB;
let recruiterAUser, recruiterBUser;
let recruiterAToken, recruiterBToken;

let jobA, jobB, closedJob;
let appBId, externalAppId;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Seed isolated test users and companies
  const timestamp = Date.now();

  // 1. Companies
  const cA = await db.run('INSERT INTO companies (name, verification_status) VALUES (?, ?)', [`CompA-${timestamp}`, 'verified']);
  const cB = await db.run('INSERT INTO companies (name, verification_status) VALUES (?, ?)', [`CompB-${timestamp}`, 'verified']);
  companyA = cA.lastID;
  companyB = cB.lastID;

  // 2. Students
  const uA = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`studentA-${timestamp}@test.edu`, 'hash', 'student', 'Student A']);
  const uB = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`studentB-${timestamp}@test.edu`, 'hash', 'student', 'Student B']);
  studentAUser = uA.lastID;
  studentBUser = uB.lastID;

  const spA = await db.run('INSERT INTO student_profiles (user_id, headline) VALUES (?, ?)', [studentAUser, 'Dev A']);
  const spB = await db.run('INSERT INTO student_profiles (user_id, headline) VALUES (?, ?)', [studentBUser, 'Dev B']);
  studentAProfile = spA.lastID;
  studentBProfile = spB.lastID;

  studentAToken = issueAccessToken({ userId: studentAUser, email: `studentA-${timestamp}@test.edu`, role: 'student' });
  studentBToken = issueAccessToken({ userId: studentBUser, email: `studentB-${timestamp}@test.edu`, role: 'student' });

  // 3. Recruiters
  const rAu = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`recruiterA-${timestamp}@compa.com`, 'hash', 'recruiter', 'Recruiter A']);
  const rBu = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`recruiterB-${timestamp}@compb.com`, 'hash', 'recruiter', 'Recruiter B']);
  recruiterAUser = rAu.lastID;
  recruiterBUser = rBu.lastID;

  const rpA = await db.run('INSERT INTO recruiter_profiles (user_id, company_id) VALUES (?, ?)', [recruiterAUser, companyA]);
  const rpB = await db.run('INSERT INTO recruiter_profiles (user_id, company_id) VALUES (?, ?)', [recruiterBUser, companyB]);
  const recruiterAProfile = rpA.lastID;
  const recruiterBProfile = rpB.lastID;

  recruiterAToken = issueAccessToken({ userId: recruiterAUser, email: `recruiterA-${timestamp}@compa.com`, role: 'recruiter' });
  recruiterBToken = issueAccessToken({ userId: recruiterBUser, email: `recruiterB-${timestamp}@compb.com`, role: 'recruiter' });

  // 4. Jobs
  const jA = await db.run('INSERT INTO jobs (company_id, created_by_recruiter_id, title, description, location, status) VALUES (?, ?, ?, ?, ?, ?)', [companyA, recruiterAProfile, 'Frontend Dev A', 'React Dev', 'Remote', 'published']);
  const jB = await db.run('INSERT INTO jobs (company_id, created_by_recruiter_id, title, description, location, status) VALUES (?, ?, ?, ?, ?, ?)', [companyB, recruiterBProfile, 'Backend Dev B', 'Node Dev', 'Remote', 'published']);
  const jC = await db.run('INSERT INTO jobs (company_id, created_by_recruiter_id, title, description, location, status) VALUES (?, ?, ?, ?, ?, ?)', [companyB, recruiterBProfile, 'Closed Job', 'Old position', 'Remote', 'closed']);
  jobA = jA.lastID;
  jobB = jB.lastID;
  closedJob = jC.lastID;

  // 5. Applications: Student B applies to Job B
  const aB = await db.run('INSERT INTO applications (job_id, student_id, status) VALUES (?, ?, ?)', [jobB, studentBProfile, 'applied']);
  appBId = aB.lastID;

  // 6. External application: Student B tracks private external job (job_id = null)
  const aExt = await db.run('INSERT INTO applications (job_id, student_id, status, notes) VALUES (?, ?, ?, ?)', [null, studentBProfile, 'applied', 'External application']);
  externalAppId = aExt.lastID;
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('Application Security - IDOR, BOLA, Null Job Bypass, and Lifecycle Boundaries', async (t) => {
  await t.test('1. Student B can view their own application (Positive Check)', async () => {
    const res = await fetch(`${baseUrl}/api/applications/${appBId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert.equal(res.status, 200, 'Student B must access their own application');
    const data = await res.json();
    assert.equal(data.data.id, appBId);
  });

  await t.test('2. Student A CANNOT view Student B application (Negative IDOR Check)', async () => {
    const res = await fetch(`${baseUrl}/api/applications/${appBId}`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert.equal(res.status, 403, 'Student A must be denied with 403 from Student B application');
  });

  await t.test('3. Recruiter B can view application submitted to their company job (Positive Check)', async () => {
    const res = await fetch(`${baseUrl}/api/applications/${appBId}`, {
      headers: { Authorization: `Bearer ${recruiterBToken}` }
    });
    assert.equal(res.status, 200, 'Recruiter B must access application for Company B job');
  });

  await t.test('4. Recruiter A CANNOT view application submitted to Company B job (Recruiter IDOR Check)', async () => {
    const res = await fetch(`${baseUrl}/api/applications/${appBId}`, {
      headers: { Authorization: `Bearer ${recruiterAToken}` }
    });
    assert.equal(res.status, 403, 'Recruiter A must be denied from Company B application');
  });

  await t.test('5. Recruiter CANNOT view external student application where job_id = NULL (Null Bypass Check)', async () => {
    const res = await fetch(`${baseUrl}/api/applications/${externalAppId}`, {
      headers: { Authorization: `Bearer ${recruiterBToken}` }
    });
    assert.equal(res.status, 403, 'job_id = NULL must NOT bypass authorization for recruiters');
  });

  await t.test('6. Recruiter A CANNOT mutate status of Company B application (Kanban Tampering Check)', async () => {
    const res = await fetch(`${baseUrl}/api/applications/${appBId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${recruiterAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'interview', notes: 'Tampered note' })
    });
    assert.equal(res.status, 403, 'Recruiter A must NOT be able to modify Company B application status');
  });

  await t.test('7. Applying to a closed job is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobId: closedJob, status: 'applied' })
    });
    assert.equal(res.status, 400, 'Closed job must reject new applications');
    const data = await res.json();
    assert.equal(data.error, 'JOB_CLOSED');
  });

  await t.test('8. Duplicate application is rejected with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentBToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobId: jobB, status: 'applied' })
    });
    assert.equal(res.status, 409, 'Duplicate application must return 409 Conflict');
  });
});
