'use strict';

const express = require('express');
const router = express.Router();
const studentRepo = require('../../repositories/studentRepository');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole, verifyCandidateAccess } = require('../../core/authorization/rbac');

// Helper to get authenticated student's profile ID
async function getStudentProfileId(userId) {
  const profile = await studentRepo.findByUserId(userId);
  return profile ? profile.id : null;
}

// GET /api/students/me
router.get('/me', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    if (!studentId) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({ success: true, data: fullProfile });
  } catch (err) {
    next(err);
  }
});

// PUT /api/students/me
router.put('/me', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    if (!studentId) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }
    const updated = await studentRepo.updateProfile(studentId, req.body);
    return res.json({ success: true, data: updated, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/education
router.post('/me/education', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const { institution, degree, field_of_study, start_year, end_year, grade_or_cgpa } = req.body || {};
    if (!institution || !degree) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Institution and degree are required' });
    }
    await studentRepo.addEducation(studentId, { institution, degree, field_of_study, start_year, end_year, grade_or_cgpa });
    const education = await studentRepo.getEducation(studentId);
    return res.status(201).json({ success: true, data: education, message: 'Education added successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/education/:id
router.delete('/me/education/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteEducation(studentId, req.params.id);
    return res.json({ success: true, message: 'Education removed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/experience
router.post('/me/experience', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const { company_name, role_title, location, start_date, end_date, is_current, description } = req.body || {};
    if (!company_name || !role_title) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Company name and role title are required' });
    }
    await studentRepo.addExperience(studentId, { company_name, role_title, location, start_date, end_date, is_current, description });
    const experience = await studentRepo.getExperience(studentId);
    return res.status(201).json({ success: true, data: experience, message: 'Experience added successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/experience/:id
router.delete('/me/experience/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteExperience(studentId, req.params.id);
    return res.json({ success: true, message: 'Experience removed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/projects
router.post('/me/projects', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const { title, description, technologies, project_url, github_url } = req.body || {};
    if (!title) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Project title is required' });
    }
    await studentRepo.addProject(studentId, { title, description, technologies, project_url, github_url });
    const projects = await studentRepo.getProjects(studentId);
    return res.status(201).json({ success: true, data: projects, message: 'Project added successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/projects/:id
router.delete('/me/projects/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteProject(studentId, req.params.id);
    return res.json({ success: true, message: 'Project removed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/skills
router.post('/me/skills', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const { skillId, proficiencyLevel } = req.body || {};
    if (!skillId) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'skillId is required' });
    }
    await studentRepo.addSkill(studentId, skillId, proficiencyLevel || 'intermediate', 'manual');
    const skills = await studentRepo.getSkills(studentId);
    return res.status(201).json({ success: true, data: skills, message: 'Skill added to profile' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/skills/:id
router.delete('/me/skills/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.removeSkill(studentId, req.params.id);
    return res.json({ success: true, message: 'Skill removed from profile' });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id (Protected by OLAC / IDOR defense)
router.get('/:id', authenticateToken, verifyCandidateAccess, async (req, res, next) => {
  try {
    const fullProfile = await studentRepo.getFullProfile(req.params.id);
    if (!fullProfile) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Candidate not found' });
    }
    return res.json({ success: true, data: fullProfile });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
