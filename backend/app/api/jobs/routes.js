'use strict';

const express = require('express');
const router = express.Router();
const jobRepo = require('../../repositories/jobRepository');
const recruiterRepo = require('../../repositories/recruiterRepository');
const appRepo = require('../../repositories/applicationRepository');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// GET /api/jobs (Public directory of active published jobs)
router.get('/', async (req, res, next) => {
  try {
    const { location, employmentType, search } = req.query || {};
    const jobs = await jobRepo.findAllPublished({ location, employmentType, search });
    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const job = await jobRepo.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Job not found' });
    }
    return res.json({ success: true, data: job });
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
