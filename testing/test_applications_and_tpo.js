'use strict';

const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../api/[...talentai]');

const JWT_SECRET = process.env.JWT_SECRET || 'talentai-jwt-secret-key-2024';

async function runTests() {
  console.log('🧪 Starting Application Tracker & TPO Analytics Tests...');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // Generate test JWT for student and admin
    // Note: User must exist in users array for authenticateToken.
    // Let's create an account via /api/auth/register or inspect default users
    const studentEmail = `student_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: studentEmail,
        password: 'Password123!',
        userType: 'candidate'
      })
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, 'Student registration should succeed');
    const studentToken = regData.token;
    assert.ok(studentToken, 'Should receive student JWT token');
    console.log('✅ Student registered and authenticated');

    // Admin token directly signed for seeded superadmin
    const adminEmail = (process.env.SUPERADMIN_EMAIL || 'anupmazumdar987@gmail.com').toLowerCase();
    const adminToken = jwt.sign(
      { userId: 1, email: adminEmail, userType: 'superadmin', role: 'superadmin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Superadmin authenticated via token');

    // Test 1: GET /api/applications/my-applications (initially empty or default)
    console.log('Test 1: GET /api/applications/my-applications');
    const res1 = await fetch(`${baseUrl}/api/applications/my-applications`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(data1.success, true);
    assert.ok(Array.isArray(data1.applications));
    console.log(`✅ Fetched my-applications: ${data1.applications.length} items`);

    // Test 2: POST /api/applications (Apply to Opportunity 1)
    console.log('Test 2: POST /api/applications');
    const res2 = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        opportunityId: 1,
        status: 'Wishlist',
        notes: 'Targeting frontend internship'
      })
    });
    const data2 = await res2.json();
    assert.strictEqual(res2.status, 201, 'Should create application');
    assert.strictEqual(data2.success, true);
    assert.strictEqual(data2.application.status, 'Wishlist');
    assert.strictEqual(data2.application.opportunityId, 1);
    const createdAppId = data2.application.id;
    console.log(`✅ Created application #${createdAppId} in Wishlist status`);

    // Test 3: Duplicate application check (409 Conflict)
    console.log('Test 3: Prevent duplicate application');
    const res3 = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        opportunityId: 1,
        status: 'Applied'
      })
    });
    assert.strictEqual(res3.status, 409, 'Duplicate application must return 409 Conflict');
    console.log('✅ Duplicate application prevented with 409 Conflict');

    // Test 4: PATCH /api/applications/:id/status (Move to In-Assessment)
    console.log('Test 4: PATCH /api/applications/:id/status');
    const res4 = await fetch(`${baseUrl}/api/applications/${createdAppId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        status: 'In-Assessment',
        notes: 'Started technical assessment pipeline'
      })
    });
    const data4 = await res4.json();
    assert.strictEqual(res4.status, 200);
    assert.strictEqual(data4.application.status, 'In-Assessment');
    assert.ok(data4.application.history.length >= 2, 'History audit log should exist');
    console.log(`✅ Application status transitioned to In-Assessment with audit trail`);

    // Test 5: GET /api/tpo/analytics
    console.log('Test 5: GET /api/tpo/analytics (SuperAdmin only)');
    const res5 = await fetch(`${baseUrl}/api/tpo/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data5 = await res5.json();
    assert.strictEqual(res5.status, 200, 'TPO analytics should return 200');
    assert.strictEqual(data5.success, true);
    assert.ok(data5.data.batchReadiness, 'batchReadiness metric required');
    assert.ok(data5.data.placementFunnel, 'placementFunnel metric required');
    assert.ok(data5.data.skillGapHeatmap, 'skillGapHeatmap metric required');
    console.log('✅ TPO Analytics verified:');
    console.log('   - Batch Readiness:', data5.data.batchReadiness);
    console.log('   - Placement Funnel Stages:', data5.data.placementFunnel.stages);
    console.log('   - Top Missing Skills:', data5.data.skillGapHeatmap.topMissingSkills.slice(0, 3));

    // Test 6: DELETE /api/applications/:id (Withdraw application)
    console.log('Test 6: DELETE /api/applications/:id');
    const res6 = await fetch(`${baseUrl}/api/applications/${createdAppId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data6 = await res6.json();
    assert.strictEqual(res6.status, 200);
    assert.strictEqual(data6.success, true);
    console.log('✅ Application successfully withdrawn');

    console.log('🎉 All Application Tracker & TPO Analytics Backend Tests PASSED!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
