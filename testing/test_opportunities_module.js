'use strict';

const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../api/[...talentai]');

const JWT_SECRET = process.env.JWT_SECRET || 'talentai-jwt-secret-key-2024';

async function runTests() {
  console.log('🧪 Starting Live Opportunity Creation & Management Tests...');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // Register test candidate
    const studentEmail = `candidate_test_${Date.now()}@example.com`;
    const regCandRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Candidate',
        email: studentEmail,
        password: 'Password123!',
        userType: 'candidate'
      })
    });
    const candData = await regCandRes.json();
    const candidateToken = candData.token;
    assert.ok(candidateToken, 'Should receive candidate token');

    // Register test recruiter
    const recEmail = `recruiter_test_${Date.now()}@testcorp.com`;
    const regRecRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Recruiter',
        email: recEmail,
        password: 'Password123!',
        userType: 'recruiter',
        company: 'TestCorp Innovations'
      })
    });
    const recData = await regRecRes.json();
    const recruiterToken = recData.token;
    assert.ok(recruiterToken, 'Should receive recruiter token');

    // Admin token
    const adminToken = jwt.sign(
      { userId: 9999, email: 'admin@talentai.internal', userType: 'superadmin', role: 'superadmin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Test 1: GET /api/opportunities returns seed list
    console.log('Test 1: GET /api/opportunities returns active opportunities');
    const res1 = await fetch(`${baseUrl}/api/opportunities`);
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 200, 'Status should be 200');
    assert.strictEqual(data1.success, true, 'success should be true');
    assert.ok(Array.isArray(data1.opportunities), 'opportunities should be array');
    const initialCount = data1.opportunities.length;
    console.log(`✅ Initially loaded ${initialCount} opportunities`);

    // Test 2: Candidate CANNOT create opportunity (403 Forbidden)
    console.log('Test 2: Security check - Candidate cannot create opportunity');
    const candPostRes = await fetch(`${baseUrl}/api/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candidateToken}`
      },
      body: JSON.stringify({
        title: 'Hacked Opportunity',
        company: 'Malicious Inc',
        description: 'Should be rejected',
        location: 'Nowhere',
        requiredSkills: ['Hacking']
      })
    });
    assert.strictEqual(candPostRes.status, 403, 'Candidate posting opportunity should return 403 Forbidden');
    console.log('✅ Security check passed: Candidate rejected with 403');

    // Test 3: Recruiter CAN create opportunity (POST /api/opportunities)
    console.log('Test 3: Recruiter creates live opportunity manually');
    const newJobPayload = {
      title: 'Senior Full Stack Engineer',
      company: 'TestCorp Innovations',
      description: 'Lead backend and frontend architecture for our hypergrowth AI platform.',
      location: 'Bengaluru, India',
      workType: 'hybrid',
      employmentType: 'full-time',
      experienceLevel: 'mid',
      minSalary: 1800000,
      maxSalary: 3000000,
      deadline: '2026-12-31',
      requiredSkills: ['Node.js', 'React', 'PostgreSQL', 'Docker', 'System Design']
    };

    const recPostRes = await fetch(`${baseUrl}/api/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recruiterToken}`
      },
      body: JSON.stringify(newJobPayload)
    });
    const recPostData = await recPostRes.json();
    assert.strictEqual(recPostRes.status, 201, 'Status should be 201 Created');
    assert.strictEqual(recPostData.success, true);
    assert.strictEqual(recPostData.opportunity.title, newJobPayload.title);
    assert.strictEqual(recPostData.opportunity.company, 'TestCorp Innovations');
    assert.deepStrictEqual(recPostData.opportunity.requiredSkills, newJobPayload.requiredSkills);
    const createdOppId = recPostData.opportunity.id;
    console.log(`✅ Recruiter successfully created opportunity ID #${createdOppId}: "${recPostData.opportunity.title}"`);

    // Test 4: Live opportunity appears in public Opportunity Discovery list
    console.log('Test 4: Verify new opportunity is discoverable in GET /api/opportunities');
    const resListAfter = await fetch(`${baseUrl}/api/opportunities`);
    const dataListAfter = await resListAfter.json();
    assert.strictEqual(dataListAfter.opportunities.length, initialCount + 1);
    const foundOpp = dataListAfter.opportunities.find(o => o.id === createdOppId);
    assert.ok(foundOpp, 'New opportunity must be present in discovery list');
    assert.strictEqual(foundOpp.title, newJobPayload.title);
    console.log('✅ Verified live opportunity appears in Opportunity Discovery list');

    // Test 5: Search filter finds the newly created opportunity
    console.log('Test 5: Search filter for "TestCorp" finds the new job');
    const searchRes = await fetch(`${baseUrl}/api/opportunities?search=TestCorp`);
    const searchData = await searchRes.json();
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchData.opportunities.some(o => o.id === createdOppId));
    console.log('✅ Search filter finds the new opportunity');

    // Test 6: Admin creates opportunity manually
    console.log('Test 6: Admin creates live opportunity manually');
    const adminJobPayload = {
      title: 'Principal AI Architect',
      company: 'TalentAI Labs',
      description: 'Design multi-agent LLM systems and autonomous workflow orchestration engines.',
      location: 'Remote, Global',
      workType: 'remote',
      employmentType: 'full-time',
      experienceLevel: 'senior',
      requiredSkills: ['Python', 'LangChain', 'FastAPI', 'Kubernetes']
    };
    const adminPostRes = await fetch(`${baseUrl}/api/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(adminJobPayload)
    });
    const adminPostData = await adminPostRes.json();
    assert.strictEqual(adminPostRes.status, 201);
    assert.strictEqual(adminPostData.success, true);
    const adminOppId = adminPostData.opportunity.id;
    console.log(`✅ Admin successfully created opportunity ID #${adminOppId}`);

    // Test 7: Recruiter updates their opportunity (PUT /api/opportunities/:id)
    console.log('Test 7: Recruiter updates their opportunity');
    const updateRes = await fetch(`${baseUrl}/api/opportunities/${createdOppId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recruiterToken}`
      },
      body: JSON.stringify({
        title: 'Lead Full Stack & Cloud Architect',
        minSalary: 2200000
      })
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.opportunity.title, 'Lead Full Stack & Cloud Architect');
    assert.strictEqual(updateData.opportunity.minSalary, 2200000);
    console.log('✅ Opportunity updated successfully');

    // Test 8: Candidate applies to the live opportunity
    console.log('Test 8: Candidate applies to the newly created live opportunity');
    const applyRes = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candidateToken}`
      },
      body: JSON.stringify({
        opportunityId: createdOppId,
        matchScore: 88,
        matchTier: 'Strong',
        stage: 'Opportunity Selected',
        status: 'applied',
        notes: 'Very excited to build with TestCorp!'
      })
    });
    const applyData = await applyRes.json();
    assert.strictEqual(applyRes.status, 201);
    assert.strictEqual(applyData.success, true);
    console.log('✅ Candidate applied to live opportunity successfully');

    // Test 9: Recruiter deletes opportunity (DELETE /api/opportunities/:id)
    console.log('Test 9: Recruiter deletes their opportunity');
    const delRes = await fetch(`${baseUrl}/api/opportunities/${createdOppId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${recruiterToken}` }
    });
    const delData = await delRes.json();
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delData.success, true);
    console.log('✅ Opportunity deleted successfully');

    // Test 10: Admin deletes admin opportunity
    console.log('Test 10: Admin deletes opportunity');
    const delAdminRes = await fetch(`${baseUrl}/api/opportunities/${adminOppId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(delAdminRes.status, 200);
    console.log('✅ Admin opportunity deleted successfully');

    // Test 11: Verify deleted opportunity is gone from discovery
    const finalRes = await fetch(`${baseUrl}/api/opportunities`);
    const finalData = await finalRes.json();
    assert.strictEqual(finalData.opportunities.some(o => o.id === createdOppId), false);
    assert.strictEqual(finalData.opportunities.some(o => o.id === adminOppId), false);
    console.log('✅ Discovery list confirmed clean after deletions');

    console.log('🎉 All 11 Live Opportunity Creation & Management tests passed successfully!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
