// backend/app/api/resumes/routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../core/authentication/auth');
const resumeService = require('../../services/resume/resumeService');

// POST /api/resumes/analyze - Analyze resume text for ATS score
router.post('/analyze', authenticateToken, async (req, res, next) => {
  try {
    const { text, targetRole } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Resume text is required' });
    }
    const analysis = await resumeService.analyzeResume(text, targetRole);
    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
