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

let resumeAId, resumeBId;
let jobId;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const ts = Date.now();
  // Company & Job
  const c = await db.run('INSERT INTO companies (name, verification_status) VALUES (?, ?)', [`ResumeTestComp-${ts}`, 'verified']);
  const rU = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`resRecruiter-${ts}@comp.com`, 'hash', 'recruiter', 'Recruiter']);
  const rp = await db.run('INSERT INTO recruiter_profiles (user_id, company_id) VALUES (?, ?)', [rU.lastID, c.lastID]);
  const j = await db.run('INSERT INTO jobs (company_id, created_by_recruiter_id, title, description, location, status) VALUES (?, ?, ?, ?, ?, ?)', [c.lastID, rp.lastID, 'Dev', 'Desc', 'Remote', 'published']);
  jobId = j.lastID;

  // Students
  const uA = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`resStudentA-${ts}@test.edu`, 'hash', 'student', 'Student A']);
  const uB = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`resStudentB-${ts}@test.edu`, 'hash', 'student', 'Student B']);
  studentAUser = uA.lastID;
  studentBUser = uB.lastID;

  const spA = await db.run('INSERT INTO student_profiles (user_id) VALUES (?)', [studentAUser]);
  const spB = await db.run('INSERT INTO student_profiles (user_id) VALUES (?)', [studentBUser]);
  studentAProfile = spA.lastID;
  studentBProfile = spB.lastID;

  studentAToken = issueAccessToken({ userId: studentAUser, email: `resStudentA-${ts}@test.edu`, role: 'student' });
  studentBToken = issueAccessToken({ userId: studentBUser, email: `resStudentB-${ts}@test.edu`, role: 'student' });

  // Resumes
  const rA = await db.run(
    'INSERT INTO resumes (student_id, file_name, file_path, mime_type, file_size, version_label, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [studentAProfile, 'resumeA.pdf', 'uploads/resumes/a.pdf', 'application/pdf', 1024, 'v1', 1]
  );
  const rB = await db.run(
    'INSERT INTO resumes (student_id, file_name, file_path, mime_type, file_size, version_label, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [studentBProfile, 'resumeB.pdf', 'uploads/resumes/b.pdf', 'application/pdf', 2048, 'v1', 1]
  );
  resumeAId = rA.lastID;
  resumeBId = rB.lastID;
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('Resume Security - Object Ownership, Application Attachment IDOR, and Tampering', async (t) => {
  await t.test('1. Student A attempts to attach Student B resume to application -> 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId,
        resumeId: resumeBId,
        status: 'applied'
      })
    });

    assert.equal(res.status, 403, 'Must reject application with unauthorized resumeId');
    const data = await res.json();
    assert.equal(data.error, 'FORBIDDEN');
  });

  await t.test('2. Student B attempts to attach Student A resume to application -> 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentBToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId,
        resumeId: resumeAId,
        status: 'applied'
      })
    });

    assert.equal(res.status, 403, 'Must reject application with unauthorized resumeId');
  });

  await t.test('3. Student A attaches their OWN resume to application -> 201 Created (Positive Test)', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId,
        resumeId: resumeAId,
        status: 'applied'
      })
    });

    assert.equal(res.status, 201, 'Student A must successfully attach their own resume');
    const data = await res.json();
    assert.equal(data.data.resume_id, resumeAId);
  });

  await t.test('4. Student A cannot set Student B resume as primary', async () => {
    const res = await fetch(`${baseUrl}/api/students/me/resumes/${resumeBId}/primary`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });

    assert.equal(res.status, 404, 'Cannot set another student resume as primary');
    // Verify Student B resume is still primary for Student B
    const checkB = await db.get('SELECT is_primary FROM resumes WHERE id = ?', [resumeBId]);
    assert.equal(checkB.is_primary, 1, 'Student B primary resume must remain intact');
  });

  await t.test('5. Student A cannot delete Student B resume', async () => {
    const res = await fetch(`${baseUrl}/api/students/me/resumes/${resumeBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });

    // Verify Resume B still exists in database
    const checkB = await db.get('SELECT id FROM resumes WHERE id = ?', [resumeBId]);
    assert.ok(checkB, 'Resume B must NOT be deleted by Student A');
  });
});
