'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const test = require('node:test');
const assert = require('node:assert/strict');
const { app, startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await close();
});


test('Opportunity Discovery Flow - Search, Deterministic Matching, Bookmarks, and Closing Soon', async () => {
  const uniqueEmail = `opp_test_${Date.now()}@compass.edu`;

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongPassword@123',
      role: 'student',
      fullName: 'Priya Patel'
    })
  });
  assert.equal(regRes.status, 201);
  const { data: { accessToken } } = await regRes.json();
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  // 2. Set profile details & skills for deterministic matching test
  await fetch(`${baseUrl}/api/students/me`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      college: 'National Institute of Technology',
      degree: 'B.Tech',
      branch: 'Computer Science',
      current_semester: 7,
      graduation_year: 2025,
      cgpa: 8.9,
      preferred_roles: ['Software Engineer', 'Frontend Developer'],
      preferred_locations: ['Bangalore', 'Remote'],
      work_mode_preference: 'hybrid'
    })
  });

  await fetch(`${baseUrl}/api/students/me/skills`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      skillName: 'React',
      category: 'technical',
      proficiencyLevel: 'expert',
      yearsOfExperience: 2
    })
  });
  await fetch(`${baseUrl}/api/students/me/skills`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      skillName: 'JavaScript',
      category: 'technical',
      proficiencyLevel: 'advanced',
      yearsOfExperience: 3
    })
  });

  // 3. Query opportunities without token (unauthenticated public discovery)
  const publicRes = await fetch(`${baseUrl}/api/opportunities?limit=5`);
  assert.equal(publicRes.status, 200);
  const publicData = await publicRes.json();
  assert.equal(publicData.success, true);
  assert.equal(publicData.hasStudentProfile, false);

  // 4. Query opportunities with student token (enriched with match scores)
  const studentRes = await fetch(`${baseUrl}/api/opportunities?limit=5`, { headers: authHeaders });
  assert.equal(studentRes.status, 200);
  const studentData = await studentRes.json();
  assert.equal(studentData.success, true);
  assert.equal(studentData.hasStudentProfile, true);
  assert.ok(studentData.data.length > 0);

  const firstOpp = studentData.data[0];
  assert.ok(firstOpp.id);
  assert.ok(typeof firstOpp.match_score === 'number');
  assert.ok(firstOpp.match_breakdown);
  assert.ok(firstOpp.match_breakdown.weights);
  assert.equal(firstOpp.match_breakdown.weights.skills, 0.5);

  // 5. Test Bookmarking (Save & Unsave)
  const saveRes = await fetch(`${baseUrl}/api/opportunities/${firstOpp.id}/save`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.equal(saveRes.status, 200);
  const saveData = await saveRes.json();
  assert.equal(saveData.success, true);

  // 6. Verify saved list
  const savedListRes = await fetch(`${baseUrl}/api/opportunities/saved`, { headers: authHeaders });
  assert.equal(savedListRes.status, 200);
  const savedListData = await savedListRes.json();
  assert.equal(savedListData.success, true);
  assert.ok(savedListData.data.some(o => o.id === firstOpp.id));

  // 7. Verify opportunity detail shows is_saved = true
  const detailRes = await fetch(`${baseUrl}/api/opportunities/${firstOpp.id}`, { headers: authHeaders });
  assert.equal(detailRes.status, 200);
  const detailData = await detailRes.json();
  assert.equal(detailData.success, true);
  assert.equal(detailData.data.is_saved, true);
  assert.ok(detailData.data.match_score > 0);

  // 8. Test Unbookmarking
  const unsaveRes = await fetch(`${baseUrl}/api/opportunities/${firstOpp.id}/save`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.equal(unsaveRes.status, 200);

  // 9. Query closing soon endpoint
  const closingSoonRes = await fetch(`${baseUrl}/api/opportunities/closing-soon?days=30`, { headers: authHeaders });
  assert.equal(closingSoonRes.status, 200);
  const closingSoonData = await closingSoonRes.json();
  assert.equal(closingSoonData.success, true);
  assert.ok(Array.isArray(closingSoonData.data));
});
