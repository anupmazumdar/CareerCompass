'use strict';

const express = require('express');
const router = express.Router();
const userRepo = require('../../repositories/userRepository');
const recruiterRepo = require('../../repositories/recruiterRepository');
const db = require('../../core/database/connection');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// All routes require 'admin' role
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [students, recruiters, companies, jobs, applications] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM student_profiles'),
      db.get('SELECT COUNT(*) as count FROM recruiter_profiles'),
      db.get('SELECT COUNT(*) as count FROM companies'),
      db.get('SELECT COUNT(*) as count FROM jobs WHERE deleted_at IS NULL'),
      db.get('SELECT COUNT(*) as count FROM applications')
    ]);

    const statusCounts = await db.all(
      'SELECT status, COUNT(*) as count FROM applications GROUP BY status'
    );

    return res.json({
      success: true,
      data: {
        totalStudents: students?.count || 0,
        totalRecruiters: recruiters?.count || 0,
        totalCompanies: companies?.count || 0,
        totalJobs: jobs?.count || 0,
        totalApplications: applications?.count || 0,
        applicationBreakdown: statusCounts
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/recruiters
router.get('/recruiters', async (req, res, next) => {
  try {
    const recruiters = await db.all(
      `SELECT rp.*, u.full_name, u.email, u.status as user_status, c.name as company_name, c.verification_status
       FROM recruiter_profiles rp
       JOIN users u ON rp.user_id = u.id
       LEFT JOIN companies c ON rp.company_id = c.id
       ORDER BY rp.created_at DESC`
    );
    return res.json({ success: true, count: recruiters.length, data: recruiters });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/recruiters/:id/approve
router.patch('/recruiters/:id/approve', async (req, res, next) => {
  try {
    const { status } = req.body || {}; // 'active' or 'disabled'
    const profile = await recruiterRepo.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Recruiter not found' });
    }

    await userRepo.updateStatus(profile.user_id, status || 'active');
    return res.json({ success: true, message: `Recruiter status updated to ${status || 'active'}` });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/companies
router.get('/companies', async (req, res, next) => {
  try {
    const companies = await recruiterRepo.listCompanies();
    return res.json({ success: true, count: companies.length, data: companies });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/companies/:id/verify
router.patch('/companies/:id/verify', async (req, res, next) => {
  try {
    const { status } = req.body || {}; // 'verified' | 'rejected' | 'pending'
    const updated = await recruiterRepo.updateCompanyVerification(req.params.id, status || 'verified');
    return res.json({ success: true, data: updated, message: `Company verification status updated to ${status || 'verified'}` });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await db.all(
      `SELECT al.*, u.email as user_email, u.role as user_role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 100`
    );
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
});

// ORIGINAL VULNERABILITY:
//   app.get('/api/admin/questions', ...) was mounted directly on the Express app in server.js,
//   bypassing the router-level authenticateToken and requireRole('admin') middleware. Any
//   unauthenticated user could fetch quiz questions and internal assessment data.
//
// FIX:
//   Moved route into api/admin/routes.js so it inherits router.use(authenticateToken, requireRole('admin')).
router.get('/questions', async (req, res, next) => {
  try {
    const questions = await db.all('SELECT * FROM quiz_questions ORDER BY id ASC');
    return res.json({
      success: true,
      questions: questions.map(q => ({ ...q, options: JSON.parse(q.options || '[]') }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
