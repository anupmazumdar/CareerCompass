'use strict';

const db = require('../core/database/connection');

const TARGET_ROLES = {
  fullstack: {
    id: 'fullstack',
    title: 'Full-Stack Developer',
    description: 'Design and build modern full-stack web applications from interactive UI to scalable REST APIs and relational databases.',
    criticalSkills: ['React', 'Node.js', 'JavaScript', 'PostgreSQL', 'REST APIs', 'Git'],
    recommendedSkills: ['TypeScript', 'HTML/CSS', 'Docker', 'Tailwind CSS']
  },
  backend: {
    id: 'backend',
    title: 'Backend Engineer',
    description: 'Architect distributed backend systems, database schemas, microservices, and asynchronous event pipelines.',
    criticalSkills: ['Python', 'Node.js', 'PostgreSQL', 'REST APIs', 'Docker', 'SQL'],
    recommendedSkills: ['Redis', 'Microservices', 'AWS', 'Linux']
  },
  frontend: {
    id: 'frontend',
    title: 'Frontend Developer',
    description: 'Craft responsive, pixel-perfect user interfaces, manage client state, and optimize web vitals performance.',
    criticalSkills: ['JavaScript', 'TypeScript', 'React', 'HTML/CSS', 'Tailwind CSS', 'Git'],
    recommendedSkills: ['Next.js', 'Web Performance', 'Redux', 'Figma']
  },
  ai_data: {
    id: 'ai_data',
    title: 'AI / Data Engineer',
    description: 'Build predictive machine learning models, data analytics pipelines, and LLM-powered generative AI agents.',
    criticalSkills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Scikit-learn'],
    recommendedSkills: ['PyTorch', 'FastAPI', 'LLMs & GenAI', 'Docker']
  },
  devops: {
    id: 'devops',
    title: 'DevOps & Cloud Engineer',
    description: 'Automate continuous deployment pipelines, manage container orchestration with Kubernetes, and maintain cloud infrastructure.',
    criticalSkills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD Pipelines', 'Git'],
    recommendedSkills: ['AWS', 'Terraform', 'Python', 'Monitoring']
  }
};

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

  getTargetRoles() {
    return Object.values(TARGET_ROLES);
  }

  getTargetRole(roleKeyOrTitle) {
    if (!roleKeyOrTitle) return TARGET_ROLES.fullstack;
    const clean = String(roleKeyOrTitle).toLowerCase().trim();

    if (TARGET_ROLES[clean]) return TARGET_ROLES[clean];

    // Check title match
    const match = Object.values(TARGET_ROLES).find(
      r => r.title.toLowerCase().includes(clean) || clean.includes(r.id)
    );
    return match || TARGET_ROLES.fullstack;
  }

  async getLearningResources({ role = null, gapArea = null } = {}) {
    let sql = 'SELECT * FROM learning_resources WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND (role LIKE ? OR role = ?)';
      params.push(`%${role}%`, role);
    }
    if (gapArea) {
      sql += ' AND gap_area LIKE ?';
      params.push(`%${gapArea}%`);
    }

    sql += ' ORDER BY id ASC';
    return db.all(sql, params);
  }

  async computeGapAnalysis({ studentSkills = [], targetRoleKey = 'fullstack' }) {
    const role = this.getTargetRole(targetRoleKey);

    // Normalize student skills to lowercase map with proficiency
    const studentSkillMap = new Map();
    for (const sk of studentSkills) {
      const name = String(sk.skill_name || sk.canonical_name || sk.name || '').toLowerCase().trim();
      if (name) {
        studentSkillMap.set(name, {
          name: sk.skill_name || sk.canonical_name || sk.name,
          proficiency: sk.proficiency_level || sk.proficiency || 'intermediate',
          id: sk.skill_id || sk.id
        });
      }
    }

    const acquiredSkills = [];
    const missingSkills = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    const evaluateSkill = (skillName, isCritical) => {
      const weight = isCritical ? 1.5 : 1.0;
      totalWeight += weight;

      const normName = skillName.toLowerCase();
      let matched = studentSkillMap.get(normName);

      // Check common aliases
      if (!matched) {
        if (normName === 'rest apis' && (studentSkillMap.has('rest') || studentSkillMap.has('api design'))) {
          matched = studentSkillMap.get('rest') || studentSkillMap.get('api design');
        } else if (normName === 'html/css' && (studentSkillMap.has('html') || studentSkillMap.has('css'))) {
          matched = studentSkillMap.get('html') || studentSkillMap.get('css');
        } else if (normName === 'postgresql' && studentSkillMap.has('postgres')) {
          matched = studentSkillMap.get('postgres');
        }
      }

      if (matched) {
        let mult = 0.85; // default intermediate
        if (matched.proficiency === 'expert') mult = 1.0;
        if (matched.proficiency === 'beginner') mult = 0.6;

        earnedWeight += weight * mult;
        acquiredSkills.push({
          name: skillName,
          proficiency: matched.proficiency,
          priority: isCritical ? 'critical' : 'recommended'
        });
      } else {
        missingSkills.push({
          name: skillName,
          priority: isCritical ? 'critical' : 'recommended'
        });
      }
    };

    role.criticalSkills.forEach(s => evaluateSkill(s, true));
    role.recommendedSkills.forEach(s => evaluateSkill(s, false));

    const readinessScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    // Fetch learning resources for missing skills
    const allResources = await this.getLearningResources();
    const missingNames = new Set(missingSkills.map(m => m.name.toLowerCase()));

    const recommendedResources = allResources.filter(res =>
      missingNames.has(res.gap_area.toLowerCase()) ||
      missingSkills.some(m => res.gap_area.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(res.gap_area.toLowerCase()))
    );

    return {
      targetRole: {
        id: role.id,
        title: role.title,
        description: role.description
      },
      readinessScore,
      totalRequired: role.criticalSkills.length + role.recommendedSkills.length,
      acquiredCount: acquiredSkills.length,
      missingCount: missingSkills.length,
      acquiredSkills,
      missingSkills,
      recommendedResources: recommendedResources.slice(0, 8)
    };
  }
}

module.exports = new SkillRepository();
