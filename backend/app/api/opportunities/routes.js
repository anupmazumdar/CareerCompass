'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../../core/config');
const opportunityRepo = require('../../repositories/opportunityRepository');
const studentRepo = require('../../repositories/studentRepository');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// Helper to extract authenticated student profile if available
async function getOptionalStudentProfile(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    if (decoded && (decoded.role === 'student' || decoded.role === 'candidate')) {
      const studentProfile = await studentRepo.findByUserId(decoded.userId);
      if (studentProfile) {
        return await studentRepo.getFullProfile(studentProfile.id);
      }
    }
  } catch (_) {}
  return null;
}

// GET /api/opportunities/closing-soon - Opportunities closing within next 14 days
router.get('/closing-soon', async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 14;
    const limit = Number(req.query.limit) || 6;
    const rows = await opportunityRepo.getClosingSoon(days, limit);

    const studentProfile = await getOptionalStudentProfile(req);
    const enriched = studentProfile ? opportunityRepo.enrichWithMatchScores(studentProfile, rows) : rows;

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/opportunities/saved - Saved / bookmarked opportunities for authenticated student
router.get('/saved', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentProfile = await studentRepo.findByUserId(req.user.userId);
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const fullProfile = await studentRepo.getFullProfile(studentProfile.id);
    const saved = await opportunityRepo.getSavedOpportunities(studentProfile.id);
    const enriched = opportunityRepo.enrichWithMatchScores(fullProfile, saved);

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/opportunities - Unified discovery search, filter, sort, and deterministic matching
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      q,
      type,
      employmentType,
      workMode,
      location,
      minCgpa,
      minMatch,
      sort = 'match',
      page = 1,
      limit = 12
    } = req.query || {};

    const studentProfile = await getOptionalStudentProfile(req);

    const result = await opportunityRepo.findAll({
      search: search || q,
      type: type || employmentType,
      workMode,
      location,
      minCgpa,
      status: 'published',
      sort: sort === 'match' ? 'newest' : sort,
      page: Number(page),
      limit: Number(limit)
    });

    let items = result.items || [];

    // Check bookmarks if student authenticated
    if (studentProfile) {
      const savedItems = await opportunityRepo.getSavedOpportunities(studentProfile.id);
      const savedIds = new Set(savedItems.map(s => s.id));

      // Enrich with match scores
      items = items.map((opp) => {
        const match = opportunityRepo.calculateMatchScore(studentProfile, opp);
        return {
          ...opp,
          company_name: opp.company || opp.company_name,
          is_saved: savedIds.has(opp.id),
          match_score: match.score,
          match_breakdown: match
        };
      });

      // Filter by minMatch if specified
      if (minMatch !== undefined && !isNaN(Number(minMatch)) && Number(minMatch) > 0) {
        items = items.filter(opp => (opp.match_score || 0) >= Number(minMatch));
      }

      // If sort === 'match', sort items DESC by match_score
      if (sort === 'match') {
        items.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      }
    } else {
      items = items.map(opp => ({
        ...opp,
        company_name: opp.company || opp.company_name,
        is_saved: false,
        match_score: null,
        match_breakdown: null
      }));
    }

    return res.json({
      success: true,
      count: items.length,
      total: result.total,
      page: Number(page),
      limit: Number(limit),
      totalPages: result.totalPages,
      hasStudentProfile: Boolean(studentProfile),
      data: items
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/opportunities/:id - Opportunity detail with full match explanation & bookmark status
router.get('/:id', async (req, res, next) => {
  try {
    const opp = await opportunityRepo.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Opportunity not found' });
    }

    const studentProfile = await getOptionalStudentProfile(req);
    let match = null;
    let isSaved = false;

    if (studentProfile) {
      match = opportunityRepo.calculateMatchScore(studentProfile, opp);
      isSaved = await opportunityRepo.isOpportunitySaved(studentProfile.id, opp.id);
    }

    return res.json({
      success: true,
      data: {
        ...opp,
        company_name: opp.company || opp.company_name,
        is_saved: isSaved,
        match_score: match ? match.score : null,
        match_breakdown: match
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/opportunities/:id/save - Bookmark opportunity
router.post('/:id/save', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentProfile = await studentRepo.findByUserId(req.user.userId);
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    await opportunityRepo.saveOpportunity(studentProfile.id, req.params.id);
    return res.json({ success: true, message: 'Opportunity saved to bookmarks' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/opportunities/:id/save - Unbookmark opportunity
router.delete('/:id/save', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const studentProfile = await studentRepo.findByUserId(req.user.userId);
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    await opportunityRepo.unsaveOpportunity(studentProfile.id, req.params.id);
    return res.json({ success: true, message: 'Opportunity removed from bookmarks' });
  } catch (err) {
    next(err);
  }
});

// POST /api/opportunities - Post new opportunity (Employer / Admin only)
router.post('/', authenticateToken, requireRole('employer', 'admin'), async (req, res, next) => {
  try {
    const { title, company, type, description, location } = req.body || {};
    if (!title || !company || !description) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Title, company, and description are required'
      });
    }

    const created = await opportunityRepo.create({
      ...req.body,
      posted_by: req.user.userId,
      status: req.body.status || 'published'
    });

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Opportunity posted successfully'
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/opportunities/:id - Update opportunity (Employer / Admin only)
router.put('/:id', authenticateToken, requireRole('employer', 'admin'), async (req, res, next) => {
  try {
    const opp = await opportunityRepo.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Opportunity not found' });
    }

    // Role check: employer can only edit their own postings unless admin
    if (req.user.role === 'employer' && opp.posted_by !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only edit opportunities you created' });
    }

    const updated = await opportunityRepo.update(req.params.id, req.body);
    return res.json({ success: true, data: updated, message: 'Opportunity updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/opportunities/:id - Soft-delete opportunity (Employer / Admin only)
router.delete('/:id', authenticateToken, requireRole('employer', 'admin'), async (req, res, next) => {
  try {
    const opp = await opportunityRepo.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Opportunity not found' });
    }

    if (req.user.role === 'employer' && opp.posted_by !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only delete opportunities you created' });
    }

    await opportunityRepo.delete(req.params.id);
    return res.json({ success: true, message: 'Opportunity closed/deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
