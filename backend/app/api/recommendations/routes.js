'use strict';

const express = require('express');
const router = express.Router();
const studentRepo = require('../../repositories/studentRepository');
const jobRepo = require('../../repositories/jobRepository');
const matchingEngine = require('../../ai/matching_engine/matchingEngine');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// GET /api/recommendations/jobs (Student Job Recommendation Pipeline)
router.get('/jobs', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile not found' });
    }

    const fullProfile = await studentRepo.getFullProfile(student.id);
    const jobs = await jobRepo.findAllPublished();

    // Symmetrical Two-Way Matching: calculate score for every published job
    const recommendations = [];
    for (const job of jobs) {
      const match = await matchingEngine.computeMatch(fullProfile, job);
      recommendations.push({
        job,
        matchScore: match.final_score,
        grade: match.grade,
        breakdown: match.breakdown,
        matchedSkills: match.matched_skills,
        partialSkills: match.partial_skills,
        missingSkills: match.missing_skills,
        explanation: match.explanation
      });
    }

    // Sort descending by matchScore
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
