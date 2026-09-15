'use strict';

const express = require('express');
const router = express.Router();
const appRepo = require('../../repositories/applicationRepository');
const jobRepo = require('../../repositories/jobRepository');
const studentRepo = require('../../repositories/studentRepository');
const recruiterRepo = require('../../repositories/recruiterRepository');
const matchingEngine = require('../../ai/matching_engine/matchingEngine');
const db = require('../../core/database/connection');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// POST /api/applications (Student applies for job)
router.post('/', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const { jobId, resumeId, coverNote } = req.body || {};
    if (!jobId) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'jobId is required' });
    }

    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const job = await jobRepo.findById(jobId);
    if (!job || job.status !== 'published') {
      return res.status(400).json({ success: false, error: 'INVALID_JOB', message: 'Job is not open for applications' });
    }

    // Check duplicate application
    const existing = await appRepo.findByStudentAndJob(student.id, jobId);
    if (existing) {
      return res.status(409).json({ success: false, error: 'CONFLICT', message: 'You have already applied to this job' });
    }

    // Compute automatic match score using Unified Matching Engine
    const fullStudentProfile = await studentRepo.getFullProfile(student.id);
    const matchResult = await matchingEngine.computeMatch(fullStudentProfile, job);

    const application = await appRepo.create({
      jobId,
      studentId: student.id,
      resumeId: resumeId || null,
      coverNote: coverNote || null,
      matchScore: matchResult.final_score
    });

    // Save match scores breakdown
    await db.run(
      `INSERT OR REPLACE INTO match_scores (
        application_id, student_id, job_id, final_score, skill_score, experience_score,
        education_score, project_score, location_score, certification_score,
        matched_skills, partial_skills, missing_skills, explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        application.id,
        student.id,
        jobId,
        matchResult.final_score,
        matchResult.breakdown.skill_score,
        matchResult.breakdown.experience_score,
        matchResult.breakdown.education_score,
        matchResult.breakdown.project_score,
        matchResult.breakdown.location_score,
        matchResult.breakdown.certification_score,
        JSON.stringify(matchResult.matched_skills),
        JSON.stringify(matchResult.partial_skills),
        JSON.stringify(matchResult.missing_skills),
        matchResult.explanation
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        ...application,
        matchEvaluation: matchResult
      },
      message: 'Application submitted successfully'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/my-applications
router.get('/my-applications', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }
    const applications = await appRepo.findByStudent(student.id);
    return res.json({ success: true, count: applications.length, data: applications });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    // Security check: must be applicant, job recruiter, or admin
    if (req.user.role === 'student') {
      const student = await studentRepo.findByUserId(req.user.userId);
      if (application.student_id !== student?.id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
      }
    } else if (req.user.role === 'recruiter') {
      const recruiter = await recruiterRepo.findByUserId(req.user.userId);
      const job = await jobRepo.findById(application.job_id);
      if (job?.company_id !== recruiter?.company_id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
      }
    }

    const history = await appRepo.getStatusHistory(application.id);
    const matchScore = await db.get('SELECT * FROM match_scores WHERE application_id = ?', [application.id]);

    return res.json({
      success: true,
      data: {
        ...application,
        history,
        matchScore: matchScore ? {
          ...matchScore,
          matched_skills: JSON.parse(matchScore.matched_skills || '[]'),
          partial_skills: JSON.parse(matchScore.partial_skills || '[]'),
          missing_skills: JSON.parse(matchScore.missing_skills || '[]')
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status (Recruiter moves candidate through stages)
router.patch('/:id/status', authenticateToken, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { status, notes } = req.body || {};
    const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    if (req.user.role === 'recruiter') {
      const recruiter = await recruiterRepo.findByUserId(req.user.userId);
      const job = await jobRepo.findById(application.job_id);
      if (job?.company_id !== recruiter?.company_id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only update applications for your company jobs' });
      }
    }

    const updated = await appRepo.updateStatus(req.params.id, status, req.user.userId, notes);
    return res.json({ success: true, data: updated, message: `Application status updated to ${status}` });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/history (Immutable audit history)
router.get('/:id/history', authenticateToken, async (req, res, next) => {
  try {
    const history = await appRepo.getStatusHistory(req.params.id);
    return res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
