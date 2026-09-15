'use strict';

const express = require('express');
const router = express.Router();
const recruiterRepo = require('../../repositories/recruiterRepository');
const jobRepo = require('../../repositories/jobRepository');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// GET /api/recruiters/me
router.get('/me', authenticateToken, requireRole('recruiter'), async (req, res, next) => {
  try {
    const profile = await recruiterRepo.findByUserId(req.user.userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Recruiter profile not found' });
    }
    return res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// GET /api/recruiters/my-jobs
router.get('/my-jobs', authenticateToken, requireRole('recruiter'), async (req, res, next) => {
  try {
    const profile = await recruiterRepo.findByUserId(req.user.userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Recruiter profile not found' });
    }
    const jobs = await jobRepo.findByRecruiter(profile.id);
    return res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
