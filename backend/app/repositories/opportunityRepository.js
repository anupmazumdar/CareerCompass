'use strict';

const db = require('../core/database/connection');

class OpportunityRepository {
  async findById(id) {
    const row = await db.get(
      `SELECT o.*, u.full_name as posted_by_name, u.email as posted_by_email
       FROM opportunities o
       LEFT JOIN users u ON o.posted_by = u.id
       WHERE o.id = ? AND o.deleted_at IS NULL`,
      [id]
    );
    if (!row) return null;
    return this._formatOpportunity(row);
  }

  async findAll(options = {}) {
    const {
      search,
      type,
      workMode,
      location,
      minCgpa,
      skills,
      status = 'published',
      sort = 'newest',
      page = 1,
      limit = 20
    } = options;

    const conditions = ['o.deleted_at IS NULL'];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (type && type !== 'all') {
      conditions.push('o.type = ?');
      params.push(type);
    }

    if (workMode && workMode !== 'all') {
      conditions.push('o.work_mode = ?');
      params.push(workMode);
    }

    if (location && location.trim()) {
      conditions.push('o.location LIKE ?');
      params.push(`%${location.trim()}%`);
    }

    if (minCgpa !== undefined && minCgpa !== null && !isNaN(minCgpa)) {
      conditions.push('o.min_cgpa <= ?');
      params.push(Number(minCgpa));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push('(o.title LIKE ? OR o.company LIKE ? OR o.description LIKE ? OR o.required_skills LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort order
    let orderBy = 'o.created_at DESC';
    if (sort === 'deadline') {
      orderBy = 'CASE WHEN o.deadline IS NULL THEN 1 ELSE 0 END, o.deadline ASC';
    } else if (sort === 'title') {
      orderBy = 'o.title ASC';
    } else if (sort === 'salary') {
      orderBy = 'COALESCE(o.max_salary, o.min_salary, 0) DESC';
    }

    // Count total
    const countRow = await db.get(
      `SELECT COUNT(*) as total FROM opportunities o ${whereClause}`,
      params
    );
    const total = countRow ? countRow.total : 0;

    // Pagination
    const offset = Math.max(0, (Number(page) - 1) * Number(limit));
    const queryParams = [...params, Number(limit), offset];

    const rows = await db.all(
      `SELECT o.*, u.full_name as posted_by_name
       FROM opportunities o
       LEFT JOIN users u ON o.posted_by = u.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      queryParams
    );

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      items: rows.map(r => this._formatOpportunity(r))
    };
  }

  async getClosingSoon(days = 14, limit = 6) {
    const rows = await db.all(
      `SELECT o.*, u.full_name as posted_by_name
       FROM opportunities o
       LEFT JOIN users u ON o.posted_by = u.id
       WHERE o.deleted_at IS NULL
         AND o.status = 'published'
         AND o.deadline IS NOT NULL
         AND datetime(o.deadline) >= datetime('now')
         AND datetime(o.deadline) <= datetime('now', '+' || ? || ' days')
       ORDER BY o.deadline ASC
       LIMIT ?`,
      [days, limit]
    );
    return rows.map(r => this._formatOpportunity(r));
  }

  async create(data) {
    const requiredSkillsJson = Array.isArray(data.required_skills || data.requiredSkills)
      ? JSON.stringify(data.required_skills || data.requiredSkills)
      : (data.required_skills || data.requiredSkills || '[]');

    const eligibleBranchesJson = Array.isArray(data.eligible_branches || data.eligibleBranches)
      ? JSON.stringify(data.eligible_branches || data.eligibleBranches)
      : (data.eligible_branches || data.eligibleBranches || '["All"]');

    const eligibleGradYearsJson = Array.isArray(data.eligible_grad_years || data.eligibleGradYears)
      ? JSON.stringify(data.eligible_grad_years || data.eligibleGradYears)
      : (data.eligible_grad_years || data.eligibleGradYears || '["All"]');

    const res = await db.run(
      `INSERT INTO opportunities (
        title, company, company_id, type, description, required_skills,
        location, work_mode, work_type, employment_type, experience_level,
        min_cgpa, eligible_branches, eligible_grad_years, min_salary,
        max_salary, stipend_range, deadline, apply_link, posted_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.company,
        data.company_id || null,
        data.type || 'Job',
        data.description || '',
        requiredSkillsJson,
        data.location || 'Remote',
        data.work_mode || data.workMode || 'onsite',
        data.work_mode || data.workMode || 'onsite',
        data.employment_type || data.employmentType || 'full-time',
        data.experience_level || data.experienceLevel || 'entry',
        (data.min_cgpa !== undefined || data.minCgpa !== undefined) ? Number(data.min_cgpa !== undefined ? data.min_cgpa : data.minCgpa) : 0.0,
        eligibleBranchesJson,
        eligibleGradYearsJson,
        data.min_salary !== undefined ? Number(data.min_salary) : null,
        data.max_salary !== undefined ? Number(data.max_salary) : null,
        data.stipend_range || data.stipendRange || null,
        data.deadline || null,
        data.apply_link || data.applyLink || null,
        data.posted_by || data.postedBy || null,
        data.status || 'published'
      ]
    );
    return this.findById(res.lastID);
  }

  async update(id, data) {
    const requiredSkillsJson = (data.required_skills !== undefined || data.requiredSkills !== undefined)
      ? (Array.isArray(data.required_skills || data.requiredSkills) ? JSON.stringify(data.required_skills || data.requiredSkills) : (data.required_skills || data.requiredSkills))
      : null;

    const eligibleBranchesJson = (data.eligible_branches !== undefined || data.eligibleBranches !== undefined)
      ? (Array.isArray(data.eligible_branches || data.eligibleBranches) ? JSON.stringify(data.eligible_branches || data.eligibleBranches) : (data.eligible_branches || data.eligibleBranches))
      : null;

    const eligibleGradYearsJson = (data.eligible_grad_years !== undefined || data.eligibleGradYears !== undefined)
      ? (Array.isArray(data.eligible_grad_years || data.eligibleGradYears) ? JSON.stringify(data.eligible_grad_years || data.eligibleGradYears) : (data.eligible_grad_years || data.eligibleGradYears))
      : null;

    await db.run(
      `UPDATE opportunities SET
        title = COALESCE(?, title),
        company = COALESCE(?, company),
        type = COALESCE(?, type),
        description = COALESCE(?, description),
        required_skills = COALESCE(?, required_skills),
        location = COALESCE(?, location),
        work_mode = COALESCE(?, work_mode),
        work_type = COALESCE(?, work_type),
        employment_type = COALESCE(?, employment_type),
        experience_level = COALESCE(?, experience_level),
        min_cgpa = COALESCE(?, min_cgpa),
        eligible_branches = COALESCE(?, eligible_branches),
        eligible_grad_years = COALESCE(?, eligible_grad_years),
        min_salary = COALESCE(?, min_salary),
        max_salary = COALESCE(?, max_salary),
        stipend_range = COALESCE(?, stipend_range),
        deadline = COALESCE(?, deadline),
        apply_link = COALESCE(?, apply_link),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND deleted_at IS NULL`,
      [
        data.title !== undefined ? data.title : null,
        data.company !== undefined ? data.company : null,
        data.type !== undefined ? data.type : null,
        data.description !== undefined ? data.description : null,
        requiredSkillsJson,
        data.location !== undefined ? data.location : null,
        (data.work_mode !== undefined || data.workMode !== undefined) ? (data.work_mode || data.workMode) : null,
        (data.work_mode !== undefined || data.workMode !== undefined) ? (data.work_mode || data.workMode) : null,
        (data.employment_type !== undefined || data.employmentType !== undefined) ? (data.employment_type || data.employmentType) : null,
        (data.experience_level !== undefined || data.experienceLevel !== undefined) ? (data.experience_level || data.experienceLevel) : null,
        (data.min_cgpa !== undefined || data.minCgpa !== undefined) ? Number(data.min_cgpa !== undefined ? data.min_cgpa : data.minCgpa) : null,
        eligibleBranchesJson,
        eligibleGradYearsJson,
        data.min_salary !== undefined ? Number(data.min_salary) : null,
        data.max_salary !== undefined ? Number(data.max_salary) : null,
        (data.stipend_range !== undefined || data.stipendRange !== undefined) ? (data.stipend_range || data.stipendRange) : null,
        data.deadline !== undefined ? data.deadline : null,
        (data.apply_link !== undefined || data.applyLink !== undefined) ? (data.apply_link || data.applyLink) : null,
        data.status !== undefined ? data.status : null,
        id
      ]
    );
    return this.findById(id);
  }

  async delete(id) {
    return db.run(
      `UPDATE opportunities SET deleted_at = CURRENT_TIMESTAMP, status = 'closed' WHERE id = ?`,
      [id]
    );
  }

  // Saved / Bookmarked Opportunities
  async getSavedOpportunities(studentId) {
    const rows = await db.all(
      `SELECT so.id as saved_id, so.created_at as saved_at, o.*, u.full_name as posted_by_name
       FROM saved_opportunities so
       JOIN opportunities o ON so.opportunity_id = o.id
       LEFT JOIN users u ON o.posted_by = u.id
       WHERE so.student_id = ? AND o.deleted_at IS NULL
       ORDER BY so.created_at DESC`,
      [studentId]
    );
    return rows.map(r => ({
      ...this._formatOpportunity(r),
      saved_id: r.saved_id,
      saved_at: r.saved_at
    }));
  }

  async saveOpportunity(studentId, opportunityId) {
    await db.run(
      `INSERT OR IGNORE INTO saved_opportunities (student_id, opportunity_id)
       VALUES (?, ?)`,
      [studentId, opportunityId]
    );
    return { success: true, studentId, opportunityId };
  }

  async unsaveOpportunity(studentId, opportunityId) {
    return db.run(
      `DELETE FROM saved_opportunities WHERE student_id = ? AND (opportunity_id = ? OR id = ?)`,
      [studentId, opportunityId, opportunityId]
    );
  }

  async isOpportunitySaved(studentId, opportunityId) {
    const row = await db.get(
      `SELECT id FROM saved_opportunities WHERE student_id = ? AND opportunity_id = ?`,
      [studentId, opportunityId]
    );
    return Boolean(row);
  }

  _formatOpportunity(row) {
    let parsedSkills = [];
    try {
      parsedSkills = row.required_skills ? JSON.parse(row.required_skills) : [];
    } catch (_) {
      parsedSkills = (row.required_skills || '').split(',').map(s => s.trim()).filter(Boolean);
    }

    let parsedBranches = ['All'];
    try {
      parsedBranches = row.eligible_branches ? JSON.parse(row.eligible_branches) : ['All'];
    } catch (_) {
      parsedBranches = (row.eligible_branches || 'All').split(',').map(s => s.trim()).filter(Boolean);
    }

    let parsedGradYears = ['All'];
    try {
      parsedGradYears = row.eligible_grad_years ? JSON.parse(row.eligible_grad_years) : ['All'];
    } catch (_) {
      parsedGradYears = (row.eligible_grad_years || 'All').split(',').map(s => s.trim()).filter(Boolean);
    }

    return {
      ...row,
      required_skills: parsedSkills,
      eligible_branches: parsedBranches,
      eligible_grad_years: parsedGradYears
    };
  }
}

module.exports = new OpportunityRepository();
