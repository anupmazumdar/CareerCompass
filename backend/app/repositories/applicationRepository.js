'use strict';

const db = require('../core/database/connection');

class ApplicationRepository {
  async findById(applicationId) {
    return db.get(
      `SELECT a.*, j.title as job_title, j.location as job_location, j.employment_type,
              'hybrid' as work_type, j.min_salary, j.max_salary, j.deadline,
              c.name as company_name, c.logo_url as company_logo,
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

  async create({ jobId, studentId, resumeId = null, coverNote = null, matchScore = null, status = 'applied' }) {
    const res = await db.run(
      `INSERT INTO applications (job_id, student_id, resume_id, status, match_score, cover_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [jobId, studentId, resumeId, status, matchScore, coverNote]
    );

    const applicationId = res.lastID;

    // Record initial status history
    const student = await db.get('SELECT user_id FROM student_profiles WHERE id = ?', [studentId]);
    await this.recordStatusHistory({
      applicationId,
      changedByUserId: student ? student.user_id : null,
      previousStatus: 'none',
      newStatus: status,
      notes: status === 'saved' ? 'Saved opportunity to candidate pipeline' : 'Initial application submitted by candidate'
    });

    return this.findById(applicationId);
  }

  async promoteSavedToApplied({ applicationId, resumeId = null, coverNote = null, matchScore = null, changedByUserId }) {
    await db.run(
      `UPDATE applications
       SET status = 'applied',
           resume_id = COALESCE(?, resume_id),
           cover_note = COALESCE(?, cover_note),
           match_score = COALESCE(?, match_score),
           applied_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [resumeId, coverNote, matchScore, applicationId]
    );

    await this.recordStatusHistory({
      applicationId,
      changedByUserId,
      previousStatus: 'saved',
      newStatus: 'applied',
      notes: 'Candidate submitted full application from saved wishlist'
    });

    return this.findById(applicationId);
  }

  async findByStudent(studentId) {
    return db.all(
      `SELECT a.*, j.title as job_title, j.location as job_location, j.employment_type,
              'hybrid' as work_type, j.min_salary, j.max_salary, j.deadline,
              c.name as company_name, c.logo_url as company_logo,
              (SELECT COUNT(*) FROM application_notes an WHERE an.application_id = a.id) as notes_count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.updated_at DESC, a.applied_at DESC`,
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

  async addNote({ applicationId, studentId, noteType = 'general', content, reminderDate = null }) {
    const res = await db.run(
      `INSERT INTO application_notes (application_id, student_id, note_type, content, reminder_date)
       VALUES (?, ?, ?, ?, ?)`,
      [applicationId, studentId, noteType, content, reminderDate]
    );
    return db.get('SELECT * FROM application_notes WHERE id = ?', [res.lastID]);
  }

  async getNotes(applicationId) {
    return db.all(
      `SELECT * FROM application_notes WHERE application_id = ? ORDER BY created_at DESC`,
      [applicationId]
    );
  }

  async deleteNote(noteId, studentId) {
    return db.run(
      `DELETE FROM application_notes WHERE id = ? AND student_id = ?`,
      [noteId, studentId]
    );
  }

  async deleteSavedApplication(applicationId, studentId) {
    return db.run(
      `DELETE FROM applications WHERE id = ? AND student_id = ? AND status = 'saved'`,
      [applicationId, studentId]
    );
  }
}

module.exports = new ApplicationRepository();
