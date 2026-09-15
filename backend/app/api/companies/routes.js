'use strict';

const express = require('express');
const router = express.Router();
const recruiterRepo = require('../../repositories/recruiterRepository');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// GET /api/companies (Public)
router.get('/', async (req, res, next) => {
  try {
    const companies = await recruiterRepo.listCompanies('verified');
    return res.json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const company = await recruiterRepo.findCompanyById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Company not found' });
    }
    return res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies (Recruiter or Admin)
router.post('/', authenticateToken, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { name, website, domain, description, industry, logoUrl } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Company name is required' });
    }
    const existing = await recruiterRepo.findCompanyByName(name);
    if (existing) {
      return res.status(409).json({ success: false, error: 'CONFLICT', message: 'Company name is already registered' });
    }
    const company = await recruiterRepo.createCompany({ name, website, domain, description, industry, logoUrl });
    return res.status(201).json({ success: true, data: company, message: 'Company created successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
