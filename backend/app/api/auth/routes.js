'use strict';

const express = require('express');
const router = express.Router();
const userRepo = require('../../repositories/userRepository');
const studentRepo = require('../../repositories/studentRepository');
const recruiterRepo = require('../../repositories/recruiterRepository');
const {
  hashPassword,
  verifyPassword,
  issueAccessToken,
  issueRefreshToken,
  authenticateToken,
  handleRefreshToken,
  handleLogout
} = require('../../core/authentication/auth');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role, fullName, full_name, phone, companyName, company_name } = req.body || {};
    const resolvedFullName = fullName || full_name || email.split('@')[0];
    const resolvedCompanyName = companyName || company_name || null;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Email, password, and role are required' });
    }

    const rawRole = String(role).toLowerCase();
    const normalizedRole = (rawRole === 'candidate' || rawRole === 'student')
      ? 'student'
      : ((rawRole === 'employer' || rawRole === 'recruiter') ? 'recruiter' : rawRole);

    if (!['student', 'recruiter'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Role must be student or recruiter' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' });
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'CONFLICT', message: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepo.create({
      email,
      passwordHash,
      role: normalizedRole,
      fullName: resolvedFullName,
      phone: phone || null,
      status: 'active'
    });

    let studentProfileId = null;
    let recruiterProfileId = null;
    let companyId = null;

    if (normalizedRole === 'student') {
      const sp = await studentRepo.createProfile(user.id);
      studentProfileId = sp?.id;
    } else if (normalizedRole === 'recruiter') {
      let comp = null;
      if (resolvedCompanyName) {
        comp = await recruiterRepo.findCompanyByName(resolvedCompanyName);
        if (!comp) {
          comp = await recruiterRepo.createCompany({ name: resolvedCompanyName, verificationStatus: 'verified' });
        }
      }
      companyId = comp?.id || null;
      const rp = await recruiterRepo.createProfile(user.id, { companyId, isCompanyAdmin: true });
      recruiterProfileId = rp?.id;
    }

    const accessToken = issueAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      studentProfileId,
      recruiterProfileId,
      companyId
    });
    const refreshToken = issueRefreshToken({ userId: user.id, email: user.email, role: user.role }, res);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name, studentProfileId, recruiterProfileId, companyId },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    const user = (await userRepo.findByEmailOrUsername?.(email)) || (await userRepo.findByEmail(email));
    if (!user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Invalid email or password' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Account is disabled. Contact your administrator.' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Invalid email or password' });
    }

    let studentProfileId = null;
    let recruiterProfileId = null;
    let companyId = null;

    if (user.role === 'student') {
      const sp = await studentRepo.findByUserId(user.id);
      studentProfileId = sp?.id;
    } else if (user.role === 'recruiter') {
      const rp = await recruiterRepo.findByUserId(user.id);
      recruiterProfileId = rp?.id;
      companyId = rp?.company_id;
    }

    const accessToken = issueAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      studentProfileId,
      recruiterProfileId,
      companyId
    });
    const refreshToken = issueRefreshToken({ userId: user.id, email: user.email, role: user.role }, res);

    return res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name, studentProfileId, recruiterProfileId, companyId },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', handleRefreshToken);

// POST /api/auth/logout
router.post('/logout', authenticateToken, handleLogout);

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await studentRepo.findByUserId(user.id);
    } else if (user.role === 'recruiter') {
      profile = await recruiterRepo.findByUserId(user.id);
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        phone: user.phone,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
