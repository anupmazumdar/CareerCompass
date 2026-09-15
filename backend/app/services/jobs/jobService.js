// backend/app/services/jobs/jobService.js
const jobRepository = require('../../repositories/jobRepository');
const skillRepository = require('../../repositories/skillRepository');

class JobService {
  async getAllJobs(filters = {}) {
    return await jobRepository.findAll(filters);
  }

  async getJobById(jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) return null;
    const requiredSkills = await skillRepository.getJobSkills(jobId);
    return { ...job, skills: requiredSkills };
  }

  async createJob(recruiterUserId, jobData) {
    const recruiter = await require('../../repositories/recruiterRepository').findByUserId(recruiterUserId);
    if (!recruiter) throw new Error('Recruiter profile required to post job');

    return await jobRepository.create({
      ...jobData,
      recruiter_id: recruiter.id,
      company_id: recruiter.company_id
    });
  }
}

module.exports = new JobService();
