'use strict';

const express = require('express');
const router = express.Router();
const jobRepo = require('../../repositories/jobRepository');
const recruiterRepo = require('../../repositories/recruiterRepository');
const appRepo = require('../../repositories/applicationRepository');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

const studentRepo = require('../../repositories/studentRepository');
const matchingEngine = require('../../ai/matching_engine/matchingEngine');
const jwt = require('jsonwebtoken');
const config = require('../../core/config');

// Helper to extract optional authenticated student
async function getOptionalStudentProfile(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    if (decoded && decoded.role === 'student') {
      const studentProfile = await studentRepo.findByUserId(decoded.userId);
      if (studentProfile) {
        return await studentRepo.getFullProfile(studentProfile.id);
      }
    }
  } catch (_) {}
  return null;
}

// GET /api/jobs (or /api/opportunities) - Directory with search, filters, pagination & student matching
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      q,
      location,
      employmentType,
      type,
      workType,
      skill,
      minMatch,
      page = 1,
      limit = 12
    } = req.query || {};

    const studentProfile = await getOptionalStudentProfile(req);

    const result = await jobRepo.findAllPublished({
      search: search || q,
      location,
      employmentType: employmentType || type,
      workType,
      skill,
      page: Number(page),
      limit: Number(limit)
    });

    let jobs = result.jobs || [];

    // If student is authenticated, compute real-time match score for each opportunity
    if (studentProfile) {
      const scoredJobs = await Promise.all(
        jobs.map(async (job) => {
          try {
            const match = await matchingEngine.computeMatch(studentProfile, job);
            return {
              ...job,
              match_score: match.final_score,
              match_grade: match.grade,
              matched_skills: (match.matched_skills || []).map(m => m.skill),
              missing_skills: (match.missing_skills || []).map(m => m.skill),
              match_explanation: match.explanation,
              match_breakdown: match.breakdown
            };
          } catch (_) {
            return {
              ...job,
              match_score: 50,
              match_grade: 'C',
              matched_skills: [],
              missing_skills: []
            };
          }
        })
      );

      // Filter by minMatch if specified
      if (minMatch !== undefined && !isNaN(Number(minMatch))) {
        const threshold = Number(minMatch);
        jobs = scoredJobs.filter(j => j.match_score >= threshold);
      } else {
        jobs = scoredJobs;
      }

      // Sort by match_score DESC by default for students
      jobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    }

    const total = result.total !== undefined ? result.total : jobs.length;
    const totalPages = Math.ceil(total / Number(limit)) || 1;

    return res.json({
      success: true,
      count: jobs.length,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasStudentProfile: Boolean(studentProfile),
      data: jobs
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id - Detailed opportunity with full match breakdown if student
router.get('/:id', async (req, res, next) => {
  try {
    const job = await jobRepo.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Job not found' });
    }

    const studentProfile = await getOptionalStudentProfile(req);
    let match = null;

    if (studentProfile) {
      try {
        match = await matchingEngine.computeMatch(studentProfile, job);
      } catch (_) {}
    }

    return res.json({
      success: true,
      data: {
        ...job,
        match
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs (Recruiter creates job)
router.post('/', authenticateToken, requireRole('recruiter'), async (req, res, next) => {
  try {
    const recruiter = await recruiterRepo.findByUserId(req.user.userId);
    if (!recruiter || !recruiter.company_id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You must be associated with a company to post jobs' });
    }

    const {
      title, description, department, location, employmentType,
      experienceLevel, minExperienceYears, minEducation, minSalary, maxSalary,
      deadline, requiredSkills, preferredSkills
    } = req.body || {};

    if (!title || !description || !location) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Title, description, and location are required' });
    }

    const job = await jobRepo.create({
      companyId: recruiter.company_id,
      recruiterProfileId: recruiter.id,
      title,
      description,
      department,
      location,
      employmentType,
      experienceLevel,
      minExperienceYears,
      minEducation,
      minSalary,
      maxSalary,
      deadline,
      requiredSkills,
      preferredSkills,
      status: 'published'
    });

    return res.status(201).json({ success: true, data: job, message: 'Job posted successfully' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id (Update job)
router.put('/:id', authenticateToken, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    const job = await jobRepo.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Job not found' });
    }

    if (req.user.role === 'recruiter') {
      const recruiter = await recruiterRepo.findByUserId(req.user.userId);
      if (job.created_by_recruiter_id !== recruiter.id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only edit your own job postings' });
      }
    }

    const updated = await jobRepo.update(req.params.id, req.body);
    return res.json({ success: true, data: updated, message: 'Job updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id (Close/delete job)
router.delete('/:id', authenticateToken, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    const job = await jobRepo.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Job not found' });
    }

    if (req.user.role === 'recruiter') {
      const recruiter = await recruiterRepo.findByUserId(req.user.userId);
      if (job.created_by_recruiter_id !== recruiter.id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only delete your own job postings' });
      }
    }

    await jobRepo.delete(req.params.id);
    return res.json({ success: true, message: 'Job closed successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id/applications (View candidate applicants for job)
router.get('/:id/applications', authenticateToken, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    const job = await jobRepo.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Job not found' });
    }

    if (req.user.role === 'recruiter') {
      const recruiter = await recruiterRepo.findByUserId(req.user.userId);
      if (job.created_by_recruiter_id !== recruiter.id && job.company_id !== recruiter.company_id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only view applicants for your company jobs' });
      }
    }

    const applications = await appRepo.findByJob(req.params.id);
    return res.json({ success: true, count: applications.length, data: applications });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
