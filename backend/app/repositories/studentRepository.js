'use strict';

const db = require('../core/database/connection');

class StudentRepository {
  async findByUserId(userId) {
    return db.get(
      `SELECT sp.*, u.email, u.full_name, u.phone
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.user_id = ?`,
      [userId]
    );
  }

  async findById(profileId) {
    return db.get(
      `SELECT sp.*, u.email, u.full_name, u.phone
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.id = ?`,
      [profileId]
    );
  }

  async createProfile(userId, data = {}) {
    const res = await db.run(
      `INSERT INTO student_profiles (user_id, headline, bio, location, github_url, linkedin_url, portfolio_url, preferred_role, preferred_location, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.headline || null,
        data.bio || null,
        data.location || null,
        data.github_url || null,
        data.linkedin_url || null,
        data.portfolio_url || null,
        data.preferred_role || null,
        data.preferred_location || null,
        data.is_public !== undefined ? (data.is_public ? 1 : 0) : 1
      ]
    );
    return this.findById(res.lastID);
  }

  async updateProfile(profileId, data) {
    await db.run(
      `UPDATE student_profiles SET
        headline = COALESCE(?, headline),
        bio = COALESCE(?, bio),
        location = COALESCE(?, location),
        github_url = COALESCE(?, github_url),
        linkedin_url = COALESCE(?, linkedin_url),
        portfolio_url = COALESCE(?, portfolio_url),
        preferred_role = COALESCE(?, preferred_role),
        preferred_location = COALESCE(?, preferred_location),
        is_public = COALESCE(?, is_public),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.headline,
        data.bio,
        data.location,
        data.github_url,
        data.linkedin_url,
        data.portfolio_url,
        data.preferred_role,
        data.preferred_location,
        data.is_public !== undefined ? (data.is_public ? 1 : 0) : null,
        profileId
      ]
    );
    return this.findById(profileId);
  }

  // Education
  async getEducation(studentId) {
    return db.all('SELECT * FROM student_education WHERE student_id = ? ORDER BY end_year DESC', [studentId]);
  }

  async addEducation(studentId, edu) {
    return db.run(
      `INSERT INTO student_education (student_id, institution, degree, field_of_study, start_year, end_year, grade_or_cgpa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [studentId, edu.institution, edu.degree, edu.field_of_study, edu.start_year, edu.end_year, edu.grade_or_cgpa]
    );
  }

  async deleteEducation(studentId, eduId) {
    return db.run('DELETE FROM student_education WHERE id = ? AND student_id = ?', [eduId, studentId]);
  }

  // Experience
  async getExperience(studentId) {
    return db.all('SELECT * FROM student_experience WHERE student_id = ? ORDER BY start_date DESC', [studentId]);
  }

  async addExperience(studentId, exp) {
    return db.run(
      `INSERT INTO student_experience (student_id, company_name, role_title, location, start_date, end_date, is_current, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentId, exp.company_name, exp.role_title, exp.location, exp.start_date, exp.end_date, exp.is_current ? 1 : 0, exp.description]
    );
  }

  async deleteExperience(studentId, expId) {
    return db.run('DELETE FROM student_experience WHERE id = ? AND student_id = ?', [expId, studentId]);
  }

  // Projects
  async getProjects(studentId) {
    const rows = await db.all('SELECT * FROM student_projects WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    return rows.map((r) => ({
      ...r,
      technologies: r.technologies ? JSON.parse(r.technologies) : []
    }));
  }

  async addProject(studentId, proj) {
    return db.run(
      `INSERT INTO student_projects (student_id, title, description, technologies, project_url, github_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        proj.title,
        proj.description,
        JSON.stringify(proj.technologies || []),
        proj.project_url || null,
        proj.github_url || null
      ]
    );
  }

  async deleteProject(studentId, projId) {
    return db.run('DELETE FROM student_projects WHERE id = ? AND student_id = ?', [projId, studentId]);
  }

  // Skills
  async getSkills(studentId) {
    return db.all(
      `SELECT ss.*, s.canonical_name, s.category_id, sc.name as category_name
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       LEFT JOIN skill_categories sc ON s.category_id = sc.id
       WHERE ss.student_id = ?`,
      [studentId]
    );
  }

  async addSkill(studentId, skillId, level = 'intermediate', source = 'manual', confidence = 1.0) {
    return db.run(
      `INSERT OR REPLACE INTO student_skills (student_id, skill_id, proficiency_level, source, confidence_score)
       VALUES (?, ?, ?, ?, ?)`,
      [studentId, skillId, level, source, confidence]
    );
  }

  async removeSkill(studentId, skillId) {
    return db.run('DELETE FROM student_skills WHERE student_id = ? AND skill_id = ?', [studentId, skillId]);
  }

  // Certifications
  async getCertifications(studentId) {
    return db.all('SELECT * FROM student_certifications WHERE student_id = ? ORDER BY issue_date DESC', [studentId]);
  }

  async addCertification(studentId, cert) {
    return db.run(
      `INSERT INTO student_certifications (student_id, title, issuing_organization, issue_date, expiration_date, credential_id, credential_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        cert.title,
        cert.issuing_organization,
        cert.issue_date,
        cert.expiration_date || null,
        cert.credential_id || null,
        cert.credential_url || null
      ]
    );
  }

  async deleteCertification(studentId, certId) {
    return db.run('DELETE FROM student_certifications WHERE id = ? AND student_id = ?', [certId, studentId]);
  }

  calculateProfileCompleteness(profile) {
    let score = 0;
    // 1. Personal & Contact Info (20%)
    if (profile.full_name) score += 5;
    if (profile.headline) score += 5;
    if (profile.bio) score += 5;
    if (profile.location) score += 5;

    // 2. Education History (20%)
    if (profile.education && profile.education.length > 0) score += 20;

    // 3. Skills Matrix (20%)
    if (profile.skills && profile.skills.length >= 3) {
      score += 20;
    } else if (profile.skills && profile.skills.length > 0) {
      score += profile.skills.length * 6;
    }

    // 4. Projects Showcase (20%)
    if (profile.projects && profile.projects.length > 0) score += 20;

    // 5. Credentials & Links (20%)
    let extra = 0;
    if (profile.certifications && profile.certifications.length > 0) extra += 8;
    if (profile.github_url || profile.linkedin_url || profile.portfolio_url) extra += 6;
    if (profile.preferred_role) extra += 6;
    score += Math.min(extra, 20);

    return Math.min(Math.round(score), 100);
  }

  async getFullProfile(studentId) {
    const profile = await this.findById(studentId);
    if (!profile) return null;

    const [education, experience, projects, skills, certifications] = await Promise.all([
      this.getEducation(studentId),
      this.getExperience(studentId),
      this.getProjects(studentId),
      this.getSkills(studentId),
      this.getCertifications(studentId)
    ]);

    const assembled = {
      ...profile,
      education,
      experience,
      projects,
      skills,
      certifications
    };

    assembled.profile_completeness = this.calculateProfileCompleteness(assembled);

    return assembled;
  }
}

module.exports = new StudentRepository();
