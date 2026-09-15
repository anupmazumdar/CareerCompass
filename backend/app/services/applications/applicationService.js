// backend/app/services/applications/applicationService.js
const applicationRepository = require('../../repositories/applicationRepository');
const matchingEngine = require('../../ai/matching_engine/matchingEngine');

class ApplicationService {
  async applyToJob(studentUserId, jobId, resumeId = null) {
    const student = await require('../../repositories/studentRepository').findByUserId(studentUserId);
    if (!student) throw new Error('Student profile required to apply');

    // Calculate match score on application
    const job = await require('../../repositories/jobRepository').findById(jobId);
    let score = 75; // Baseline
    if (job) {
      const matchResult = await matchingEngine.calculateMatch(student, job);
      score = matchResult.overallScore;
    }

    return await applicationRepository.create({
      job_id: jobId,
      student_id: student.id,
      resume_id: resumeId,
      status: 'APPLIED',
      match_score: score
    });
  }

  async updateStage(applicationId, newStatus, changedByUserId, notes = '') {
    return await applicationRepository.updateStatus(applicationId, newStatus, changedByUserId, notes);
  }

  async getStudentApplications(studentUserId) {
    const student = await require('../../repositories/studentRepository').findByUserId(studentUserId);
    if (!student) return [];
    return await applicationRepository.findByStudentId(student.id);
  }
}

module.exports = new ApplicationService();
