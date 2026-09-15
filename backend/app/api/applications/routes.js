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
const { validate } = require('../../middleware/validate');
const {
  createApplicationSchema,
  updateStatusSchema,
  addNoteSchema
} = require('../../schemas/applicationSchemas');

// POST /api/applications (Student saves or applies for job)
router.post('/', authenticateToken, requireRole('student'), validate(createApplicationSchema), async (req, res, next) => {
  try {
    const { jobId, resumeId, coverNote, status = 'applied' } = req.body;

    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const job = await jobRepo.findById(jobId);
    if (!job || job.status !== 'published') {
      return res.status(400).json({ success: false, error: 'INVALID_JOB', message: 'Job is not open for applications' });
    }

    // Check existing application
    const existing = await appRepo.findByStudentAndJob(student.id, jobId);

    if (existing) {
      // If student is saving and it's already saved
      if (status === 'saved') {
        if (existing.status === 'saved') {
          return res.status(200).json({
            success: true,
            data: existing,
            message: 'Opportunity is already saved to your wishlist'
          });
        }
        return res.status(409).json({
          success: false,
          error: 'CONFLICT',
          message: 'You have already applied to this opportunity'
        });
      }

      // If student is applying and it was previously 'saved'
      if (status === 'applied') {
        if (existing.status === 'saved') {
          // Promote from saved to applied
          const fullStudentProfile = await studentRepo.getFullProfile(student.id);
          const matchResult = await matchingEngine.computeMatch(fullStudentProfile, job);

          const updated = await appRepo.promoteSavedToApplied({
            applicationId: existing.id,
            resumeId: resumeId || existing.resume_id || null,
            coverNote: coverNote || existing.cover_note || null,
            matchScore: matchResult.final_score,
            changedByUserId: req.user.userId
          });

          // Save match scores breakdown
          await db.run(
            `INSERT OR REPLACE INTO match_scores (
              application_id, student_id, job_id, final_score, skill_score, experience_score,
              education_score, project_score, location_score, certification_score,
              matched_skills, partial_skills, missing_skills, explanation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              existing.id,
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

          return res.status(200).json({
            success: true,
            data: {
              ...updated,
              matchEvaluation: matchResult
            },
            message: 'Application submitted successfully from saved wishlist'
          });
        }

        // Already applied or progressing in pipeline
        return res.status(409).json({
          success: false,
          error: 'CONFLICT',
          message: 'You have already applied to this job'
        });
      }
    }

    // Creating a fresh 'saved' item
    if (status === 'saved') {
      const application = await appRepo.create({
        jobId,
        studentId: student.id,
        resumeId: resumeId || null,
        coverNote: coverNote || null,
        matchScore: null,
        status: 'saved'
      });

      return res.status(201).json({
        success: true,
        data: application,
        message: 'Opportunity saved to wishlist'
      });
    }

    // Creating a fresh 'applied' item
    const fullStudentProfile = await studentRepo.getFullProfile(student.id);
    const matchResult = await matchingEngine.computeMatch(fullStudentProfile, job);

    const application = await appRepo.create({
      jobId,
      studentId: student.id,
      resumeId: resumeId || null,
      coverNote: coverNote || null,
      matchScore: matchResult.final_score,
      status: 'applied'
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
    const notes = await appRepo.getNotes(application.id);
    const matchScore = await db.get('SELECT * FROM match_scores WHERE application_id = ?', [application.id]);

    return res.json({
      success: true,
      data: {
        ...application,
        history,
        notes,
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

// POST /api/applications/:id/notes (Student adds private note/reminder)
router.post('/:id/notes', authenticateToken, requireRole('student'), validate(addNoteSchema), async (req, res, next) => {
  try {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    if (application.student_id !== student.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
    }

    const { content, noteType, reminderDate } = req.body;
    const note = await appRepo.addNote({
      applicationId: application.id,
      studentId: student.id,
      noteType,
      content,
      reminderDate: reminderDate || null
    });

    return res.status(201).json({
      success: true,
      data: note,
      message: 'Note added successfully'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/notes
router.get('/:id/notes', authenticateToken, async (req, res, next) => {
  try {
    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    if (req.user.role === 'student') {
      const student = await studentRepo.findByUserId(req.user.userId);
      if (application.student_id !== student?.id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
      }
    }

    const notes = await appRepo.getNotes(application.id);
    return res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id/notes/:noteId
router.delete('/:id/notes/:noteId', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    await appRepo.deleteNote(req.params.noteId, student.id);
    return res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status (Stage transition)
router.patch('/:id/status', authenticateToken, validate(updateStatusSchema), async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    if (req.user.role === 'student') {
      const student = await studentRepo.findByUserId(req.user.userId);
      if (application.student_id !== student?.id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
      }

      // Students can only:
      // 1. promote 'saved' to 'applied'
      // 2. mark active application as 'withdrawn'
      if (application.status === 'saved' && status === 'applied') {
        const fullStudentProfile = await studentRepo.getFullProfile(student.id);
        const job = await jobRepo.findById(application.job_id);
        const matchResult = await matchingEngine.computeMatch(fullStudentProfile, job);

        const updated = await appRepo.promoteSavedToApplied({
          applicationId: application.id,
          resumeId: application.resume_id || null,
          coverNote: application.cover_note || null,
          matchScore: matchResult.final_score,
          changedByUserId: req.user.userId
        });

        return res.json({ success: true, data: updated, message: 'Application submitted successfully' });
      }

      if (status === 'withdrawn') {
        const updated = await appRepo.updateStatus(application.id, 'withdrawn', req.user.userId, notes || 'Withdrawn by student');
        return res.json({ success: true, data: updated, message: 'Application withdrawn successfully' });
      }

      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Students may only withdraw applications or submit saved applications'
      });
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

// DELETE /api/applications/:id (Remove saved opportunity from wishlist)
router.delete('/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    if (application.student_id !== student.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
    }

    if (application.status !== 'saved') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ACTION',
        message: 'Cannot delete an active application. You may withdraw it instead.'
      });
    }

    await appRepo.deleteSavedApplication(application.id, student.id);
    return res.json({ success: true, message: 'Opportunity removed from wishlist' });
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
