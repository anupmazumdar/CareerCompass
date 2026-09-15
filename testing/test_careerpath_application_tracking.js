'use strict';

const assert = require('assert');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function runApplicationPipelineTests() {
  console.log('🚀 Starting CareerPath Stage 3 Tests: Application Tracking & Pipeline Timeline\n');

  const ts = Date.now();
  const studentAEmail = `pipeline.studentA.${ts}@careerpath.edu`;
  const studentBEmail = `pipeline.studentB.${ts}@careerpath.edu`;
  const recruiterEmail = `pipeline.recruiter.${ts}@company.com`;
  const password = 'Password@123';

  let studentAToken, studentBToken, recruiterToken;
  let studentAId, studentBId, recruiterId;
  let testJobId, applicationId, noteId;

  // 1. Register Student A, Student B, Recruiter
  console.log('1️⃣ Registering test accounts (Student A, Student B, Recruiter)...');
  const regA = await request(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: {
      email: studentAEmail,
      password,
      role: 'student',
      full_name: 'Ananya Roy',
      phone: '+91 9876543210'
    }
  });
  assert.strictEqual(regA.status, 201, 'Student A registration failed');
  studentAToken = regA.data.data.accessToken;
  studentAId = regA.data.data.user.id;

  const regB = await request(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: {
      email: studentBEmail,
      password,
      role: 'student',
      full_name: 'Vikram Mehta',
      phone: '+91 9876543211'
    }
  });
  assert.strictEqual(regB.status, 201, 'Student B registration failed');
  studentBToken = regB.data.data.accessToken;
  studentBId = regB.data.data.user.id;

  const regR = await request(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: {
      email: recruiterEmail,
      password,
      role: 'recruiter',
      full_name: 'Sarah HR',
      company_name: `Tech Innovators ${ts}`
    }
  });
  assert.strictEqual(regR.status, 201, 'Recruiter registration failed');
  recruiterToken = regR.data.data.accessToken;
  recruiterId = regR.data.data.user.id;
  console.log('   ✅ Test accounts registered successfully.');

  // Populate Student A's skills so match evaluation has data
  await request(`${BASE_URL}/students/skills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentAToken}` },
    body: { skillId: 1, proficiencyLevel: 'expert' }
  });

  // 2. Fetch a published job
  console.log('\n2️⃣ Fetching an available published job...');
  const jobsRes = await request(`${BASE_URL}/jobs?limit=5`, {
    headers: { Authorization: `Bearer ${studentAToken}` }
  });
  assert.ok(jobsRes.data.data.length > 0, 'Should have at least 1 job');
  testJobId = jobsRes.data.data[0].id;
  console.log(`   ✅ Target Job ID: ${testJobId} ("${jobsRes.data.data[0].title}" at ${jobsRes.data.data[0].company_name})`);

  // 3. Student A saves the job to wishlist (status = 'saved')
  console.log('\n3️⃣ Student A saves job to wishlist (status: "saved")...');
  const saveRes = await request(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentAToken}` },
    body: { jobId: testJobId, status: 'saved' }
  });
  assert.strictEqual(saveRes.status, 201);
  assert.strictEqual(saveRes.data.data.status, 'saved');
  applicationId = saveRes.data.data.id;
  console.log(`   ✅ Application created in 'saved' state (ID: ${applicationId})`);

  // 4. Student A tries saving again -> Expect 200 with friendly message
  console.log('\n4️⃣ Testing duplicate save idempotency...');
  const dupSaveRes = await request(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentAToken}` },
    body: { jobId: testJobId, status: 'saved' }
  });
  assert.strictEqual(dupSaveRes.status, 200);
  assert.ok(dupSaveRes.data.message.includes('already saved'));
  console.log('   ✅ Duplicate save handled idempotently.');

  // 5. Student A adds a private interview preparation note
  console.log('\n5️⃣ Student A adds a private note with reminder date...');
  const noteRes = await request(`${BASE_URL}/applications/${applicationId}/notes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentAToken}` },
    body: {
      content: 'Review system design concepts for round 1. Brush up on Redis caching.',
      noteType: 'interview_prep',
      reminderDate: '2026-09-20'
    }
  });
  assert.strictEqual(noteRes.status, 201);
  assert.strictEqual(noteRes.data.data.note_type, 'interview_prep');
  noteId = noteRes.data.data.id;
  console.log(`   ✅ Note added successfully (ID: ${noteId})`);

  // 6. Student A applies for the saved job -> Expect promotion to 'applied' and match calculation
  console.log('\n6️⃣ Student A applies to the saved job (promotion to "applied")...');
  const applyRes = await request(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentAToken}` },
    body: {
      jobId: testJobId,
      status: 'applied',
      coverNote: 'I am highly enthusiastic about this role and bring strong Python & Distributed Systems background.'
    }
  });
  assert.strictEqual(applyRes.status, 200);
  assert.strictEqual(applyRes.data.data.status, 'applied');
  assert.ok(typeof applyRes.data.data.match_score === 'number');
  console.log(`   ✅ Promoted from 'saved' to 'applied'. Match Score: ${applyRes.data.data.match_score}%`);

  // 7. Student A attempts double-application -> Expect 409 Conflict
  console.log('\n7️⃣ Testing double-apply idempotency guard (expecting 409 Conflict)...');
  const dupApplyRes = await request(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentAToken}` },
    body: { jobId: testJobId, status: 'applied' }
  });
  assert.strictEqual(dupApplyRes.status, 409);
  console.log('   ✅ Correctly rejected duplicate application with 409 Conflict.');

  // 8. Security & IDOR Verification: Student B attempts to access Student A's application
  console.log('\n8️⃣ Security & IDOR Test: Student B attempts to view/modify Student A application...');
  const idorGetRes = await request(`${BASE_URL}/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${studentBToken}` }
  });
  assert.strictEqual(idorGetRes.status, 403);
  console.log('   🔒 GET /api/applications/:id denied with 403 Forbidden for unauthorized student.');

  const idorPostRes = await request(`${BASE_URL}/applications/${applicationId}/notes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentBToken}` },
    body: { content: 'Hacked note' }
  });
  assert.strictEqual(idorPostRes.status, 403);
  console.log('   🔒 POST /api/applications/:id/notes denied with 403 Forbidden for unauthorized student.');

  // 9. Status history & Timeline Audit log verification
  console.log('\n9️⃣ Verifying status history timeline audit trail...');
  const appDetails = await request(`${BASE_URL}/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${studentAToken}` }
  });
  assert.strictEqual(appDetails.status, 200);
  const history = appDetails.data.data.history;
  assert.ok(Array.isArray(history) && history.length >= 2, 'Should have at least 2 history records');
  assert.strictEqual(history[0].new_status, 'saved');
  assert.strictEqual(history[1].new_status, 'applied');
  console.log(`   ✅ Status History Verified (${history.length} audit entries):`);
  history.forEach(h => {
    console.log(`      • [${h.created_at}] ${h.previous_status} -> ${h.new_status} (${h.notes})`);
  });

  // 10. Student withdraws application
  console.log('\n🔟 Student A withdraws application...');
  const withdrawRes = await request(`${BASE_URL}/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentAToken}` },
    body: { status: 'withdrawn', notes: 'Accepted an offer at another company' }
  });
  assert.strictEqual(withdrawRes.status, 200);
  assert.strictEqual(withdrawRes.data.data.status, 'withdrawn');
  console.log('   ✅ Application successfully transitioned to "withdrawn".');

  // 11. Student my-applications query
  console.log('\n1️⃣1️⃣ Fetching Student A application pipeline list...');
  const myAppsRes = await request(`${BASE_URL}/applications/my-applications`, {
    headers: { Authorization: `Bearer ${studentAToken}` }
  });
  assert.strictEqual(myAppsRes.status, 200);
  assert.strictEqual(myAppsRes.data.count, 1);
  assert.strictEqual(myAppsRes.data.data[0].notes_count, 1);
  console.log(`   ✅ Pipeline fetched: ${myAppsRes.data.count} items, notes_count = ${myAppsRes.data.data[0].notes_count}`);

  console.log('\n🎉 ALL 11 APPLICATION TRACKING & PIPELINE TESTS PASSED WITH 100% SUCCESS!\n');
}

if (require.main === module) {
  runApplicationPipelineTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
}

module.exports = { runApplicationPipelineTests };
