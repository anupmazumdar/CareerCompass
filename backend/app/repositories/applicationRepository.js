'use strict';

const db = require('../core/database/connection');

class ApplicationRepository {
  async findById(applicationId) {
    return db.get(
      `SELECT a.*, j.title as job_title, j.location as job_location, c.name as company_name,
              sp.headline as candidate_headline, u.full_name as candidate_name, u.email as candidate_email, u.phone as candidate_phone
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       WHERE a.id = ?`,
      [applicationId]
    );
  }

  async findByStudentAndJob(studentId, jobId) {
    return db.get('SELECT * FROM applications WHERE student_id = ? AND job_id = ?', [studentId, jobId]);
  }

  async create({ jobId, studentId, resumeId = null, coverNote = null, matchScore = null }) {
    const res = await db.run(
      `INSERT INTO applications (job_id, student_id, resume_id, status, match_score, cover_note)
       VALUES (?, ?, ?, 'applied', ?, ?)`,
      [jobId, studentId, resumeId, matchScore, coverNote]
    );

    const applicationId = res.lastID;

    // Record initial status history
    const student = await db.get('SELECT user_id FROM student_profiles WHERE id = ?', [studentId]);
    await this.recordStatusHistory({
      applicationId,
      changedByUserId: student.user_id,
      previousStatus: 'none',
      newStatus: 'applied',
      notes: 'Initial application submitted by candidate'
    });

    return this.findById(applicationId);
  }

  async findByStudent(studentId) {
    return db.all(
      `SELECT a.*, j.title as job_title, j.location as job_location, j.employment_type,
              c.name as company_name, c.logo_url as company_logo
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.applied_at DESC`,
      [studentId]
    );
  }

  async findByJob(jobId) {
    return db.all(
      `SELECT a.*, sp.headline as candidate_headline, sp.location as candidate_location,
              u.full_name as candidate_name, u.email as candidate_email,
              ms.final_score, ms.matched_skills, ms.missing_skills, ms.explanation
       FROM applications a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN match_scores ms ON a.id = ms.application_id
       WHERE a.job_id = ?
       ORDER BY COALESCE(ms.final_score, a.match_score, 0) DESC, a.applied_at DESC`,
      [jobId]
    );
  }

  async updateStatus(applicationId, newStatus, changedByUserId, notes = null) {
    const existing = await this.findById(applicationId);
    if (!existing) return null;

    const prevStatus = existing.status;
    await db.run('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, applicationId]);

    // Record status history
    await this.recordStatusHistory({
      applicationId,
      changedByUserId,
      previousStatus: prevStatus,
      newStatus,
      notes
    });

    return this.findById(applicationId);
  }

  async recordStatusHistory({ applicationId, changedByUserId, previousStatus, newStatus, notes }) {
    return db.run(
      `INSERT INTO application_status_history (application_id, changed_by_user_id, previous_status, new_status, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [applicationId, changedByUserId, previousStatus, newStatus, notes]
    );
  }

  async getStatusHistory(applicationId) {
    return db.all(
      `SELECT ash.*, u.full_name as changed_by_name, u.role as changed_by_role
       FROM application_status_history ash
       JOIN users u ON ash.changed_by_user_id = u.id
       WHERE ash.application_id = ?
       ORDER BY ash.created_at ASC`,
      [applicationId]
    );
  }
}

module.exports = new ApplicationRepository();
