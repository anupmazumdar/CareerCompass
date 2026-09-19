'use strict';

const express = require('express');
const router = express.Router();
const appRepo = require('../../repositories/applicationRepository');
const jobRepo = require('../../repositories/jobRepository');
const opportunityRepo = require('../../repositories/opportunityRepository');
const studentRepo = require('../../repositories/studentRepository');
const recruiterRepo = require('../../repositories/recruiterRepository');
const matchingEngine = require('../../ai/matching_engine/matchingEngine');
const db = require('../../core/database/connection');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole, normalizeRole } = require('../../core/authorization/rbac');
const { validate } = require('../../middleware/validate');
const {
  createApplicationSchema,
  updateStatusSchema,
  addNoteSchema
} = require('../../schemas/applicationSchemas');

/**
 * Authoritative access check helper for applications.
 * Enforces explicit ownership for students, verified company-level ownership for recruiters,
 * and universal oversight for admins.
 * Crucially: Applications with job_id = null cannot be accessed by recruiters.
 */
async function canAccessApplication(application, user) {
  if (!application || !user) return false;
  const role = user.normalizedRole || normalizeRole(user.role);

  if (role === 'admin') {
    return true;
  }

  if (role === 'student') {
    const student = await studentRepo.findByUserId(user.userId);
    return Boolean(student && application.student_id === student.id);
  }

  if (role === 'recruiter') {
    const recruiter = await recruiterRepo.findByUserId(user.userId);
    if (!recruiter || !recruiter.company_id) return false;

    // Recruiter only has access if application is tied to their company's job or verified company opportunity
    if (application.job_id) {
      const job = await jobRepo.findById(application.job_id);
      return Boolean(job && job.company_id === recruiter.company_id);
    }
    if (application.opportunity_id) {
      const opp = await opportunityRepo.findById(application.opportunity_id);
      if (opp && opp.company_id && opp.company_id === recruiter.company_id) {
        return true;
      }
      return false;
    }
    // If job_id is null and no company-matched opportunity, recruiter has NO access to private/external applications
    return false;
  }

  return false;
}

// GET /api/applications/stats - Application analytics strip for student
router.get('/stats', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const stats = await appRepo.getStats(student.id);
    return res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/my-applications - All applications for current student
router.get('/my-applications', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const applications = await appRepo.findByStudent(student.id);
    return res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/applications - Quick-apply or add external tracked application
router.post('/', authenticateToken, requireRole('student'), validate(createApplicationSchema), async (req, res, next) => {
  try {
    let { opportunityId, jobId, company, title, location, resumeId, coverNote, notes, reminderDate, status = 'applied' } = req.body;

    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const fullStudentProfile = await studentRepo.getFullProfile(student.id);

    // If external custom application without opportunityId/jobId
    if (!opportunityId && !jobId && company && title) {
      const createdOpp = await opportunityRepo.create({
        title,
        company,
        location: location || 'Remote / Flexible',
        type: 'Job',
        description: notes || `External job application at ${company}`,
        required_skills: '[]',
        posted_by: req.user.userId,
        status: 'published'
      });
      opportunityId = createdOpp.id;
    }

    // Determine target opportunity or job
    let opp = null;
    let job = null;
    let computedMatchScore = 75; // baseline fallback for external

    if (opportunityId) {
      opp = await opportunityRepo.findById(opportunityId);
      if (opp) {
        if (opp.status === 'closed' || opp.status === 'archived') {
          return res.status(400).json({ success: false, error: 'OPPORTUNITY_CLOSED', message: 'This opportunity is closed for applications' });
        }
        if (opp.deadline && new Date(opp.deadline) < new Date()) {
          return res.status(400).json({ success: false, error: 'DEADLINE_PASSED', message: 'The application deadline for this opportunity has passed' });
        }
        const matchResult = opportunityRepo.calculateMatchScore(fullStudentProfile, opp);
        computedMatchScore = matchResult.score;
      }
    } else if (jobId) {
      job = await jobRepo.findById(jobId);
      if (job) {
        if (job.status === 'closed' || job.status === 'archived') {
          return res.status(400).json({ success: false, error: 'JOB_CLOSED', message: 'This job is closed for applications' });
        }
        if (job.deadline && new Date(job.deadline) < new Date()) {
          return res.status(400).json({ success: false, error: 'DEADLINE_PASSED', message: 'The application deadline for this job has passed' });
        }
        const matchResult = await matchingEngine.computeMatch(fullStudentProfile, job);
        computedMatchScore = matchResult.final_score;
      }
    }

    // Check existing application to avoid duplicate
    const targetId = opportunityId || jobId;
    const existing = await appRepo.findByStudentAndOpportunity(student.id, targetId);

    if (existing) {
      if (status === 'saved' && existing.status === 'saved') {
        return res.status(200).json({
          success: true,
          data: existing,
          message: 'Opportunity is already saved to your wishlist'
        });
      }

      if (status === 'applied' && existing.status === 'saved') {
        const updated = await appRepo.promoteSavedToApplied({
          applicationId: existing.id,
          resumeId: resumeId || existing.resume_id || null,
          coverNote: coverNote || existing.cover_note || null,
          matchScore: computedMatchScore,
          changedByUserId: req.user.userId
        });
        return res.status(200).json({
          success: true,
          data: updated,
          message: 'Application submitted successfully from saved wishlist'
        });
      }

      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'You have already applied or saved this opportunity'
      });
    }

    // Enforce resume ownership (SECURITY: prevent IDOR/hijacking of another student's resume)
    let resumeVersionUsed = null;
    if (resumeId) {
      const resume = await db.get('SELECT id, version_label, student_id FROM resumes WHERE id = ?', [resumeId]);
      if (!resume) {
        return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Resume not found' });
      }
      if (resume.student_id !== student.id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You are not authorized to use this resume' });
      }
      resumeVersionUsed = resume.version_label;
    } else {
      const primary = await db.get(
        'SELECT id, version_label FROM resumes WHERE student_id = ? ORDER BY is_primary DESC, created_at DESC LIMIT 1',
        [student.id]
      );
      if (primary) {
        resumeId = primary.id;
        resumeVersionUsed = primary.version_label;
      }
    }

    const application = await appRepo.create({
      opportunityId: opportunityId || null,
      jobId: jobId || null,
      studentId: student.id,
      resumeId: resumeId || null,
      resumeVersionUsed,
      coverNote: coverNote || null,
      notes: notes || null,
      reminderDate: reminderDate || null,
      matchScore: computedMatchScore,
      status
    });

    return res.status(201).json({
      success: true,
      data: application,
      message: status === 'saved' ? 'Opportunity saved to wishlist' : 'Application submitted successfully'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id - Detailed application view with history, notes & match breakdown
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    const hasAccess = await canAccessApplication(application, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
    }

    const history = await appRepo.getStatusHistory(application.id);
    const notes = await appRepo.getNotes(application.id);

    return res.json({
      success: true,
      data: {
        ...application,
        history,
        notes
      }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status - Update stage & notes (Kanban movement)
router.patch('/:id/status', authenticateToken, validate(updateStatusSchema), async (req, res, next) => {
  try {
    const { status, notes, reminderDate } = req.body;

    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    const hasAccess = await canAccessApplication(application, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
    }

    const updated = await appRepo.updateApplication(application.id, {
      status,
      notes,
      reminderDate,
      changedByUserId: req.user.userId
    });

    return res.json({
      success: true,
      data: updated,
      message: `Application moved to ${status}`
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/applications/:id - General update for notes, reminder_date, stage
router.put('/:id', authenticateToken, requireRole('student'), async (req, res, next) => {
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

    const { status, notes, reminderDate } = req.body;
    const updated = await appRepo.updateApplication(application.id, {
      status,
      notes,
      reminderDate,
      changedByUserId: req.user.userId
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Application updated successfully'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/applications/:id/notes - Add note or interview reminder
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

// GET /api/applications/:id/notes - Get all notes for application
router.get('/:id/notes', authenticateToken, async (req, res, next) => {
  try {
    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    const hasAccess = await canAccessApplication(application, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
    }

    const notes = await appRepo.getNotes(application.id);
    return res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id/notes/:noteId - Delete note (verifying BOTH application and note ownership)
router.delete('/:id/notes/:noteId', authenticateToken, requireRole('student'), async (req, res, next) => {
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

    const note = await db.get('SELECT * FROM application_notes WHERE id = ?', [req.params.noteId]);
    if (!note) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Note not found' });
    }
    if (note.application_id !== application.id || note.student_id !== student.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Note does not belong to this application' });
    }

    await appRepo.deleteNote(req.params.noteId, student.id, application.id);
    return res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id - Remove saved opportunity or withdraw
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

    if (application.status === 'saved') {
      await appRepo.deleteSavedApplication(application.id, student.id);
      return res.json({ success: true, message: 'Opportunity removed from wishlist' });
    }

    // Active applications are marked as withdrawn rather than hard-deleted
    await appRepo.updateStatus(application.id, 'withdrawn', req.user.userId, 'Withdrawn by student');
    return res.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/history - Immutable audit history
router.get('/:id/history', authenticateToken, async (req, res, next) => {
  try {
    const application = await appRepo.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Application not found' });
    }

    const hasAccess = await canAccessApplication(application, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
    }

    const history = await appRepo.getStatusHistory(application.id);
    return res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
