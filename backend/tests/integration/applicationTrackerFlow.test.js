'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Allocate isolated SQLite DB in os.tmpdir() before loading server/database
const tempDbPath = path.join(os.tmpdir(), `test_tracker_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.db`);
process.env.DB_PATH = tempDbPath;

const test = require('node:test');
const assert = require('node:assert/strict');
const { app, startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await close();
  try {
    fs.rmSync(tempDbPath, { force: true });
    fs.rmSync(`${tempDbPath}-wal`, { force: true });
    fs.rmSync(`${tempDbPath}-shm`, { force: true });
  } catch (_) {}
});

test('Application Tracker Flow - Auto-apply, Kanban Movement, Custom External Job, and Analytics', async () => {
  const uniqueEmail = `tracker_test_${Date.now()}@compass.edu`;

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongPassword@123',
      role: 'student',
      fullName: 'Rohan Verma'
    })
  });
  assert.equal(regRes.status, 201);
  const { data: { accessToken } } = await regRes.json();
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  // 2. Add student resume
  const resumeRes = await fetch(`${baseUrl}/api/students/me/resumes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      fileName: 'Rohan_Resume_SDE.pdf',
      filePath: '/uploads/resumes/rohan_sde.pdf',
      mimeType: 'application/pdf',
      fileSize: 104200,
      versionLabel: 'v1-frontend',
      isPrimary: true
    })
  });
  assert.equal(resumeRes.status, 201);
  const resumeData = await resumeRes.json();
  assert.equal(resumeData.data.is_primary, 1);

  // 3. Fetch initial empty stats
  const initialStatsRes = await fetch(`${baseUrl}/api/applications/stats`, { headers: authHeaders });
  assert.equal(initialStatsRes.status, 200);
  const initialStats = await initialStatsRes.json();
  assert.equal(initialStats.success, true);
  assert.equal(initialStats.data.total, 0);

  // 4. Fetch an opportunity to apply to
  const oppRes = await fetch(`${baseUrl}/api/opportunities?limit=1`, { headers: authHeaders });
  assert.equal(oppRes.status, 200);
  const oppData = await oppRes.json();
  assert.ok(oppData.data.length > 0);
  const targetOpp = oppData.data[0];

  // 5. Apply to opportunity (auto-using primary resume)
  const applyRes = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      opportunityId: targetOpp.id,
      coverNote: 'Excited to apply with fullstack React and Node skills.',
      status: 'applied'
    })
  });
  assert.equal(applyRes.status, 201);
  const applyData = await applyRes.json();
  assert.equal(applyData.success, true);
  assert.equal(applyData.data.status, 'applied');
  assert.equal(applyData.data.resume_version_label, 'v1-frontend');
  assert.ok(applyData.data.match_score >= 0);

  const applicationId = applyData.data.id;

  // 6. Track a custom external application (e.g. Google application)
  const externalApplyRes = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      company: 'Google Cloud Labs',
      title: 'Cloud Engineer Intern',
      location: 'Bangalore, India',
      status: 'applied',
      notes: 'Applied through university referral program'
    })
  });
  assert.equal(externalApplyRes.status, 201);
  const externalData = await externalApplyRes.json();
  assert.equal(externalData.success, true);
  assert.equal(externalData.data.company_name, 'Google Cloud Labs');

  // 7. Move first application across Kanban stages (to 'interview') and schedule reminder
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const updateStageRes = await fetch(`${baseUrl}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'interview',
      notes: 'Technical round 1 scheduled on Google Meet',
      reminderDate: tomorrow
    })
  });
  assert.equal(updateStageRes.status, 200);
  const updateStageData = await updateStageRes.json();
  assert.equal(updateStageData.data.status, 'interview');

  // 8. Add interview prep note
  const noteRes = await fetch(`${baseUrl}/api/applications/${applicationId}/notes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      noteType: 'interview_prep',
      content: 'Review system design concepts: caching, load balancing, and React hooks.'
    })
  });
  assert.equal(noteRes.status, 201);
  const noteData = await noteRes.json();
  assert.equal(noteData.data.note_type, 'interview_prep');

  // 9. Fetch applications list and verify enriched fields
  const listRes = await fetch(`${baseUrl}/api/applications/my-applications`, { headers: authHeaders });
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.equal(listData.count, 2);

  // 10. Verify stats endpoint reflects interview and active count
  const finalStatsRes = await fetch(`${baseUrl}/api/applications/stats`, { headers: authHeaders });
  assert.equal(finalStatsRes.status, 200);
  const finalStats = await finalStatsRes.json();
  assert.equal(finalStats.data.total, 2);
  assert.equal(finalStats.data.interview, 1);
  assert.ok(finalStats.data.upcoming_reminders.length > 0);

  // 11. Withdraw application
  const withdrawRes = await fetch(`${baseUrl}/api/applications/${applicationId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.equal(withdrawRes.status, 200);
  const withdrawData = await withdrawRes.json();
  assert.equal(withdrawData.message, 'Application withdrawn successfully');
});
