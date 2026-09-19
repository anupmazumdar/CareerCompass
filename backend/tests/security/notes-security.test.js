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

let app10Id, app20Id;
let note999Id;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const ts = Date.now();
  // Students
  const uA = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`noteStuA-${ts}@test.edu`, 'hash', 'student', 'Student A']);
  const uB = await db.run('INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)', [`noteStuB-${ts}@test.edu`, 'hash', 'student', 'Student B']);
  studentAUser = uA.lastID;
  studentBUser = uB.lastID;

  const spA = await db.run('INSERT INTO student_profiles (user_id) VALUES (?)', [studentAUser]);
  const spB = await db.run('INSERT INTO student_profiles (user_id) VALUES (?)', [studentBUser]);
  studentAProfile = spA.lastID;
  studentBProfile = spB.lastID;

  studentAToken = issueAccessToken({ userId: studentAUser, email: `noteStuA-${ts}@test.edu`, role: 'student' });
  studentBToken = issueAccessToken({ userId: studentBUser, email: `noteStuB-${ts}@test.edu`, role: 'student' });

  // Applications
  // Application 10 owned by Student A
  const a10 = await db.run('INSERT INTO applications (student_id, status, notes) VALUES (?, ?, ?)', [studentAProfile, 'applied', 'App 10 notes']);
  app10Id = a10.lastID;

  // Application 20 owned by Student A
  const a20 = await db.run('INSERT INTO applications (student_id, status, notes) VALUES (?, ?, ?)', [studentAProfile, 'interview', 'App 20 notes']);
  app20Id = a20.lastID;

  // Note 999 belongs to Application 20
  const n999 = await db.run(
    'INSERT INTO application_notes (application_id, student_id, content, note_type) VALUES (?, ?, ?, ?)',
    [app20Id, studentAProfile, 'Sensitive interview prep for app 20', 'interview_prep']
  );
  note999Id = n999.lastID;

  // Audit history for App 20
  await db.run(
    'INSERT INTO application_status_history (application_id, changed_by_user_id, previous_status, new_status) VALUES (?, ?, ?, ?)',
    [app20Id, studentAUser, 'applied', 'interview']
  );
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('Notes and History Security - Cross-Application Mismatch and Audit Boundaries', async (t) => {
  await t.test('1. Mismatched application/note deletion (/app10/notes/999 where note is in app20) fails', async () => {
    // Student A tries to delete note999 by calling /api/applications/:app10Id/notes/:note999Id
    const res = await fetch(`${baseUrl}/api/applications/${app10Id}/notes/${note999Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });

    assert.equal(res.status, 403, 'Cross-application note deletion must be rejected');
    const data = await res.json();
    assert.equal(data.error, 'FORBIDDEN');

    // Confirm note999 still exists in database
    const note = await db.get('SELECT * FROM application_notes WHERE id = ?', [note999Id]);
    assert.ok(note, 'Note must NOT be deleted when application ID mismatches');
  });

  await t.test('2. Student B CANNOT view or delete Student A notes', async () => {
    // Student B attempts to get notes of App 20
    const getRes = await fetch(`${baseUrl}/api/applications/${app20Id}/notes`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert.equal(getRes.status, 403, 'Student B cannot view Student A notes');

    // Student B attempts to delete note 999
    const delRes = await fetch(`${baseUrl}/api/applications/${app20Id}/notes/${note999Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert.equal(delRes.status, 403, 'Student B cannot delete Student A note');
  });

  await t.test('3. Student B CANNOT access Student A application history', async () => {
    const res = await fetch(`${baseUrl}/api/applications/${app20Id}/history`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert.equal(res.status, 403, 'Student B must not access Student A history');
  });

  await t.test('4. Student A successfully deletes note 999 with MATCHING application 20 (Positive Test)', async () => {
    const res = await fetch(`${baseUrl}/api/applications/${app20Id}/notes/${note999Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });

    assert.equal(res.status, 200, 'Student A can delete note when application ID matches');
    const note = await db.get('SELECT * FROM application_notes WHERE id = ?', [note999Id]);
    assert.equal(note, null, 'Note must now be deleted from database');
  });
});
