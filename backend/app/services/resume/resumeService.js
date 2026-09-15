// backend/app/services/resume/resumeService.js
const resumeTailor = require('../../ai/resume_analyzer/resumeTailor');

class ResumeService {
  async analyzeResume(text, targetRole = 'Software Engineer') {
    // Utilize existing battle-tested resumeTailor service
    if (typeof resumeTailor.analyzeATS === 'function') {
      return await resumeTailor.analyzeATS(text, targetRole);
    }
    
    // Heuristic fallback
    const wordCount = (text || '').split(/\s+/).length;
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
    const hasPhone = /\+?\d[\d -]{8,12}\d/.test(text);
    const hasEducation = /(bachelor|master|b\.tech|degree|university|college)/i.test(text);
    const hasExperience = /(experience|work|project|internship)/i.test(text);

    let score = 50;
    if (hasEmail) score += 10;
    if (hasPhone) score += 10;
    if (hasEducation) score += 15;
    if (hasExperience) score += 15;

    return {
      atsScore: Math.min(score, 100),
      wordCount,
      sectionsDetected: {
        contact: hasEmail && hasPhone,
        education: hasEducation,
        experience: hasExperience
      },
      feedback: score >= 80 ? 'Strong resume formatting' : 'Improve section headers and details'
    };
  }
}

module.exports = new ResumeService();
