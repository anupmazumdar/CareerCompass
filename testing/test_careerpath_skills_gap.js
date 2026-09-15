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

async function runSkillsGapTests() {
  console.log('🚀 Starting CareerPath Stage 4 Tests: Skills Management & Gap Analysis\n');

  const ts = Date.now();
  const studentEmail = `skills.student.${ts}@careerpath.edu`;
  const recruiterEmail = `skills.recruiter.${ts}@company.com`;
  const password = 'Password@123';

  // 1. Test Public Target Roles Benchmark Endpoint
  console.log('1️⃣ Fetching Target Roles benchmarks...');
  const rolesRes = await request(`${BASE_URL}/skills/roles`);
  assert.strictEqual(rolesRes.status, 200);
  assert.ok(Array.isArray(rolesRes.data.data), 'Roles must be an array');
  assert.ok(rolesRes.data.data.length >= 5, 'Should have at least 5 target roles');
  const roleTitles = rolesRes.data.data.map(r => r.title);
  assert.ok(roleTitles.includes('Full-Stack Developer'));
  assert.ok(roleTitles.includes('Backend Engineer'));
  console.log(`   ✅ Target Roles loaded (${rolesRes.data.data.length} benchmarks): ${roleTitles.join(', ')}`);

  // 2. Test Public Learning Resources Endpoint
  console.log('\n2️⃣ Fetching Curated Learning Resources...');
  const resRes = await request(`${BASE_URL}/skills/resources`);
  assert.strictEqual(resRes.status, 200);
  assert.ok(Array.isArray(resRes.data.data), 'Resources must be an array');
  assert.ok(resRes.data.data.length > 0, 'Should have learning resources seeded');
  console.log(`   ✅ Learning Resources fetched (${resRes.data.data.length} curated tutorials/courses)`);

  // 3. Register Student Account
  console.log('\n3️⃣ Registering test student account...');
  const regRes = await request(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: {
      email: studentEmail,
      password,
      role: 'student',
      full_name: 'Devika Sengupta',
      phone: '+91 9123456780'
    }
  });
  assert.strictEqual(regRes.status, 201);
  const studentToken = regRes.data.data.accessToken;
  console.log('   ✅ Student registered successfully.');

  // 4. Student Skill Inventory: Add Skills
  console.log('\n4️⃣ Managing Student Skill Inventory (Add, Update, Delete)...');
  // Get canonical skills to find IDs
  const allSkillsRes = await request(`${BASE_URL}/skills`);
  const skillsList = allSkillsRes.data.data;
  const pythonSkill = skillsList.find(s => s.canonical_name.toLowerCase() === 'python') || skillsList[0];
  const reactSkill = skillsList.find(s => s.canonical_name.toLowerCase() === 'react') || skillsList[1];
  const nodeSkill = skillsList.find(s => s.canonical_name.toLowerCase() === 'node.js') || skillsList[2];

  // Add Python (expert)
  const add1 = await request(`${BASE_URL}/students/skills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { skillId: pythonSkill.id, proficiencyLevel: 'expert' }
  });
  assert.ok([200, 201].includes(add1.status));

  // Add React (intermediate)
  const add2 = await request(`${BASE_URL}/students/skills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { skillId: reactSkill.id, proficiencyLevel: 'intermediate' }
  });
  assert.ok([200, 201].includes(add2.status));

  // Add Node (beginner)
  const add3 = await request(`${BASE_URL}/students/skills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { skillId: nodeSkill.id, proficiencyLevel: 'beginner' }
  });
  assert.ok([200, 201].includes(add3.status));
  console.log('   ✅ Successfully added 3 skills with varying proficiencies.');

  // Check inventory
  const profileRes = await request(`${BASE_URL}/students/me`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(profileRes.status, 200);
  assert.strictEqual(profileRes.data.data.skills.length, 3);

  // Update proficiency: update Node to 'expert'
  const updateNode = await request(`${BASE_URL}/students/skills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { skillId: nodeSkill.id, proficiencyLevel: 'expert' }
  });
  assert.ok([200, 201].includes(updateNode.status));
  console.log('   ✅ Proficiency updated successfully.');

  // Delete Node skill
  const deleteRes = await request(`${BASE_URL}/students/skills/${nodeSkill.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(deleteRes.status, 200);
  console.log('   ✅ Skill deleted successfully.');

  // Re-add Node so it is part of the gap analysis
  const readdNode = await request(`${BASE_URL}/students/skills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { skillId: nodeSkill.id, proficiencyLevel: 'intermediate' }
  });
  assert.ok([200, 201].includes(readdNode.status));

  // 5. Test Gap Analysis for Target Role: Full-Stack Developer
  console.log('\n5️⃣ Running Target Role Gap Analysis (Full-Stack Developer)...');
  const gapFullstack = await request(`${BASE_URL}/skills/gap-analysis?role=fullstack`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(gapFullstack.status, 200);
  const fsData = gapFullstack.data.data;
  assert.strictEqual(fsData.targetRole.title, 'Full-Stack Developer');
  assert.ok(typeof fsData.readinessScore === 'number');
  assert.ok(fsData.acquiredSkills.length > 0, 'Should have acquired skills');
  assert.ok(fsData.missingSkills.length > 0, 'Should have missing skills');
  assert.ok(Array.isArray(fsData.recommendedResources), 'Should have recommended learning resources');
  console.log(`   ✅ Full-Stack Readiness Score: ${fsData.readinessScore}%`);
  console.log(`      • Acquired (${fsData.acquiredSkills.length}): ${fsData.acquiredSkills.map(s => `${s.name} [${s.proficiency}]`).join(', ')}`);
  console.log(`      • Missing (${fsData.missingSkills.length}): ${fsData.missingSkills.map(s => `${s.name} (${s.priority})`).join(', ')}`);
  console.log(`      • Recommended Resources (${fsData.recommendedResources.length} tutorials ready)`);

  // 6. Test Gap Analysis for Target Role: AI / Data Engineer
  console.log('\n6️⃣ Running Target Role Gap Analysis (AI / Data Engineer)...');
  const gapAi = await request(`${BASE_URL}/skills/gap-analysis?role=ai_data`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(gapAi.status, 200);
  const aiData = gapAi.data.data;
  assert.strictEqual(aiData.targetRole.title, 'AI / Data Engineer');
  console.log(`   ✅ AI / Data Engineer Readiness Score: ${aiData.readinessScore}%`);
  console.log(`      • Acquired (${aiData.acquiredSkills.length}): ${aiData.acquiredSkills.map(s => s.name).join(', ')}`);
  console.log(`      • Missing (${aiData.missingSkills.length}): ${aiData.missingSkills.map(s => s.name).join(', ')}`);

  // 7. Security & Authorization Verifications
  console.log('\n7️⃣ Security Verifications (Unauthenticated & Role Isolation)...');
  // Unauthenticated gap-analysis -> 401
  const unauthRes = await request(`${BASE_URL}/skills/gap-analysis?role=fullstack`);
  assert.strictEqual(unauthRes.status, 401);
  console.log('   🔒 Unauthenticated gap analysis blocked with 401 Unauthorized.');

  // Recruiter account attempting student gap analysis -> 403
  const regRec = await request(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: {
      email: recruiterEmail,
      password,
      role: 'recruiter',
      full_name: 'David HR'
    }
  });
  assert.strictEqual(regRec.status, 201);
  const recToken = regRec.data.data.accessToken;

  const recGapRes = await request(`${BASE_URL}/skills/gap-analysis?role=fullstack`, {
    headers: { Authorization: `Bearer ${recToken}` }
  });
  assert.strictEqual(recGapRes.status, 403);
  console.log('   🔒 Recruiter role blocked with 403 Forbidden on student gap analysis.');

  console.log('\n🎉 ALL 7 SKILLS MANAGEMENT & GAP ANALYSIS TESTS PASSED WITH 100% SUCCESS!\n');
}

if (require.main === module) {
  runSkillsGapTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
}

module.exports = { runSkillsGapTests };
