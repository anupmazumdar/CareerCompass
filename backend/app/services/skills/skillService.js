// backend/app/services/skills/skillService.js
const skillRepository = require('../../repositories/skillRepository');

class SkillService {
  async searchSkills(query, limit = 10) {
    return await skillRepository.search(query, limit);
  }

  async normalizeSkill(rawSkill) {
    return await skillRepository.normalize(rawSkill);
  }

  async getAllCategories() {
    return await skillRepository.getAllCategories();
  }
}

module.exports = new SkillService();
