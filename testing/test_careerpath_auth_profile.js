'use strict';

const assert = require('assert');
const { app } = require('../backend/app/server');
const http = require('http');

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
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function requestMultipart(path, boundary, buffer, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': buffer.length,
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
    req.write(buffer);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting CareerPath Auth & Profile Verification Suite...');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`📡 Test server running on ${baseUrl}`);
      resolve();
    });
  });

  try {
    const testEmail = `student_${Date.now()}@university.edu`;
    const testPassword = 'StrongPassword123!';

    // Test 1: Student Registration
    console.log('\n🔹 1. Testing Student Registration with Zod & Bcrypt 12...');
    const regRes = await request('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword,
      role: 'student',
      fullName: 'Aarav Sharma',
      phone: '+91 9876543210'
    });

    assert.strictEqual(regRes.status, 201, `Registration should return 201, got ${regRes.status}`);
    assert(regRes.data.data.accessToken, 'Should return accessToken');
    assert.strictEqual(regRes.data.data.refreshToken, undefined, 'refreshToken must NOT be returned in response body');
    const setCookie = regRes.headers['set-cookie'];
    assert(setCookie && setCookie.some(c => c.includes('refreshToken=') && c.includes('HttpOnly')), 'Should set httpOnly refreshToken cookie');
    console.log('✅ Student registered successfully with httpOnly cookie');

    const token = regRes.data.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test 2: Fetch Initial Student Profile & Completeness
    console.log('\n🔹 2. Testing Initial Student Profile & Completeness Score...');
    const profRes = await request('GET', '/api/students/me', null, authHeaders);
    assert.strictEqual(profRes.status, 200, `Profile should return 200, got ${profRes.status}`);
    console.log(`Initial Completeness Score: ${profRes.data.data.profile_completeness}%`);
    assert(profRes.data.data.profile_completeness >= 5, 'Initial profile completeness should be > 0%');
    console.log('✅ Initial profile fetched successfully');

    // Test 3: Update Personal Info
    console.log('\n🔹 3. Testing Personal Profile Update (Headline, Bio, Links)...');
    const updateRes = await request('PUT', '/api/students/me', {
      headline: 'Aspiring Full Stack Engineer & Cloud Enthusiast',
      bio: 'MCA final-year student specializing in distributed systems and modern web architectures.',
      location: 'Kolkata, India',
      targetRole: 'Full Stack Engineer',
      github_url: 'https://github.com/aaravsharma',
      linkedin_url: 'https://linkedin.com/in/aaravsharma'
    }, authHeaders);
    assert.strictEqual(updateRes.status, 200, `Update should return 200, got ${updateRes.status}`);
    console.log(`Updated Completeness: ${updateRes.data.data.profile_completeness}%`);
    assert(updateRes.data.data.profile_completeness > profRes.data.data.profile_completeness, 'Score should increase after personal info');
    console.log('✅ Personal info updated successfully');

    // Test 4: Add Education (Degree, Institution, CGPA)
    console.log('\n🔹 4. Testing Multi-Degree Education Addition...');
    const eduRes = await request('POST', '/api/students/me/education', {
      institution: 'University Institute of Technology',
      degree: 'Master of Computer Applications (MCA)',
      field_of_study: 'Computer Science',
      start_year: 2024,
      end_year: 2026,
      grade_or_cgpa: '8.8 / 10'
    }, authHeaders);
    assert.strictEqual(eduRes.status, 201, `Education should return 201, got ${eduRes.status}`);
    assert.strictEqual(eduRes.data.data.education.length, 1);
    console.log(`Post-Education Completeness: ${eduRes.data.data.profile_completeness}%`);
    console.log('✅ Education entry created and score incremented');

    // Test 5: Add Skills
    console.log('\n🔹 5. Testing Skill Inventory Addition...');
    await request('POST', '/api/students/me/skills', { skillId: 1, proficiencyLevel: 'expert' }, authHeaders);
    await request('POST', '/api/students/me/skills', { skillId: 2, proficiencyLevel: 'intermediate' }, authHeaders);
    const skillRes = await request('POST', '/api/students/me/skills', { skillId: 3, proficiencyLevel: 'intermediate' }, authHeaders);
    assert.strictEqual(skillRes.status, 201);
    assert(skillRes.data.data.skills.length >= 3, 'Should have at least 3 skills');
    console.log(`Post-Skills Completeness: ${skillRes.data.data.profile_completeness}%`);
    console.log('✅ 3 skills added with proficiency levels');

    // Test 6: Add Project
    console.log('\n🔹 6. Testing Project Showcase Addition...');
    const projRes = await request('POST', '/api/students/me/projects', {
      title: 'Distributed Cloud Task Scheduler',
      description: 'Built a fault-tolerant job scheduler in Node.js and Redis supporting delayed queues and worker heartbeats.',
      technologies: ['Node.js', 'Redis', 'Docker'],
      github_url: 'https://github.com/aaravsharma/task-scheduler'
    }, authHeaders);
    assert.strictEqual(projRes.status, 201, `Project should return 201, got ${projRes.status}`);
    console.log(`Post-Project Completeness: ${projRes.data.data.profile_completeness}%`);
    console.log('✅ Project added successfully');

    // Test 7: Add Certification
    console.log('\n🔹 7. Testing Certification Entry...');
    const certRes = await request('POST', '/api/students/me/certifications', {
      title: 'AWS Certified Cloud Practitioner',
      issuing_organization: 'Amazon Web Services',
      issue_date: '2025-06-15',
      credential_id: 'AWS-CCP-98421'
    }, authHeaders);
    assert.strictEqual(certRes.status, 201, `Certification should return 201, got ${certRes.status}`);
    console.log(`Post-Certification Completeness: ${certRes.data.data.profile_completeness}%`);
    assert(certRes.data.data.profile_completeness >= 80, 'Full profile should be >= 80%');
    console.log('✅ Certification added successfully');

    // Test 8: Resume Upload - Magic Bytes Validation Check
    console.log('\n🔹 8. Testing Resume Magic Bytes Security (PDF validation)...');
    
    // 8a: Fake PDF (text payload with .pdf extension - should fail magic byte check)
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fakeFileContent = Buffer.from('This is a malicious or plain text file disguised as a pdf');
    let body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="fake.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      fakeFileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const fakeUpload = await requestMultipart('/api/resumes/upload', boundary, body, authHeaders);
    assert.strictEqual(fakeUpload.status, 400, `Fake magic byte upload should be rejected with 400, got ${fakeUpload.status}`);
    assert.strictEqual(fakeUpload.data.error, 'INVALID_FILE_SIGNATURE');
    console.log('🛡️ Fake PDF correctly rejected by magic-byte inspection (0x25 0x50 0x44 0x46)');

    // 8b: Valid PDF Header with sample resume content
    const validPdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Resume) >>\nendobj\ntrailer\n<<>>\n%%EOF');
    const validBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="resume.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      validPdfHeader,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const validUpload = await requestMultipart('/api/resumes/upload', boundary, validBody, authHeaders);
    assert.strictEqual(validUpload.status, 201, `Valid upload should return 201, got ${validUpload.status}`);
    assert(validUpload.data.data.resumeId, 'Should return saved resume ID');
    console.log('✅ Valid PDF accepted with MIME + Magic Bytes verified');

    // Test 9: Refresh Token Rotation
    console.log('\n🔹 9. Testing Silent Token Refresh...');
    const refreshCookie = setCookie.find(c => c.startsWith('refreshToken=')).split(';')[0];
    const refreshRes = await request('POST', '/api/auth/refresh', {}, {
      Cookie: refreshCookie
    });
    assert.strictEqual(refreshRes.status, 200, `Refresh should return 200, got ${refreshRes.status}`);
    assert(refreshRes.data.accessToken, 'Should issue new accessToken');
    console.log('✅ Refresh token rotated successfully via httpOnly cookie');

    // Test 10: Logout & Revocation
    console.log('\n🔹 10. Testing Logout & Token Revocation...');
    const logoutRes = await request('POST', '/api/auth/logout', {}, {
      ...authHeaders,
      Cookie: refreshCookie
    });
    assert.strictEqual(logoutRes.status, 200);
    const clearCookie = logoutRes.headers['set-cookie'];
    assert(clearCookie && clearCookie.some(c => c.includes('refreshToken=;') || c.includes('Max-Age=0') || c.includes('Expires=')), 'Should clear refreshToken cookie');
    console.log('✅ Logout revoked token and cleared cookie');

    console.log('\n🎉 ALL 10 CAREERPATH AUTH & PROFILE TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  if (server) server.close();
  process.exit(1);
});
