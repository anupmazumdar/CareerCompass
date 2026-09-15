'use strict';

const express = require('express');
const router = express.Router();
const skillRepo = require('../../repositories/skillRepository');
const studentRepo = require('../../repositories/studentRepository');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// GET /api/skills (Public search and list)
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query || {};
    if (q) {
      const results = await skillRepo.search(q);
      return res.json({ success: true, count: results.length, data: results });
    }
    const all = await skillRepo.findAll();
    return res.json({ success: true, count: all.length, data: all });
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await skillRepo.getCategories();
    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/roles (Supported MCA student target roles and benchmarks)
router.get('/roles', async (req, res, next) => {
  try {
    const roles = skillRepo.getTargetRoles();
    return res.json({ success: true, count: roles.length, data: roles });
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/resources (Curated free learning resources)
router.get('/resources', async (req, res, next) => {
  try {
    const { role, gapArea, skill } = req.query || {};
    const resources = await skillRepo.getLearningResources({
      role: role || null,
      gapArea: gapArea || skill || null
    });
    return res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/gap-analysis (Target role gap analysis for logged-in student)
router.get('/gap-analysis', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const studentSkills = await studentRepo.getSkills(student.id);
    const targetRoleKey = req.query.role || student.preferred_role || 'fullstack';

    const analysis = await skillRepo.computeGapAnalysis({
      studentSkills,
      targetRoleKey
    });

    return res.json({
      success: true,
      data: {
        studentId: student.id,
        preferredRole: student.preferred_role,
        ...analysis
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/skills (Admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, categoryId, parentSkillId } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Skill name is required' });
    }
    const skill = await skillRepo.addCanonicalSkill(name, categoryId, parentSkillId);
    return res.status(201).json({ success: true, data: skill, message: 'Canonical skill created' });
  } catch (err) {
    next(err);
  }
});

// POST /api/skills/alias (Admin only)
router.post('/alias', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { skillId, alias } = req.body || {};
    if (!skillId || !alias) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'skillId and alias are required' });
    }
    await skillRepo.addAlias(skillId, alias);
    return res.status(201).json({ success: true, message: `Alias '${alias}' mapped to skill ${skillId}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
