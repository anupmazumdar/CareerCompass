'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');
const db = require('../../app/core/database/connection');
const { issueAccessToken } = require('../../app/core/authentication/auth');

let server;
let baseUrl;

let studentUser, studentProfile, studentToken;
let recruiterUser, recruiterToken;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const ts = Date.now();
  // Student
  const sU = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`uploadStu-${ts}@test.edu`, 'hash', 'student', 'Upload Student']);
  studentUser = sU.lastID;
  const sP = await db.run('INSERT INTO student_profiles (user_id) VALUES (?)', [studentUser]);
  studentProfile = sP.lastID;
  studentToken = issueAccessToken({ userId: studentUser, email: `uploadStu-${ts}@test.edu`, role: 'student' });

  // Recruiter
  const rU = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`uploadRec-${ts}@comp.com`, 'hash', 'recruiter', 'Upload Recruiter']);
  recruiterUser = rU.lastID;
  recruiterToken = issueAccessToken({ userId: recruiterUser, email: `uploadRec-${ts}@comp.com`, role: 'recruiter' });
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('File Upload Security - MIME Magic Bytes, Extension Controls, and Path Traversal Defense', async (t) => {
  await t.test('1. Non-student recruiter role cannot upload resumes', async () => {
    const formData = new FormData();
    const fakePdfBlob = new Blob(['%PDF-1.4 dummy content'], { type: 'application/pdf' });
    formData.append('resume', fakePdfBlob, 'resume.pdf');

    const res = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${recruiterToken}` },
      body: formData
    });
    assert.equal(res.status, 403, 'Recruiter role must be rejected with 403');
  });

  await t.test('2. Disallowed executable extension is rejected', async () => {
    const formData = new FormData();
    const exeBlob = new Blob(['MZ\x90\x00\x03\x00\x00\x00'], { type: 'application/x-msdownload' });
    formData.append('resume', exeBlob, 'malware.exe');

    const res = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData
    });
    assert.equal(res.status, 400, 'Executable file extension must be rejected with 400');
    const data = await res.json();
    assert.equal(data.error, 'INVALID_FILE_EXTENSION');
  });

  await t.test('3. Malformed magic bytes (plain text disguised as PDF) is rejected', async () => {
    const formData = new FormData();
    const fakePdfBlob = new Blob(['This is plain text pretending to be a PDF'], { type: 'application/pdf' });
    formData.append('resume', fakePdfBlob, 'fake.pdf');

    const res = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData
    });
    assert.equal(res.status, 400, 'Forged MIME type without valid PDF magic bytes must be rejected');
    const data = await res.json();
    assert.equal(data.error, 'INVALID_FILE_SIGNATURE');
  });

  await t.test('4. Path traversal attempt in filename is sanitized by the server', async () => {
    const formData = new FormData();
    // Valid PDF signature: %PDF-1.4
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const validPdfBlob = new Blob([validPdfBuffer], { type: 'application/pdf' });
    formData.append('resume', validPdfBlob, '../../../../etc/passwd.pdf');

    const res = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData
    });

    assert.equal(res.status, 201, 'Valid PDF with traversal attempt in name should be accepted with sanitized path');
    const data = await res.json();

    // Verify stored resume file_path does NOT contain path traversal sequences
    const resumeRecord = await db.get('SELECT * FROM resumes WHERE id = ?', [data.data.resumeId]);
    assert.ok(resumeRecord, 'Resume record should exist');
    assert.ok(!resumeRecord.file_path.includes('..'), 'Stored file_path must never contain directory traversal sequence');
    assert.ok(resumeRecord.file_path.startsWith('uploads/resumes/'), 'Stored path must use isolated directory');
  });
});
