// backend/app/services/matching/matchingService.js
const matchingEngine = require('../../ai/matching_engine/matchingEngine');
const studentRepository = require('../../repositories/studentRepository');
const jobRepository = require('../../repositories/jobRepository');

class MatchingService {
  async matchStudentWithJob(studentId, jobId) {
    const student = await studentRepository.findById(studentId);
    const job = await jobRepository.findById(jobId);
    if (!student || !job) throw new Error('Student or Job not found');

    return await matchingEngine.calculateMatch(student, job);
  }

  async rankCandidatesForJob(jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error('Job not found');

    const applicants = await require('../../repositories/applicationRepository').findByJobId(jobId);
    const scoredApplicants = await Promise.all(
      applicants.map(async (app) => {
        const student = await studentRepository.findById(app.student_id);
        const match = student ? await matchingEngine.calculateMatch(student, job) : { overallScore: app.match_score || 50, breakdown: {} };
        return {
          ...app,
          candidate: student,
          matchScore: match.overallScore,
          breakdown: match.breakdown
        };
      })
    );

    return scoredApplicants.sort((a, b) => b.matchScore - a.matchScore);
  }
}

module.exports = new MatchingService();
