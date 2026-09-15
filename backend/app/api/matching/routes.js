'use strict';

const express = require('express');
const router = express.Router();
const studentRepo = require('../../repositories/studentRepository');
const jobRepo = require('../../repositories/jobRepository');
const recruiterRepo = require('../../repositories/recruiterRepository');
const appRepo = require('../../repositories/applicationRepository');
const matchingEngine = require('../../ai/matching_engine/matchingEngine');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');

// GET /api/matching/student/:studentId/job/:jobId (Detailed match breakdown)
router.get('/student/:studentId/job/:jobId', authenticateToken, async (req, res, next) => {
  try {
    const studentId = Number(req.params.studentId);
    const jobId = Number(req.params.jobId);

    // Permission check
    if (req.user.role === 'student') {
      const student = await studentRepo.findByUserId(req.user.userId);
      if (student?.id !== studentId) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
      }
    } else if (req.user.role === 'recruiter') {
      const recruiter = await recruiterRepo.findByUserId(req.user.userId);
      const job = await jobRepo.findById(jobId);
      if (job?.company_id !== recruiter?.company_id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
      }
    }

    const [fullStudent, job] = await Promise.all([
      studentRepo.getFullProfile(studentId),
      jobRepo.findById(jobId)
    ]);

    if (!fullStudent || !job) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student profile or job not found' });
    }

    const evaluation = await matchingEngine.computeMatch(fullStudent, job);
    return res.json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
});

// GET /api/matching/jobs/:id/candidates (Recruiter Candidate Ranking Pipeline)
router.get('/jobs/:id/candidates', authenticateToken, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    const jobId = Number(req.params.id);
    const job = await jobRepo.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Job not found' });
    }

    if (req.user.role === 'recruiter') {
      const recruiter = await recruiterRepo.findByUserId(req.user.userId);
      if (job.company_id !== recruiter?.company_id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only view candidates for your company jobs' });
      }
    }

    // Retrieve applicants for this job
    const applicants = await appRepo.findByJob(jobId);
    const rankedCandidates = [];

    for (const app of applicants) {
      const fullProfile = await studentRepo.getFullProfile(app.student_id);
      if (!fullProfile) continue;

      const match = await matchingEngine.computeMatch(fullProfile, job);
      rankedCandidates.push({
        applicationId: app.id,
        candidateId: app.student_id,
        candidateName: app.candidate_name,
        candidateEmail: app.candidate_email,
        headline: app.candidate_headline,
        status: app.status,
        matchScore: match.final_score,
        grade: match.grade,
        breakdown: match.breakdown,
        matchedSkills: match.matched_skills,
        partialSkills: match.partial_skills,
        missingSkills: match.missing_skills,
        explanation: match.explanation,
        appliedAt: app.applied_at
      });
    }

    // Rank descending
    rankedCandidates.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      jobId,
      jobTitle: job.title,
      count: rankedCandidates.length,
      data: rankedCandidates
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
