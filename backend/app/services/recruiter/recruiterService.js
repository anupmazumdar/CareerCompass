// backend/app/services/recruiter/recruiterService.js
const recruiterRepository = require('../../repositories/recruiterRepository');
const jobRepository = require('../../repositories/jobRepository');
const applicationRepository = require('../../repositories/applicationRepository');

class RecruiterService {
  async getProfile(userId) {
    return await recruiterRepository.findByUserId(userId);
  }

  async getDashboard(userId) {
    const recruiter = await recruiterRepository.findByUserId(userId);
    if (!recruiter) throw new Error('Recruiter profile not found');

    const jobs = await jobRepository.findByRecruiterId(recruiter.id);
    const jobIds = jobs.map(j => j.id);
    const applications = await applicationRepository.findByJobIds(jobIds);

    return {
      recruiter,
      activeJobsCount: jobs.filter(j => j.is_active).length,
      totalApplicantsCount: applications.length,
      recentApplications: applications.slice(0, 10)
    };
  }
}

module.exports = new RecruiterService();
