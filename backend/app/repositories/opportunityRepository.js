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
      conditions.push('(LOWER(o.employment_type) = LOWER(?) OR LOWER(o.type) = LOWER(?))');
      params.push(type, type);
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

  calculateMatchScore(studentProfile, opportunity) {
    if (!studentProfile) {
      return {
        score: null,
        skillScore: 0,
        eligibilityScore: 0,
        preferenceScore: 0,
        completenessScore: 0,
        matchedSkills: [],
        missingSkills: opportunity.required_skills || []
      };
    }

    // 1. Skill Overlap (50%)
    const studentSkillNames = new Set(
      (studentProfile.skills || []).map((s) => (s.canonical_name || s.name || '').toLowerCase())
    );
    const required = (opportunity.required_skills || []).map((s) => String(s).trim());
    const matchedSkills = [];
    const missingSkills = [];

    required.forEach((r) => {
      const lower = r.toLowerCase();
      let hasSkill = studentSkillNames.has(lower);
      if (!hasSkill) {
        for (const s of studentSkillNames) {
          if (s.includes(lower) || lower.includes(s)) {
            hasSkill = true;
            break;
          }
        }
      }
      if (hasSkill) {
        matchedSkills.push(r);
      } else {
        missingSkills.push(r);
      }
    });

    let skillScore = 50;
    if (required.length > 0) {
      skillScore = Math.round(50 * (matchedSkills.length / required.length));
    }

    // 2. Eligibility Criteria (20%)
    let eligibilityScore = 0;
    // CGPA (10 pts)
    const minCgpa = opportunity.min_cgpa !== null && opportunity.min_cgpa !== undefined ? Number(opportunity.min_cgpa) : null;
    let studentCgpa = studentProfile.cgpa !== null && studentProfile.cgpa !== undefined ? Number(studentProfile.cgpa) : null;
    if (!studentCgpa && Array.isArray(studentProfile.education) && studentProfile.education.length > 0) {
      for (const edu of studentProfile.education) {
        const parsed = parseFloat(edu.grade || edu.cgpa);
        if (!isNaN(parsed)) { studentCgpa = parsed; break; }
      }
    }
    if (minCgpa === null || minCgpa === 0) {
      eligibilityScore += 10;
    } else if (studentCgpa !== null && studentCgpa >= minCgpa) {
      eligibilityScore += 10;
    }

    // Branch (5 pts)
    const branches = opportunity.eligible_branches || ['All'];
    let studentBranch = (studentProfile.branch || '').toLowerCase();
    if (!studentBranch && Array.isArray(studentProfile.education) && studentProfile.education.length > 0) {
      studentBranch = (studentProfile.education[0].field_of_study || studentProfile.education[0].field || '').toLowerCase();
    }
    const isBranchEligible = branches.some((b) => {
      const bLower = b.toLowerCase();
      return bLower === 'all' || (studentBranch && (studentBranch.includes(bLower) || bLower.includes(studentBranch) || (studentBranch.includes('computer') && bLower.includes('computer'))));
    });
    if (isBranchEligible) eligibilityScore += 5;

    // Graduation Year (5 pts)
    const gradYears = (opportunity.eligible_grad_years || ['All']).map(String);
    let studentGradYear = studentProfile.graduation_year ? String(studentProfile.graduation_year) : '';
    if (!studentGradYear && Array.isArray(studentProfile.education) && studentProfile.education.length > 0) {
      studentGradYear = String(studentProfile.education[0].end_year || studentProfile.education[0].end || '');
    }
    const isYearEligible = gradYears.includes('All') || (studentGradYear && gradYears.includes(studentGradYear));
    if (isYearEligible) eligibilityScore += 5;

    // 3. Preference Alignment (20%)
    let preferenceScore = 0;
    // Role (10 pts)
    const prefRoles = [];
    if (studentProfile.preferred_role) prefRoles.push(studentProfile.preferred_role.toLowerCase());
    if (studentProfile.preferred_roles) {
      let roles = [];
      try {
        roles = Array.isArray(studentProfile.preferred_roles) ? studentProfile.preferred_roles : JSON.parse(studentProfile.preferred_roles || '[]');
      } catch (_) {
        roles = (studentProfile.preferred_roles || '').split(',').map(r => r.trim());
      }
      roles.forEach(r => prefRoles.push(r.toLowerCase()));
    }
    const oppTitle = (opportunity.title || '').toLowerCase();
    const isRoleMatch = prefRoles.length === 0 || prefRoles.some(pr => oppTitle.includes(pr) || pr.includes(oppTitle));
    if (isRoleMatch) preferenceScore += 10;

    // Location (5 pts)
    const prefLocs = [];
    if (studentProfile.preferred_location) prefLocs.push(studentProfile.preferred_location.toLowerCase());
    if (studentProfile.preferred_locations) {
      let locs = [];
      try {
        locs = Array.isArray(studentProfile.preferred_locations) ? studentProfile.preferred_locations : JSON.parse(studentProfile.preferred_locations || '[]');
      } catch (_) {
        locs = (studentProfile.preferred_locations || '').split(',').map(l => l.trim());
      }
      locs.forEach(l => prefLocs.push(l.toLowerCase()));
    }
    const oppLoc = (opportunity.location || '').toLowerCase();
    const isLocMatch = prefLocs.length === 0 || prefLocs.some(pl => oppLoc.includes(pl) || pl.includes(oppLoc) || pl === 'remote');
    if (isLocMatch) preferenceScore += 5;

    // Work Mode (5 pts)
    const prefMode = (studentProfile.work_mode_preference || 'any').toLowerCase();
    const oppMode = (opportunity.work_mode || 'any').toLowerCase();
    const isModeMatch = prefMode === 'any' || oppMode === 'any' || prefMode === oppMode;
    if (isModeMatch) preferenceScore += 5;

    // 4. Profile Completeness (10%)
    const completeness = studentProfile.profile_completeness || studentProfile.completeness_report?.percentage || 0;
    const completenessScore = Math.round(completeness * 0.10);

    const totalScore = Math.min(100, Math.max(0, skillScore + eligibilityScore + preferenceScore + completenessScore));
    const grade = totalScore >= 80 ? 'A' : totalScore >= 70 ? 'B' : totalScore >= 50 ? 'C' : 'D';

    return {
      score: totalScore,
      grade,
      skillScore,
      eligibilityScore,
      preferenceScore,
      completenessScore,
      matchedSkills,
      missingSkills,
      weights: {
        skills: 0.5,
        eligibility: 0.2,
        preferences: 0.2,
        completeness: 0.1
      }
    };
  }

  enrichWithMatchScores(studentProfile, opportunities) {
    if (!Array.isArray(opportunities)) return [];
    return opportunities.map((opp) => {
      const match = this.calculateMatchScore(studentProfile, opp);
      return {
        ...opp,
        match_score: match.score,
        match_breakdown: match
      };
    });
  }
}

module.exports = new OpportunityRepository();
