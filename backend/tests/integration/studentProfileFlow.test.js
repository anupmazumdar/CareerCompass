'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { app, startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await close();
});

test('Student Profile Flow - Profile Update, Completeness, Resumes, and Goals', async () => {
  const uniqueEmail = `student_profile_${Date.now()}@compass.edu`;

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongPassword@123',
      role: 'student',
      fullName: 'Aarav Sharma'
    })
  });
  assert.equal(regRes.status, 201);
  const { data: { accessToken } } = await regRes.json();
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  // 2. Fetch initial profile
  const meRes = await fetch(`${baseUrl}/api/students/me`, { headers: authHeaders });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.success, true);
  assert.equal(meData.data.full_name, 'Aarav Sharma');

  // 3. Check initial completeness report
  const initialCompRes = await fetch(`${baseUrl}/api/students/me/completeness`, { headers: authHeaders });
  assert.equal(initialCompRes.status, 200);
  const initialComp = await initialCompRes.json();
  assert.equal(initialComp.success, true);
  assert.ok(typeof initialComp.data.percentage === 'number');
  assert.ok(initialComp.data.missing.length > 0);

  // 4. Update profile with extended academic & career preference fields
  const updateRes = await fetch(`${baseUrl}/api/students/me`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      headline: 'Aspiring Full Stack Engineer',
      bio: 'Pre-final year CSE student passionate about distributed systems and React.',
      college: 'Indian Institute of Technology, Bombay',
      degree: 'B.Tech',
      branch: 'Computer Science and Engineering',
      current_semester: 6,
      graduation_year: 2026,
      cgpa: 8.9,
      achievements: ['Dean\'s List 2024', 'Hackathon Finalist (Smart India Hackathon)'],
      preferred_roles: ['Full Stack Developer', 'Frontend Engineer'],
      preferred_locations: ['Bengaluru', 'Remote'],
      work_mode_preference: 'hybrid'
    })
  });
  assert.equal(updateRes.status, 200);
  const updatedData = await updateRes.json();
  assert.equal(updatedData.data.college, 'Indian Institute of Technology, Bombay');
  assert.equal(updatedData.data.degree, 'B.Tech');
  assert.equal(updatedData.data.branch, 'Computer Science and Engineering');
  assert.equal(updatedData.data.cgpa, 8.9);
  assert.equal(updatedData.data.work_mode_preference, 'hybrid');

  // 5. Add 3 Skills to satisfy completeness criteria
  const skillsToAdd = [
    { skillId: 1, proficiencyLevel: 'expert' },
    { skillId: 2, proficiencyLevel: 'intermediate' },
    { skillId: 3, proficiencyLevel: 'intermediate' }
  ];
  for (const skill of skillsToAdd) {
    const sRes = await fetch(`${baseUrl}/api/students/me/skills`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(skill)
    });
    assert.equal(sRes.status, 201);
  }

  // 6. Add a Project
  const projRes = await fetch(`${baseUrl}/api/students/me/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Distributed Task Queue',
      description: 'Built a high-throughput job queue in Node.js and Redis with at-least-once delivery.',
      technologies: ['Node.js', 'Redis', 'Docker'],
      github_url: 'https://github.com/aarav/task-queue'
    })
  });
  assert.equal(projRes.status, 201);

  // 7. Resume Version Management: Add v1 (Full Stack) and v2 (Backend)
  const resume1Res = await fetch(`${baseUrl}/api/students/me/resumes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      version_label: 'Full Stack Tech Lead',
      file_name: 'Aarav_FullStack_2026.pdf',
      file_path: '/uploads/resumes/aarav_fs.pdf',
      file_size: 1048576,
      mime_type: 'application/pdf',
      raw_text: 'Full Stack engineer with React and Node.js experience...',
      is_primary: true
    })
  });
  assert.equal(resume1Res.status, 201);
  const resume1 = (await resume1Res.json()).data;
  assert.equal(resume1.is_primary, 1);

  const resume2Res = await fetch(`${baseUrl}/api/students/me/resumes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      version_label: 'Backend & Systems',
      file_name: 'Aarav_Backend_2026.pdf',
      file_path: '/uploads/resumes/aarav_backend.pdf',
      file_size: 848576,
      mime_type: 'application/pdf',
      raw_text: 'Backend engineer specializing in distributed databases...',
      is_primary: false
    })
  });
  assert.equal(resume2Res.status, 201);
  const resume2 = (await resume2Res.json()).data;
  assert.equal(resume2.is_primary, 0);

  // 8. Change primary resume to v2
  const setPrimaryRes = await fetch(`${baseUrl}/api/students/me/resumes/${resume2.id}/primary`, {
    method: 'PUT',
    headers: authHeaders
  });
  assert.equal(setPrimaryRes.status, 200);

  // Verify v2 is now primary
  const resumesListRes = await fetch(`${baseUrl}/api/students/me/resumes`, { headers: authHeaders });
  const resumesList = (await resumesListRes.json()).data;
  const v2InList = resumesList.find((r) => r.id === resume2.id);
  assert.equal(v2InList.is_primary, 1);

  // 9. Delete v2 (primary) -> verify v1 automatically promoted to primary
  const delResumeRes = await fetch(`${baseUrl}/api/students/me/resumes/${resume2.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.equal(delResumeRes.status, 200);
  const remainingResumes = (await delResumeRes.json()).data;
  assert.equal(remainingResumes.length, 1);
  assert.equal(remainingResumes[0].id, resume1.id);
  assert.equal(remainingResumes[0].is_primary, 1);

  // 10. Student Goals: Create, Update, and Fetch
  const goalRes = await fetch(`${baseUrl}/api/students/me/goals`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Master GraphQL & System Design',
      description: 'Complete 30 system design problems and build a federated GraphQL gateway.',
      category: 'skill',
      target_date: '2026-10-31',
      status: 'in_progress'
    })
  });
  assert.equal(goalRes.status, 201);
  const createdGoal = (await goalRes.json()).data;
  assert.equal(createdGoal.title, 'Master GraphQL & System Design');
  assert.equal(createdGoal.status, 'in_progress');

  // Update Goal to completed
  const updateGoalRes = await fetch(`${baseUrl}/api/students/me/goals/${createdGoal.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'completed'
    })
  });
  assert.equal(updateGoalRes.status, 200);
  const updatedGoal = (await updateGoalRes.json()).data;
  assert.equal(updatedGoal.status, 'completed');

  // Verify completeness score is substantially higher now
  const finalCompRes = await fetch(`${baseUrl}/api/students/me/completeness`, { headers: authHeaders });
  const finalComp = (await finalCompRes.json()).data;
  assert.ok(finalComp.percentage >= 70, `Expected score >= 70%, got ${finalComp.percentage}%`);

  // 11. Security Check: Student CANNOT access Recruiter or Superadmin APIs
  const recruiterRouteRes = await fetch(`${baseUrl}/api/recruiters/me`, { headers: authHeaders });
  assert.equal(recruiterRouteRes.status, 403);

  const adminRouteRes = await fetch(`${baseUrl}/api/admin/metrics`, { headers: authHeaders });
  assert.equal(adminRouteRes.status, 403);

  // 12. Grounded AI Career Assistant: Check chat advice grounded in student profile
  const aiChatRes = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'What skills should I learn to improve my match score?' }]
    })
  });
  assert.equal(aiChatRes.status, 200);
  const aiChatData = await aiChatRes.json();
  assert.equal(aiChatData.success, true);
  assert.ok(aiChatData.data.reply);
  assert.ok(aiChatData.data.modelUsed);
});
