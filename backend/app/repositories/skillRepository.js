'use strict';

const db = require('../core/database/connection');

class SkillRepository {
  async findAll() {
    return db.all(
      `SELECT s.*, sc.name as category_name, p.canonical_name as parent_skill_name
       FROM skills s
       LEFT JOIN skill_categories sc ON s.category_id = sc.id
       LEFT JOIN skills p ON s.parent_skill_id = p.id
       WHERE s.is_active = 1
       ORDER BY s.canonical_name ASC`
    );
  }

  async search(query) {
    if (!query) return [];
    return db.all(
      `SELECT s.id, s.canonical_name, sc.name as category_name
       FROM skills s
       LEFT JOIN skill_categories sc ON s.category_id = sc.id
       LEFT JOIN skill_aliases sa ON sa.skill_id = s.id
       WHERE s.is_active = 1 AND (s.canonical_name LIKE ? OR sa.alias_name LIKE ?)
       GROUP BY s.id
       LIMIT 20`,
      [`%${query}%`, `%${query}%`]
    );
  }

  async getCategories() {
    return db.all('SELECT * FROM skill_categories ORDER BY name ASC');
  }

  async resolveCanonical(skillNameOrAlias) {
    if (!skillNameOrAlias) return null;
    const clean = String(skillNameOrAlias).trim();

    // 1. Direct canonical match
    const exact = await db.get('SELECT * FROM skills WHERE canonical_name = ? COLLATE NOCASE AND is_active = 1', [clean]);
    if (exact) return exact;

    // 2. Alias match
    const aliased = await db.get(
      `SELECT s.* FROM skill_aliases sa
       JOIN skills s ON sa.skill_id = s.id
       WHERE sa.alias_name = ? COLLATE NOCASE AND s.is_active = 1`,
      [clean]
    );
    if (aliased) return aliased;

    return null;
  }

  async getHierarchy(skillId) {
    return db.get(
      `SELECT s.*, p.id as parent_id, p.canonical_name as parent_name
       FROM skills s
       LEFT JOIN skills p ON s.parent_skill_id = p.id
       WHERE s.id = ?`,
      [skillId]
    );
  }

  async addCanonicalSkill(name, categoryId = null, parentSkillId = null) {
    const res = await db.run(
      'INSERT INTO skills (canonical_name, category_id, parent_skill_id, is_active) VALUES (?, ?, ?, 1)',
      [name, categoryId, parentSkillId]
    );
    return db.get('SELECT * FROM skills WHERE id = ?', [res.lastID]);
  }

  async addAlias(skillId, aliasName) {
    return db.run(
      'INSERT OR IGNORE INTO skill_aliases (skill_id, alias_name) VALUES (?, ?)',
      [skillId, aliasName]
    );
  }
}

module.exports = new SkillRepository();
