'use strict';

const assert = require('assert');
const http = require('http');
const { app } = require('../backend/app/server');

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting CareerPath Stage 2: Opportunity Discovery & Matching Verification Suite...');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`📡 Test server running on ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 1. Public Opportunity Directory Listing & Pagination
    console.log('\n🔹 1. Testing Public Opportunity Catalog with Pagination...');
    const listRes = await request('GET', '/api/opportunities?page=1&limit=6');
    assert.strictEqual(listRes.status, 200, `Expected 200, got ${listRes.status}`);
    assert.strictEqual(listRes.data.success, true);
    assert.strictEqual(listRes.data.limit, 6);
    assert(listRes.data.total >= 15, `Expected at least 15 seeded opportunities, got ${listRes.data.total}`);
    assert.strictEqual(listRes.data.data.length, 6, 'Should return page limit count');
    console.log(`✅ Loaded ${listRes.data.data.length} opportunities out of ${listRes.data.total} total`);

    // 2. Search Filter
    console.log('\n🔹 2. Testing Search Filter (q=Razorpay)...');
    const searchRes = await request('GET', '/api/opportunities?search=Razorpay');
    assert.strictEqual(searchRes.status, 200);
    assert(searchRes.data.data.length >= 1, 'Should find at least 1 Razorpay opportunity');
    assert(searchRes.data.data.some(j => j.company_name === 'Razorpay' || j.title.includes('Razorpay')));
    console.log(`✅ Search correctly returned ${searchRes.data.data.length} opportunity for Razorpay`);

    // 3. Employment Type Filter
    console.log('\n🔹 3. Testing Type Filter (type=internship)...');
    const internRes = await request('GET', '/api/opportunities?type=internship');
    assert.strictEqual(internRes.status, 200);
    assert(internRes.data.data.length >= 5, 'Should have multiple internships');
    assert(internRes.data.data.every(j => j.employment_type === 'internship'), 'All returned must be internships');
    console.log(`✅ Filtered ${internRes.data.data.length} internship opportunities`);

    // 4. Skill Filter
    console.log('\n🔹 4. Testing Skill Filter (skill=React)...');
    const skillRes = await request('GET', '/api/opportunities?skill=React');
    assert.strictEqual(skillRes.status, 200);
    assert(skillRes.data.data.length >= 3, 'Should have opportunities requiring React');
    console.log(`✅ Filtered ${skillRes.data.data.length} opportunities requiring React`);

    // 5. Authenticated Student Matching
    console.log('\n🔹 5. Testing Real-Time Student Skill Matching with Aarav Sharma...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'aarav.sharma@careerpath.edu',
      password: 'StudentPass123!'
    });
    assert.strictEqual(loginRes.status, 200, `Login failed with ${loginRes.status}`);
    const studentToken = loginRes.data.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${studentToken}` };

    const matchedOppsRes = await request('GET', '/api/opportunities', null, authHeaders);
    assert.strictEqual(matchedOppsRes.status, 200);
    assert.strictEqual(matchedOppsRes.data.hasStudentProfile, true, 'Should recognize student profile');
    const matchedJobs = matchedOppsRes.data.data;
    assert(matchedJobs.length > 0);
    assert(matchedJobs[0].match_score !== undefined, 'Should calculate match_score on opportunities');
    
    // Top job should have high match score
    const topMatch = matchedJobs[0];
    console.log(`Top Matched Opportunity: "${topMatch.title}" at ${topMatch.company_name} — Match: ${topMatch.match_score}% (Grade ${topMatch.match_grade})`);
    console.log(`Matched Skills: ${topMatch.matched_skills?.join(', ') || 'None'}`);
    assert(topMatch.match_score >= 70, 'Aarav should match top opportunities with >= 70% fit');
    console.log('✅ Weighted match score calculated and sorted dynamically');

    // 6. Minimum Match Score Filter
    console.log('\n🔹 6. Testing Min Match Filter (minMatch=75)...');
    const highMatchRes = await request('GET', '/api/opportunities?minMatch=75', null, authHeaders);
    assert.strictEqual(highMatchRes.status, 200);
    assert(highMatchRes.data.data.every(j => j.match_score >= 75), 'All returned jobs must have match_score >= 75%');
    console.log(`✅ Filtered ${highMatchRes.data.data.length} opportunities matching >= 75%`);

    // 7. Opportunity Detail View with Breakdown
    console.log('\n🔹 7. Testing Detailed Opportunity View & Explanation (/api/opportunities/:id)...');
    const detailRes = await request('GET', `/api/opportunities/${topMatch.id}`, null, authHeaders);
    assert.strictEqual(detailRes.status, 200);
    assert(detailRes.data.data.match, 'Should return full match analysis for student');
    assert(detailRes.data.data.match.breakdown, 'Should return score breakdown');
    assert(detailRes.data.data.match.explanation, 'Should return tailored human-readable explanation');
    console.log(`Explanation Preview: "${detailRes.data.data.match.explanation.slice(0, 100)}..."`);
    console.log('✅ Detailed match breakdown & explanation verified');

    console.log('\n🎉 ALL 7 CAREERPATH OPPORTUNITY DISCOVERY & MATCHING TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  if (server) server.close();
  process.exit(1);
});
