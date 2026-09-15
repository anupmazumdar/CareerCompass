// backend/tests/e2e/e2eFlow.test.js
// End-to-End lifecycle test: Registration -> Recruiter Login -> Post Job -> Student Apply -> Match Score Verification

const assert = require('assert');
const { test, describe, before, after } = require('node:test');
const { app, startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');

describe('E2E Lifecycle Integration Test', () => {
  let server;
  let baseUrl;
  let studentToken;
  let recruiterToken;
  let createdJobId;

  before(async () => {
    server = await startServer(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server && server.close) {
      await new Promise(r => server.close(r));
    }
    await close();
  });

  test('E2E Flow: Student Registration & Profile Setup', async () => {
    const studentEmail = `e2e.student.${Date.now()}@example.com`;
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'Password123!',
        role: 'student',
        fullName: 'E2E Test Student'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.data.accessToken);
    studentToken = data.data.accessToken;
  });

  test('E2E Flow: Recruiter Login & Job Posting', async () => {
    // Login as seeded recruiter who belongs to an approved company
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'recruiter@techcorp.com',
        password: 'Password@123'
      })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginData.data.accessToken);
    recruiterToken = loginData.data.accessToken;

    // Post a job
    const jobRes = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recruiterToken}`
      },
      body: JSON.stringify({
        title: 'E2E Full Stack Engineer',
        description: 'Building next-generation web apps using React, Node.js, and SQL',
        department: 'Engineering',
        location: 'Bengaluru',
        minExperienceYears: 1,
        requiredSkills: ['React', 'Python']
      })
    });
    const jobData = await jobRes.json();
    assert.strictEqual(jobRes.status, 201);
    assert.ok(jobData.data.id);
    createdJobId = jobData.data.id;
  });

  test('E2E Flow: Student Browses Jobs and Submits Application', async () => {
    assert.ok(createdJobId, 'Job must exist');

    // Student applies to job
    const applyRes = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        jobId: createdJobId,
        notes: 'Enthusiastic candidate with solid background in React and Node.'
      })
    });
    const applyData = await applyRes.json();
    assert.strictEqual(applyRes.status, 201);
    assert.strictEqual(applyData.data.status, 'applied');
    assert.ok(typeof applyData.data.match_score === 'number');
  });
});
