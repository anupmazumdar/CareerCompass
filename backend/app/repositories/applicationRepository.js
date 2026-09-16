'use strict';

const db = require('../core/database/connection');

class ApplicationRepository {
  async findById(applicationId) {
    return db.get(
      `SELECT a.*,
              COALESCE(o.title, j.title, 'General Opportunity') as job_title,
              COALESCE(o.company, c.name, 'Tech Partner') as company_name,
              COALESCE(o.location, j.location, 'Remote / Flexible') as job_location,
              COALESCE(o.type, o.employment_type, j.employment_type, 'Full-time') as opportunity_type,
              COALESCE(o.work_mode, 'hybrid') as work_mode,
              COALESCE(o.min_salary, j.min_salary) as min_salary,
              COALESCE(o.max_salary, j.max_salary) as max_salary,
              COALESCE(o.deadline, j.deadline) as deadline,
              COALESCE(o.apply_link, '') as apply_link,
              c.logo_url as company_logo,
              sp.headline as candidate_headline, u.full_name as candidate_name, u.email as candidate_email, u.phone as candidate_phone,
              r.version_label as resume_version_label, r.file_name as resume_file_name
       FROM applications a
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN opportunities o ON a.opportunity_id = o.id
       LEFT JOIN companies c ON (j.company_id = c.id OR o.company_id = c.id)
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN resumes r ON a.resume_id = r.id
       WHERE a.id = ?`,
      [applicationId]
    );
  }

  async findByStudentAndJob(studentId, jobId) {
    return db.get('SELECT * FROM applications WHERE student_id = ? AND (job_id = ? OR opportunity_id = ?)', [studentId, jobId, jobId]);
  }

  async findByStudentAndOpportunity(studentId, oppId) {
    return db.get('SELECT * FROM applications WHERE student_id = ? AND (opportunity_id = ? OR job_id = ?)', [studentId, oppId, oppId]);
  }

  async create({
    opportunityId = null,
    jobId = null,
    studentId,
    resumeId = null,
    resumeVersionUsed = null,
    coverNote = null,
    notes = null,
    reminderDate = null,
    matchScore = null,
    status = 'applied'
  }) {
    // If resumeId is not provided, look up student's primary resume
    let resolvedResumeId = resumeId;
    let resolvedVersion = resumeVersionUsed;
    if (!resolvedResumeId) {
      const primaryResume = await db.get(
        'SELECT id, version_label FROM resumes WHERE student_id = ? ORDER BY is_primary DESC, created_at DESC LIMIT 1',
        [studentId]
      );
      if (primaryResume) {
        resolvedResumeId = primaryResume.id;
        resolvedVersion = resolvedVersion || primaryResume.version_label;
      }
    }

    const res = await db.run(
      `INSERT INTO applications (
        opportunity_id, job_id, student_id, resume_id, resume_version_used,
        status, match_score, cover_note, notes, reminder_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        opportunityId,
        jobId,
        studentId,
        resolvedResumeId,
        resolvedVersion,
        status,
        matchScore,
        coverNote,
        notes,
        reminderDate
      ]
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
      `SELECT a.*,
              COALESCE(o.title, j.title, 'Opportunity') as job_title,
              COALESCE(o.company, c.name, 'Tech Partner') as company_name,
              COALESCE(o.location, j.location, 'Remote / Flexible') as job_location,
              COALESCE(o.type, o.employment_type, j.employment_type, 'Full-time') as opportunity_type,
              COALESCE(o.work_mode, 'hybrid') as work_mode,
              COALESCE(o.min_salary, j.min_salary) as min_salary,
              COALESCE(o.max_salary, j.max_salary) as max_salary,
              COALESCE(o.deadline, j.deadline) as deadline,
              COALESCE(o.apply_link, '') as apply_link,
              c.logo_url as company_logo,
              r.version_label as resume_version_label,
              (SELECT COUNT(*) FROM application_notes an WHERE an.application_id = a.id) as notes_count
       FROM applications a
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN opportunities o ON a.opportunity_id = o.id
       LEFT JOIN companies c ON (j.company_id = c.id OR o.company_id = c.id)
       LEFT JOIN resumes r ON a.resume_id = r.id
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
       WHERE (a.job_id = ? OR a.opportunity_id = ?)
       ORDER BY COALESCE(ms.final_score, a.match_score, 0) DESC, a.applied_at DESC`,
      [jobId, jobId]
    );
  }

  async updateStatus(applicationId, newStatus, changedByUserId, notes = null, reminderDate = null) {
    const existing = await this.findById(applicationId);
    if (!existing) return null;

    const prevStatus = existing.status;
    await db.run(
      `UPDATE applications
       SET status = ?,
           notes = COALESCE(?, notes),
           reminder_date = COALESCE(?, reminder_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, notes, reminderDate, applicationId]
    );

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

  async updateApplication(applicationId, { status, notes, reminderDate, changedByUserId }) {
    const existing = await this.findById(applicationId);
    if (!existing) return null;

    const prevStatus = existing.status;
    const newStatus = status || prevStatus;

    await db.run(
      `UPDATE applications
       SET status = ?,
           notes = COALESCE(?, notes),
           reminder_date = CASE WHEN ? IS NOT NULL THEN ? ELSE reminder_date END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, notes, reminderDate, reminderDate, applicationId]
    );

    if (newStatus !== prevStatus || notes) {
      await this.recordStatusHistory({
        applicationId,
        changedByUserId,
        previousStatus: prevStatus,
        newStatus,
        notes: notes || `Application moved to ${newStatus}`
      });
    }

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
       LEFT JOIN users u ON ash.changed_by_user_id = u.id
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

  async getStats(studentId) {
    const rows = await db.all(
      `SELECT status, COUNT(*) as count
       FROM applications
       WHERE student_id = ?
       GROUP BY status`,
      [studentId]
    );

    const counts = {
      total: 0,
      saved: 0,
      applied: 0,
      under_review: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0
    };

    rows.forEach(r => {
      if (counts[r.status] !== undefined) {
        counts[r.status] = r.count;
      } else if (r.status === 'screening' || r.status === 'shortlisted') {
        counts.under_review += r.count;
      } else if (r.status === 'selected') {
        counts.offer += r.count;
      }
      counts.total += r.count;
    });

    const activeApplications = counts.applied + counts.under_review + counts.interview;
    const respondedApplications = counts.under_review + counts.interview + counts.offer + counts.rejected;
    const responseRate = counts.total > counts.saved
      ? Math.round((respondedApplications / (counts.total - counts.saved)) * 100)
      : 0;

    const upcomingReminders = await db.all(
      `SELECT a.id, a.reminder_date, a.notes,
              COALESCE(o.title, j.title, 'Role') as title,
              COALESCE(o.company, 'Company') as company
       FROM applications a
       LEFT JOIN opportunities o ON a.opportunity_id = o.id
       LEFT JOIN jobs j ON a.job_id = j.id
       WHERE a.student_id = ? AND a.reminder_date IS NOT NULL AND a.reminder_date >= date('now')
       ORDER BY a.reminder_date ASC LIMIT 5`,
      [studentId]
    );

    return {
      ...counts,
      active: activeApplications,
      response_rate: responseRate,
      upcoming_reminders: upcomingReminders
    };
  }
}

module.exports = new ApplicationRepository();
