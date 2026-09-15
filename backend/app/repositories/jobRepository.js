'use strict';

const db = require('../core/database/connection');

class JobRepository {
  async findById(jobId) {
    const job = await db.get(
      `SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.website as company_website,
              u.full_name as recruiter_name, u.email as recruiter_email
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       JOIN recruiter_profiles rp ON j.created_by_recruiter_id = rp.id
       JOIN users u ON rp.user_id = u.id
       WHERE j.id = ? AND j.deleted_at IS NULL`,
      [jobId]
    );

    if (!job) return null;

    const skills = await this.getJobSkills(jobId);
    return { ...job, skills };
  }

  async findAllPublished(filters = {}) {
    let baseSql = `
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'published' AND j.deleted_at IS NULL
    `;
    const params = [];

    if (filters.location) {
      baseSql += ' AND j.location LIKE ?';
      params.push(`%${filters.location}%`);
    }

    if (filters.employmentType || filters.type) {
      baseSql += ' AND j.employment_type = ?';
      params.push(filters.employmentType || filters.type);
    }

    if (filters.workType) {
      baseSql += ' AND j.location LIKE ?';
      params.push(`%${filters.workType}%`);
    }

    if (filters.search) {
      baseSql += ' AND (j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.skill) {
      baseSql += ` AND j.id IN (
        SELECT js.job_id FROM job_skills js
        JOIN skills s ON js.skill_id = s.id
        WHERE LOWER(s.canonical_name) = ?
      )`;
      params.push(String(filters.skill).toLowerCase().trim());
    }

    // Count total
    const countRow = await db.get(`SELECT COUNT(*) as total ${baseSql}`, params);
    const total = countRow ? countRow.total : 0;

    let sql = `
      SELECT j.id, j.title, j.description, j.department, j.location, j.employment_type, j.experience_level,
             j.min_experience_years, j.min_education, j.min_salary, j.max_salary, j.deadline,
             j.created_at, c.id as company_id, c.name as company_name, c.logo_url as company_logo
      ${baseSql}
      ORDER BY j.created_at DESC
    `;

    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 50;
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const offset = (page - 1) * limit;

    sql += ' LIMIT ? OFFSET ?';
    const queryParams = [...params, limit, offset];

    const jobs = await db.all(sql, queryParams);
    // Attach skills
    for (const job of jobs) {
      job.skills = await this.getJobSkills(job.id);
    }

    return { jobs, total, page, limit };
  }

  async findByRecruiter(recruiterProfileId) {
    const jobs = await db.all(
      `SELECT j.*, c.name as company_name,
              (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       WHERE j.created_by_recruiter_id = ? AND j.deleted_at IS NULL
       ORDER BY j.created_at DESC`,
      [recruiterProfileId]
    );

    for (const job of jobs) {
      job.skills = await this.getJobSkills(job.id);
    }
    return jobs;
  }

  async create(jobData) {
    const res = await db.run(
      `INSERT INTO jobs (
        company_id, created_by_recruiter_id, title, description, department, location,
        employment_type, experience_level, min_experience_years, min_education,
        min_salary, max_salary, deadline, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobData.companyId,
        jobData.recruiterProfileId,
        jobData.title,
        jobData.description,
        jobData.department || null,
        jobData.location,
        jobData.employmentType || 'full-time',
        jobData.experienceLevel || 'entry',
        jobData.minExperienceYears || 0,
        jobData.minEducation || 'Bachelor',
        jobData.minSalary || null,
        jobData.maxSalary || null,
        jobData.deadline || null,
        jobData.status || 'published'
      ]
    );

    const jobId = res.lastID;

    // Attach required & preferred skills
    if (Array.isArray(jobData.requiredSkills)) {
      for (const skillRef of jobData.requiredSkills) {
        let resolvedId = skillRef;
        if (typeof skillRef === 'string') {
          const row = await db.get(
            'SELECT id FROM skills WHERE canonical_name = ? COLLATE NOCASE UNION SELECT skill_id as id FROM skill_aliases WHERE alias_name = ? COLLATE NOCASE LIMIT 1',
            [skillRef, skillRef]
          );
          if (row) resolvedId = row.id;
          else continue;
        }
        await db.run(
          'INSERT OR IGNORE INTO job_skills (job_id, skill_id, is_required, weight) VALUES (?, ?, 1, 1.0)',
          [jobId, resolvedId]
        );
      }
    }

    if (Array.isArray(jobData.preferredSkills)) {
      for (const skillRef of jobData.preferredSkills) {
        let resolvedId = skillRef;
        if (typeof skillRef === 'string') {
          const row = await db.get(
            'SELECT id FROM skills WHERE canonical_name = ? COLLATE NOCASE UNION SELECT skill_id as id FROM skill_aliases WHERE alias_name = ? COLLATE NOCASE LIMIT 1',
            [skillRef, skillRef]
          );
          if (row) resolvedId = row.id;
          else continue;
        }
        await db.run(
          'INSERT OR IGNORE INTO job_skills (job_id, skill_id, is_required, weight) VALUES (?, ?, 0, 0.5)',
          [jobId, resolvedId]
        );
      }
    }

    return this.findById(jobId);
  }

  async update(jobId, updates) {
    await db.run(
      `UPDATE jobs SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        location = COALESCE(?, location),
        employment_type = COALESCE(?, employment_type),
        min_experience_years = COALESCE(?, min_experience_years),
        min_education = COALESCE(?, min_education),
        min_salary = COALESCE(?, min_salary),
        max_salary = COALESCE(?, max_salary),
        deadline = COALESCE(?, deadline),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updates.title,
        updates.description,
        updates.location,
        updates.employmentType,
        updates.minExperienceYears,
        updates.minEducation,
        updates.minSalary,
        updates.maxSalary,
        updates.deadline,
        updates.status,
        jobId
      ]
    );
    return this.findById(jobId);
  }

  async delete(jobId) {
    return db.run('UPDATE jobs SET deleted_at = CURRENT_TIMESTAMP, status = "closed" WHERE id = ?', [jobId]);
  }

  async getJobSkills(jobId) {
    return db.all(
      `SELECT js.*, s.canonical_name, s.category_id, sc.name as category_name
       FROM job_skills js
       JOIN skills s ON js.skill_id = s.id
       LEFT JOIN skill_categories sc ON s.category_id = sc.id
       WHERE js.job_id = ?`,
      [jobId]
    );
  }
}

module.exports = new JobRepository();
