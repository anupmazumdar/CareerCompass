'use strict';

const assert = require('assert');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001/api';

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

async function runAiAssistantTests() {
  console.log('🚀 Starting CareerPath Stage 5 Tests: Grounded AI Career Assistant & Fallback Chain\n');

  const ts = Date.now();
  const studentEmail = `ai.assistant.${ts}@careerpath.edu`;
  const recruiterEmail = `ai.recruiter.${ts}@company.com`;
  const password = 'Password@123';

  // 1. Register Student Account
  console.log('1️⃣ Registering test student profile with rich background...');
  const regRes = await request(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: {
      email: studentEmail,
      password,
      role: 'student',
      full_name: 'Kavya Subramanian',
      phone: '+91 9988776655'
    }
  });
  assert.strictEqual(regRes.status, 201);
  const studentToken = regRes.data.data.accessToken;

  // Add education
  await request(`${BASE_URL}/students/me/education`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      institution: 'National Institute of Technology',
      degree: 'Master of Computer Applications (MCA)',
      field_of_study: 'Distributed Systems & Cloud Computing',
      start_year: 2024,
      end_year: 2026,
      grade_or_cgpa: '8.9 CGPA'
    }
  });

  // Add project
  await request(`${BASE_URL}/students/me/projects`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      title: 'High-Throughput Distributed Cache Server',
      description: 'Engineered an in-memory key-value cache in Go with LRU eviction and Raft consensus.',
      technologies: ['Go', 'Raft', 'Redis', 'Docker']
    }
  });

  // Add verified skill
  await request(`${BASE_URL}/students/me/skills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { skillId: 3, proficiencyLevel: 'expert' } // Python
  });

  // Save an opportunity to pipeline so grounding has application context
  const jobsRes = await request(`${BASE_URL}/jobs?limit=1`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (jobsRes.data?.data?.length > 0) {
    await request(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { jobId: jobsRes.data.data[0].id, status: 'applied' }
    });
  }
  console.log('   ✅ Student profile and active application seeded.');

  // 2. Test Grounded AI Chat Assistant
  console.log('\n2️⃣ Invoking Grounded AI Career Assistant proxy...');
  const chatRes = await request(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      messages: [
        {
          role: 'user',
          content: 'How can I improve my match score for top Backend Engineering roles and what should I prepare for my upcoming interviews?'
        }
      ]
    }
  });

  assert.strictEqual(chatRes.status, 200, 'Chat request should return 200');
  assert.ok(chatRes.data?.success, 'Response should indicate success');
  const chatData = chatRes.data.data;
  assert.ok(chatData.reply && typeof chatData.reply === 'string', 'Reply should be a non-empty string');
  assert.ok(chatData.modelUsed, 'Should specify model used (OpenRouter free model or local grounded fallback)');
  assert.ok(chatData.groundedContext, 'Should return grounded context summary');
  assert.strictEqual(chatData.groundedContext.studentName, 'Kavya Subramanian');
  assert.ok(chatData.groundedContext.skillsCount >= 1);

  console.log(`   ✅ AI Assistant Responded!`);
  console.log(`      • Model Activated: ${chatData.modelUsed} ${chatData.isFallback ? '(Fallback Active)' : '(Live Upstream)'}`);
  console.log(`      • Grounded Student: ${chatData.groundedContext.studentName} (${chatData.groundedContext.skillsCount} skills, ${chatData.groundedContext.applicationsCount} applications)`);
  console.log(`      • Sample Reply Snippet: "${chatData.reply.slice(0, 140).replace(/\n/g, ' ')}..."`);

  // 3. Security & Validation Verifications
  console.log('\n3️⃣ Security & Validation Verifications...');
  // A. Missing token -> 401
  const unauthRes = await request(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    body: { messages: [{ role: 'user', content: 'Hello' }] }
  });
  assert.strictEqual(unauthRes.status, 401);
  console.log('   🔒 Unauthenticated chat rejected with 401 Unauthorized.');

  // B. Recruiter role -> 403
  const regRec = await request(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: {
      email: recruiterEmail,
      password,
      role: 'recruiter',
      full_name: 'Elena HR'
    }
  });
  const recToken = regRec.data.data.accessToken;

  const recChatRes = await request(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${recToken}` },
    body: { messages: [{ role: 'user', content: 'Recruiter trying student assistant' }] }
  });
  assert.strictEqual(recChatRes.status, 403);
  console.log('   🔒 Recruiter role blocked with 403 Forbidden.');

  // C. Empty messages array -> 400 Validation Error
  const emptyRes = await request(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { messages: [] }
  });
  assert.strictEqual(emptyRes.status, 400);
  console.log('   🔒 Empty messages rejected with 400 Validation Error.');

  console.log('\n🎉 ALL 5 GROUNDED AI CAREER ASSISTANT TESTS PASSED WITH 100% SUCCESS!\n');
}

if (require.main === module) {
  runAiAssistantTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
}

module.exports = { runAiAssistantTests };
