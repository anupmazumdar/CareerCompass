'use strict';

const express = require('express');
const router = express.Router();
const studentRepo = require('../../repositories/studentRepository');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole, verifyCandidateAccess } = require('../../core/authorization/rbac');
const { validate } = require('../../middleware/validate');
const {
  personalProfileSchema,
  educationSchema,
  projectSchema,
  certificationSchema,
  skillSchema,
  resumeSchema,
  goalSchema
} = require('../../schemas/studentSchemas');

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
router.put('/me', authenticateToken, requireRole('student'), validate(personalProfileSchema), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    if (!studentId) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }
    await studentRepo.updateProfile(studentId, req.body);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({ success: true, data: fullProfile, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/education
router.post('/me/education', authenticateToken, requireRole('student'), validate(educationSchema), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.addEducation(studentId, req.body);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.status(201).json({ success: true, data: fullProfile, message: 'Education added successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/education/:id
router.delete('/me/education/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteEducation(studentId, req.params.id);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({ success: true, data: fullProfile, message: 'Education removed successfully' });
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
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.status(201).json({ success: true, data: fullProfile, message: 'Experience added successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/experience/:id
router.delete('/me/experience/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteExperience(studentId, req.params.id);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({ success: true, data: fullProfile, message: 'Experience removed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/projects
router.post('/me/projects', authenticateToken, requireRole('student'), validate(projectSchema), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.addProject(studentId, req.body);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.status(201).json({ success: true, data: fullProfile, message: 'Project added successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/projects/:id
router.delete('/me/projects/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteProject(studentId, req.params.id);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({ success: true, data: fullProfile, message: 'Project removed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/certifications
router.post('/me/certifications', authenticateToken, requireRole('student'), validate(certificationSchema), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.addCertification(studentId, req.body);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.status(201).json({ success: true, data: fullProfile, message: 'Certification added successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/certifications/:id
router.delete('/me/certifications/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteCertification(studentId, req.params.id);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({ success: true, data: fullProfile, message: 'Certification removed successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/me/skills and GET /api/students/skills
router.get(['/me/skills', '/skills'], authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const skills = await studentRepo.getSkills(studentId);
    return res.json({ success: true, count: skills.length, data: skills });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/skills and POST /api/students/skills
router.post(['/me/skills', '/skills'], authenticateToken, requireRole('student'), validate(skillSchema), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const { skillId, proficiencyLevel } = req.body;
    await studentRepo.addSkill(studentId, skillId, proficiencyLevel || 'intermediate', 'manual');
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.status(201).json({ success: true, data: fullProfile, message: 'Skill added to profile' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/skills/:id and DELETE /api/students/skills/:id
router.delete(['/me/skills/:id', '/skills/:id'], authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.removeSkill(studentId, req.params.id);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({ success: true, data: fullProfile, message: 'Skill removed from profile' });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/me/completeness
router.get('/me/completeness', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    if (!studentId) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({
      success: true,
      data: fullProfile.completeness_report || {
        percentage: fullProfile.profile_completeness || 0,
        checklist: [],
        missing: []
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/me/resumes
router.get('/me/resumes', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const resumes = await studentRepo.getResumes(studentId);
    return res.json({ success: true, data: resumes });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/resumes
router.post('/me/resumes', authenticateToken, requireRole('student'), validate(resumeSchema), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    // Check resume limit (max 3 resumes per student)
    const existing = await studentRepo.getResumes(studentId);
    if (existing.length >= 3) {
      return res.status(400).json({
        success: false,
        error: 'LIMIT_REACHED',
        message: 'Maximum 3 resume versions allowed. Delete an existing version to upload a new one.'
      });
    }
    const created = await studentRepo.addResume(studentId, req.body);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.status(201).json({ success: true, data: created, profile: fullProfile, message: 'Resume version saved' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/students/me/resumes/:id/primary
router.put('/me/resumes/:id/primary', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.setDefaultResume(studentId, req.params.id);
    const resumes = await studentRepo.getResumes(studentId);
    return res.json({ success: true, data: resumes, message: 'Primary resume updated' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/resumes/:id
router.delete('/me/resumes/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteResume(studentId, req.params.id);
    const fullProfile = await studentRepo.getFullProfile(studentId);
    return res.json({ success: true, data: fullProfile.resumes, profile: fullProfile, message: 'Resume deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/me/goals
router.get('/me/goals', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const goals = await studentRepo.getGoals(studentId);
    return res.json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/me/goals
router.post('/me/goals', authenticateToken, requireRole('student'), validate(goalSchema), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const created = await studentRepo.addGoal(studentId, req.body);
    return res.status(201).json({ success: true, data: created, message: 'Goal created successfully' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/students/me/goals/:id
router.put('/me/goals/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    const updated = await studentRepo.updateGoal(studentId, req.params.id, req.body);
    return res.json({ success: true, data: updated, message: 'Goal updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/me/goals/:id
router.delete('/me/goals/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = await getStudentProfileId(req.user.userId);
    await studentRepo.deleteGoal(studentId, req.params.id);
    return res.json({ success: true, message: 'Goal removed successfully' });
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
