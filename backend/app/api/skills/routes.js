'use strict';

const express = require('express');
const router = express.Router();
const skillRepo = require('../../repositories/skillRepository');
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
