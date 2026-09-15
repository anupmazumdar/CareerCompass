'use strict';

const assert = require('assert');
const http = require('http');
const app = require('../api/[...talentai]');

async function runTests() {
  console.log('🧪 Starting Opportunity Discovery Module 1 Tests...');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // Test 1: GET /api/opportunities returns seed list
    console.log('Test 1: GET /api/opportunities');
    const res1 = await fetch(`${baseUrl}/api/opportunities`);
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 200, 'Status should be 200');
    assert.strictEqual(data1.success, true, 'success should be true');
    assert.ok(Array.isArray(data1.opportunities), 'opportunities should be array');
    assert.ok(data1.opportunities.length >= 8, 'should have at least 8 seeded opportunities');
    console.log(`✅ Loaded ${data1.opportunities.length} opportunities successfully`);

    // Test 2: Search filter
    console.log('Test 2: Search filter for "React"');
    const res2 = await fetch(`${baseUrl}/api/opportunities?search=React`);
    const data2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.ok(data2.opportunities.length > 0, 'Should find React opportunities');
    console.log(`✅ Found ${data2.opportunities.length} React opportunities`);

    // Test 3: Work type filter
    console.log('Test 3: Work type filter for "remote"');
    const res3 = await fetch(`${baseUrl}/api/opportunities?workType=remote`);
    const data3 = await res3.json();
    assert.strictEqual(res3.status, 200);
    assert.ok(data3.opportunities.every(o => o.workType.toLowerCase() === 'remote'), 'All should be remote');
    console.log(`✅ WorkType remote filter verified (${data3.opportunities.length} found)`);

    // Test 4: Single opportunity details
    console.log('Test 4: GET /api/opportunities/1');
    const res4 = await fetch(`${baseUrl}/api/opportunities/1`);
    const data4 = await res4.json();
    assert.strictEqual(res4.status, 200);
    assert.strictEqual(data4.opportunity.id, 1);
    assert.ok(Array.isArray(data4.opportunity.requiredSkills));
    console.log(`✅ Fetched opportunity #1: ${data4.opportunity.title} at ${data4.opportunity.company}`);

    console.log('🎉 All Opportunity Discovery API tests passed!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
