// backend/app/services/student/studentService.js
const studentRepository = require('../../repositories/studentRepository');
const skillRepository = require('../../repositories/skillRepository');

class StudentService {
  async getProfile(userId) {
    const profile = await studentRepository.findByUserId(userId);
    if (!profile) return null;

    const skills = await skillRepository.getStudentSkills(profile.id);
    const education = await studentRepository.getEducation(profile.id);
    const experience = await studentRepository.getExperience(profile.id);

    return {
      ...profile,
      skills,
      education,
      experience
    };
  }

  async updateProfile(userId, profileData) {
    let profile = await studentRepository.findByUserId(userId);
    if (!profile) {
      profile = await studentRepository.create({ user_id: userId, ...profileData });
    } else {
      profile = await studentRepository.update(profile.id, profileData);
    }
    return profile;
  }

  async addSkill(userId, skillName, proficiencyLevel = 'INTERMEDIATE') {
    const profile = await studentRepository.findByUserId(userId);
    if (!profile) throw new Error('Student profile not found');
    const skill = await skillRepository.findOrCreate(skillName);
    return await skillRepository.addStudentSkill(profile.id, skill.id, proficiencyLevel);
  }
}

module.exports = new StudentService();
