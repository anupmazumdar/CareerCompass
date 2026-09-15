'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR = process.env.DB_DIR || path.resolve(__dirname, '../../data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'talentai.db');

async function migratePipeline() {
  console.log(`🔄 Applying CareerPath Pipeline migration to: ${DB_PATH}`);

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err);
    });

    db.serialize(() => {
      // 1. Check if application_notes table exists
      db.run(`
        CREATE TABLE IF NOT EXISTS application_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
          note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'interview_prep', 'follow_up', 'offer_details')),
          content TEXT NOT NULL,
          reminder_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating application_notes:', err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_app_notes_application ON application_notes(application_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_app_notes_student ON application_notes(student_id)`);

      // 2. Expand status constraint on applications table
      // SQLite requires table recreation to alter CHECK constraints safely
      db.get('SELECT sql FROM sqlite_master WHERE name = "applications"', (err, row) => {
        if (err) return reject(err);

        // If the table already allows 'saved' and 'withdrawn', we don't need to rebuild
        if (row && row.sql && row.sql.includes("'saved'") && row.sql.includes("'withdrawn'")) {
          console.log('✅ applications table already supports saved/withdrawn statuses.');
          db.close(resolve);
          return;
        }

        console.log('🔄 Rebuilding applications table with full CareerPath status set...');
        db.exec(`
          BEGIN TRANSACTION;

          CREATE TABLE applications_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
            student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
            resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
            status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('saved', 'applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn')),
            match_score REAL,
            cover_note TEXT,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(job_id, student_id)
          );

          INSERT INTO applications_new (id, job_id, student_id, resume_id, status, match_score, cover_note, applied_at, updated_at)
          SELECT id, job_id, student_id, resume_id, status, match_score, cover_note, applied_at, updated_at
          FROM applications;

          DROP TABLE applications;

          ALTER TABLE applications_new RENAME TO applications;

          CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
          CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
          CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

          COMMIT;
        `, (execErr) => {
          if (execErr) {
            console.error('❌ Migration failed during table rebuild:', execErr);
            db.close(() => reject(execErr));
            return;
          }
          console.log('✅ applications table upgraded successfully.');
          db.close(resolve);
        });
      });
    });
  });
}

if (require.main === module) {
  migratePipeline()
    .then(() => {
      console.log('✅ Migration finished cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migratePipeline };
