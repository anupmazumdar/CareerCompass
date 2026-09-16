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
      `INSERT INTO student_profiles (
        user_id, headline, bio, location, college, degree, branch, current_semester,
        graduation_year, cgpa, achievements, github_url, linkedin_url, portfolio_url,
        preferred_role, preferred_roles, preferred_location, preferred_locations,
        work_mode_preference, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.headline || null,
        data.bio || null,
        data.location || null,
        data.college || null,
        data.degree || null,
        data.branch || null,
        data.current_semester || data.currentSemester || null,
        data.graduation_year || data.graduationYear || null,
        data.cgpa !== undefined ? Number(data.cgpa) : null,
        data.achievements ? (typeof data.achievements === 'string' ? data.achievements : JSON.stringify(data.achievements)) : null,
        data.github_url || data.githubUrl || null,
        data.linkedin_url || data.linkedinUrl || null,
        data.portfolio_url || data.portfolioUrl || null,
        data.preferred_role || data.preferredRole || null,
        data.preferred_roles ? (typeof data.preferred_roles === 'string' ? data.preferred_roles : JSON.stringify(data.preferred_roles)) : null,
        data.preferred_location || data.preferredLocation || null,
        data.preferred_locations ? (typeof data.preferred_locations === 'string' ? data.preferred_locations : JSON.stringify(data.preferred_locations)) : null,
        data.work_mode_preference || data.workModePreference || 'any',
        data.is_public !== undefined ? (data.is_public ? 1 : 0) : 1
      ]
    );
    return this.findById(res.lastID);
  }

  async updateProfile(profileId, data) {
    const achievementsVal = data.achievements !== undefined
      ? (typeof data.achievements === 'string' ? data.achievements : JSON.stringify(data.achievements))
      : null;
    const prefRolesVal = data.preferred_roles !== undefined || data.preferredRoles !== undefined
      ? (typeof (data.preferred_roles || data.preferredRoles) === 'string' ? (data.preferred_roles || data.preferredRoles) : JSON.stringify(data.preferred_roles || data.preferredRoles))
      : null;
    const prefLocsVal = data.preferred_locations !== undefined || data.preferredLocations !== undefined
      ? (typeof (data.preferred_locations || data.preferredLocations) === 'string' ? (data.preferred_locations || data.preferredLocations) : JSON.stringify(data.preferred_locations || data.preferredLocations))
      : null;

    await db.run(
      `UPDATE student_profiles SET
        headline = COALESCE(?, headline),
        bio = COALESCE(?, bio),
        location = COALESCE(?, location),
        college = COALESCE(?, college),
        degree = COALESCE(?, degree),
        branch = COALESCE(?, branch),
        current_semester = COALESCE(?, current_semester),
        graduation_year = COALESCE(?, graduation_year),
        cgpa = COALESCE(?, cgpa),
        achievements = COALESCE(?, achievements),
        github_url = COALESCE(?, github_url),
        linkedin_url = COALESCE(?, linkedin_url),
        portfolio_url = COALESCE(?, portfolio_url),
        preferred_role = COALESCE(?, preferred_role),
        preferred_roles = COALESCE(?, preferred_roles),
        preferred_location = COALESCE(?, preferred_location),
        preferred_locations = COALESCE(?, preferred_locations),
        work_mode_preference = COALESCE(?, work_mode_preference),
        is_public = COALESCE(?, is_public),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.headline !== undefined ? data.headline : null,
        data.bio !== undefined ? data.bio : null,
        data.location !== undefined ? data.location : null,
        data.college !== undefined ? data.college : null,
        data.degree !== undefined ? data.degree : null,
        data.branch !== undefined ? data.branch : null,
        (data.current_semester !== undefined || data.currentSemester !== undefined) ? (data.current_semester || data.currentSemester) : null,
        (data.graduation_year !== undefined || data.graduationYear !== undefined) ? (data.graduation_year || data.graduationYear) : null,
        data.cgpa !== undefined ? Number(data.cgpa) : null,
        achievementsVal,
        (data.github_url !== undefined || data.githubUrl !== undefined) ? (data.github_url || data.githubUrl) : null,
        (data.linkedin_url !== undefined || data.linkedinUrl !== undefined) ? (data.linkedin_url || data.linkedinUrl) : null,
        (data.portfolio_url !== undefined || data.portfolioUrl !== undefined) ? (data.portfolio_url || data.portfolioUrl) : null,
        (data.preferred_role !== undefined || data.preferredRole !== undefined) ? (data.preferred_role || data.preferredRole) : null,
        prefRolesVal,
        (data.preferred_location !== undefined || data.preferredLocation !== undefined) ? (data.preferred_location || data.preferredLocation) : null,
        prefLocsVal,
        (data.work_mode_preference !== undefined || data.workModePreference !== undefined) ? (data.work_mode_preference || data.workModePreference) : null,
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

  // Resumes
  async getResumes(studentId) {
    return db.all('SELECT * FROM resumes WHERE student_id = ? ORDER BY is_primary DESC, created_at DESC', [studentId]);
  }

  async addResume(studentId, resumeData) {
    const isPrimary = resumeData.is_primary || resumeData.isPrimary ? 1 : 0;
    if (isPrimary) {
      await db.run('UPDATE resumes SET is_primary = 0 WHERE student_id = ?', [studentId]);
    }
    const res = await db.run(
      `INSERT INTO resumes (student_id, file_name, file_path, mime_type, file_size, raw_text, version_label, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        resumeData.file_name || resumeData.fileName,
        resumeData.file_path || resumeData.filePath || '',
        resumeData.mime_type || resumeData.mimeType || 'application/pdf',
        resumeData.file_size || resumeData.fileSize || 0,
        resumeData.raw_text || resumeData.rawText || null,
        resumeData.version_label || resumeData.versionLabel || 'v1',
        isPrimary
      ]
    );
    return db.get('SELECT * FROM resumes WHERE id = ?', [res.lastID]);
  }

  async deleteResume(studentId, resumeId) {
    const target = await db.get('SELECT * FROM resumes WHERE id = ? AND student_id = ?', [resumeId, studentId]);
    if (!target) return { changes: 0 };
    const res = await db.run('DELETE FROM resumes WHERE id = ? AND student_id = ?', [resumeId, studentId]);
    // If deleted resume was primary, set the latest remaining as primary
    if (target.is_primary) {
      const remaining = await db.get('SELECT id FROM resumes WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [studentId]);
      if (remaining) {
        await db.run('UPDATE resumes SET is_primary = 1 WHERE id = ?', [remaining.id]);
      }
    }
    return res;
  }

  async setDefaultResume(studentId, resumeId) {
    await db.run('UPDATE resumes SET is_primary = 0 WHERE student_id = ?', [studentId]);
    return db.run('UPDATE resumes SET is_primary = 1 WHERE id = ? AND student_id = ?', [resumeId, studentId]);
  }

  // Student Goals
  async getGoals(studentId) {
    return db.all('SELECT * FROM student_goals WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
  }

  async addGoal(studentId, goal) {
    const res = await db.run(
      `INSERT INTO student_goals (student_id, title, description, category, target_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        goal.title,
        goal.description || null,
        goal.category || 'skill',
        goal.target_date || goal.targetDate || null,
        goal.status || 'in_progress'
      ]
    );
    return db.get('SELECT * FROM student_goals WHERE id = ?', [res.lastID]);
  }

  async updateGoal(studentId, goalId, data) {
    await db.run(
      `UPDATE student_goals SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        target_date = COALESCE(?, target_date),
        status = COALESCE(?, status),
        completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND student_id = ?`,
      [
        data.title !== undefined ? data.title : null,
        data.description !== undefined ? data.description : null,
        data.category !== undefined ? data.category : null,
        (data.target_date !== undefined || data.targetDate !== undefined) ? (data.target_date || data.targetDate) : null,
        data.status !== undefined ? data.status : null,
        data.status !== undefined ? data.status : null,
        goalId,
        studentId
      ]
    );
    return db.get('SELECT * FROM student_goals WHERE id = ? AND student_id = ?', [goalId, studentId]);
  }

  async deleteGoal(studentId, goalId) {
    return db.run('DELETE FROM student_goals WHERE id = ? AND student_id = ?', [goalId, studentId]);
  }

  calculateProfileCompleteness(profile) {
    const checklist = [];

    // 1. Academic & Core Details (25%)
    const hasAcademic = Boolean(
      profile.college && profile.degree && profile.branch && profile.cgpa !== null && profile.cgpa !== undefined
    );
    checklist.push({
      key: 'academics',
      label: 'Academic Details (College, Degree, Branch, CGPA)',
      completed: hasAcademic,
      weight: 25
    });

    // 2. Skills Inventory (20%)
    const skillCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
    const hasSkills = skillCount >= 3;
    checklist.push({
      key: 'skills',
      label: `Skills Inventory (At least 3 skills, currently ${skillCount})`,
      completed: hasSkills,
      weight: 20
    });

    // 3. Projects Showcase (20%)
    const projCount = Array.isArray(profile.projects) ? profile.projects.length : 0;
    const hasProjects = projCount >= 1;
    checklist.push({
      key: 'projects',
      label: `Projects Showcase (At least 1 project, currently ${projCount})`,
      completed: hasProjects,
      weight: 20
    });

    // 4. Experience or Education History (15%)
    const hasEduHistory = Array.isArray(profile.education) && profile.education.length > 0;
    const hasExp = Array.isArray(profile.experience) && profile.experience.length > 0;
    const hasHistory = hasEduHistory || hasExp;
    checklist.push({
      key: 'history',
      label: 'Experience or Formal Education History',
      completed: hasHistory,
      weight: 15
    });

    // 5. Resume Upload (10%)
    const hasResume = Boolean(
      (Array.isArray(profile.resumes) && profile.resumes.length > 0) || profile.resume_id
    );
    checklist.push({
      key: 'resume',
      label: 'Resume Uploaded (PDF or DOCX version)',
      completed: hasResume,
      weight: 10
    });

    // 6. Social Profiles & Career Preferences (10%)
    const hasSocial = Boolean(profile.github_url || profile.linkedin_url || profile.portfolio_url);
    const hasPreferences = Boolean(profile.preferred_role || profile.preferred_roles);
    const hasSocialAndPref = hasSocial && hasPreferences;
    checklist.push({
      key: 'social_preferences',
      label: 'Social Profiles & Career Preferences',
      completed: hasSocialAndPref,
      weight: 10
    });

    const score = checklist.reduce((acc, item) => (item.completed ? acc + item.weight : acc), 0);
    const missing = checklist.filter((item) => !item.completed).map((item) => item.label);

    return {
      percentage: Math.min(100, Math.round(score)),
      checklist,
      missing
    };
  }

  async getFullProfile(studentId) {
    const profile = await this.findById(studentId);
    if (!profile) return null;

    const [education, experience, projects, skills, certifications, resumes, goals] = await Promise.all([
      this.getEducation(studentId),
      this.getExperience(studentId),
      this.getProjects(studentId),
      this.getSkills(studentId),
      this.getCertifications(studentId),
      this.getResumes(studentId),
      this.getGoals(studentId)
    ]);

    const assembled = {
      ...profile,
      education,
      experience,
      projects,
      skills,
      certifications,
      resumes,
      goals
    };

    const completenessData = this.calculateProfileCompleteness(assembled);
    assembled.profile_completeness = completenessData.percentage;
    assembled.completeness_report = completenessData;

    return assembled;
  }
}

module.exports = new StudentRepository();
