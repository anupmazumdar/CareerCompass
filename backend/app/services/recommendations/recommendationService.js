// backend/app/services/recommendations/recommendationService.js
const jobRepository = require('../../repositories/jobRepository');
const studentRepository = require('../../repositories/studentRepository');
const matchingEngine = require('../../ai/matching_engine/matchingEngine');

class RecommendationService {
  async getRecommendedJobsForStudent(userId, limit = 10) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) return [];

    const allJobs = await jobRepository.findAll({ is_active: 1 });
    const scoredJobs = await Promise.all(
      allJobs.map(async (job) => {
        const match = await matchingEngine.calculateMatch(student, job);
        return {
          ...job,
          matchScore: match.overallScore,
          matchBreakdown: match.breakdown
        };
      })
    );

    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  }
}

module.exports = new RecommendationService();
