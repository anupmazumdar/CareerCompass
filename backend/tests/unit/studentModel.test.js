'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../app/core/database/connection');
const studentRepo = require('../../app/repositories/studentRepository');
const opportunityRepo = require('../../app/repositories/opportunityRepository');

test('Student Model & Multi-Resume Versioning Unit Tests', async () => {
  // 1. Create a dummy test user
  const email = `test_student_unit_${Date.now()}@careercompass.edu`;
  const userRes = await db.run(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES (?, 'hash123', 'student', 'Unit Test Student', 'active')`,
    [email]
  );
  const userId = userRes.lastID;

  // 2. Create student profile with extended academic fields
  const profile = await studentRepo.createProfile(userId, {
    headline: 'Aspiring Full Stack Engineer',
    bio: 'Passionate about React and distributed systems.',
    location: 'Bangalore, India',
    college: 'Indian Institute of Information Technology',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    current_semester: 6,
    graduation_year: 2026,
    cgpa: 8.95,
    achievements: ['Smart India Hackathon Winner 2025', 'Published Paper in IEEE'],
    github_url: 'https://github.com/student',
    linkedin_url: 'https://linkedin.com/in/student',
    preferred_roles: ['Software Engineer', 'Frontend Developer'],
    preferred_locations: ['Bangalore', 'Remote'],
    work_mode_preference: 'hybrid'
  });

  assert.ok(profile.id, 'Profile ID must exist');
  assert.equal(profile.college, 'Indian Institute of Information Technology');
  assert.equal(profile.degree, 'B.Tech');
  assert.equal(profile.branch, 'Computer Science & Engineering');
  assert.equal(profile.current_semester, 6);
  assert.equal(profile.graduation_year, 2026);
  assert.equal(profile.cgpa, 8.95);
  assert.equal(profile.work_mode_preference, 'hybrid');

  // 3. Multi-resume versioning: Add first resume (primary)
  const resume1 = await studentRepo.addResume(profile.id, {
    fileName: 'resume_swe_2026.pdf',
    filePath: '/uploads/resumes/resume_1.pdf',
    mimeType: 'application/pdf',
    fileSize: 104200,
    versionLabel: 'SWE Focus v1',
    isPrimary: true
  });
  assert.equal(resume1.is_primary, 1);
  assert.equal(resume1.version_label, 'SWE Focus v1');

  // Add second resume as primary -> first resume must now be is_primary = 0
  const resume2 = await studentRepo.addResume(profile.id, {
    fileName: 'resume_frontend_2026.pdf',
    filePath: '/uploads/resumes/resume_2.pdf',
    mimeType: 'application/pdf',
    fileSize: 98000,
    versionLabel: 'Frontend Focus v2',
    isPrimary: true
  });
  assert.equal(resume2.is_primary, 1);

  const resumesAfterSecond = await studentRepo.getResumes(profile.id);
  assert.equal(resumesAfterSecond.length, 2);
  const oldResume = resumesAfterSecond.find(r => r.id === resume1.id);
  assert.equal(oldResume.is_primary, 0, 'First resume must be demoted from primary');

  // Delete primary resume -> second resume should be promoted or handled safely
  await studentRepo.deleteResume(profile.id, resume2.id);
  const resumesAfterDelete = await studentRepo.getResumes(profile.id);
  assert.equal(resumesAfterDelete.length, 1);
  assert.equal(resumesAfterDelete[0].is_primary, 1, 'Remaining resume must be primary');

  // 4. Goals management
  const goal = await studentRepo.addGoal(profile.id, {
    title: 'Master System Design & Microservices',
    category: 'skill',
    targetDate: '2026-10-31'
  });
  assert.ok(goal.id);
  assert.equal(goal.title, 'Master System Design & Microservices');
  assert.equal(goal.status, 'in_progress');

  const updatedGoal = await studentRepo.updateGoal(profile.id, goal.id, { status: 'completed' });
  assert.equal(updatedGoal.status, 'completed');

  // 5. Profile completeness calculation
  const completeness = studentRepo.calculateProfileCompleteness({
    ...profile,
    resumes: resumesAfterDelete,
    skills: [{ id: 1 }, { id: 2 }, { id: 3 }],
    projects: [{ id: 1, title: 'Demo' }],
    education: [{ id: 1, degree: 'B.Tech' }]
  });

  assert.ok(completeness.percentage >= 80, `Expected completeness >= 80%, got ${completeness.percentage}`);
  assert.ok(Array.isArray(completeness.checklist), 'Checklist must be an array');
  assert.ok(Array.isArray(completeness.missing), 'Missing must be an array');

  // 6. Opportunities & Saved Bookmarks
  const opp = await opportunityRepo.create({
    title: 'Software Development Engineer Intern',
    company: 'Razorpay',
    type: 'Internship',
    description: 'Build high-scale payment gateways',
    requiredSkills: ['Node.js', 'React', 'PostgreSQL'],
    location: 'Bangalore',
    workMode: 'hybrid',
    minCgpa: 8.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Technology'],
    eligibleGradYears: [2026, 2027],
    stipendRange: '₹40,000 - ₹50,000 / month',
    deadline: '2026-11-30T23:59:59Z'
  });
  assert.ok(opp.id);
  assert.equal(opp.type, 'Internship');
  assert.equal(opp.min_cgpa, 8.0);
  assert.deepEqual(opp.required_skills, ['Node.js', 'React', 'PostgreSQL']);

  // Save / Bookmark Opportunity
  await opportunityRepo.saveOpportunity(profile.id, opp.id);
  const isSaved = await opportunityRepo.isOpportunitySaved(profile.id, opp.id);
  assert.equal(isSaved, true);

  const savedList = await opportunityRepo.getSavedOpportunities(profile.id);
  assert.equal(savedList.length, 1);
  assert.equal(savedList[0].id, opp.id);

  // Unsave Opportunity
  await opportunityRepo.unsaveOpportunity(profile.id, opp.id);
  const isSavedAfterUnsave = await opportunityRepo.isOpportunitySaved(profile.id, opp.id);
  assert.equal(isSavedAfterUnsave, false);
});
