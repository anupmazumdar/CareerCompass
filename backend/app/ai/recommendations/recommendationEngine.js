// backend/app/ai/recommendations/recommendationEngine.js
// Collaborative and content-based recommendation ranker

const matchingEngine = require('../matching_engine/matchingEngine');

class RecommendationEngine {
  async rankJobsForStudent(student, jobsList) {
    if (!student || !Array.isArray(jobsList)) return [];

    const scoredJobs = await Promise.all(
      jobsList.map(async (job) => {
        const match = await matchingEngine.calculateMatch(student, job);
        return {
          job,
          score: match.overallScore,
          breakdown: match.breakdown
        };
      })
    );

    return scoredJobs.sort((a, b) => b.score - a.score);
  }

  async rankCandidatesForJob(job, candidatesList) {
    if (!job || !Array.isArray(candidatesList)) return [];

    const scoredCandidates = await Promise.all(
      candidatesList.map(async (candidate) => {
        const match = await matchingEngine.calculateMatch(candidate, job);
        return {
          candidate,
          score: match.overallScore,
          breakdown: match.breakdown
        };
      })
    );

    return scoredCandidates.sort((a, b) => b.score - a.score);
  }
}

module.exports = new RecommendationEngine();
