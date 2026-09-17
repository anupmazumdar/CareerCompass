'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  try {
    sqlite3 = require(path.resolve(__dirname, '../../backend/node_modules/sqlite3')).verbose();
  } catch (backendErr) {
    sqlite3 = require(path.resolve(__dirname, '../node_modules/sqlite3')).verbose();
  }
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);
const DATA_DIR = process.env.DB_DIR || (isServerless ? os.tmpdir() : path.resolve(__dirname, '../../data'));
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    // Read-only filesystem in serverless
  }
}

let DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'talentai.db');
if (isServerless) {
  if (!process.env.DB_PATH || !process.env.DB_PATH.startsWith(os.tmpdir())) {
    DB_PATH = path.join(os.tmpdir(), 'talentai.db');
  }
}


function getTableColumns(db, table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) return reject(err);
      resolve((rows || []).map(r => r.name));
    });
  });
}

function addColumnIfNotExists(db, table, columnDef, columnName) {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await getTableColumns(db, table);
      if (!existing.includes(columnName)) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            return reject(err);
          }
          console.log(`  ➕ Added column ${columnName} to ${table}`);
          resolve();
        });
      } else {
        resolve();
      }
    } catch (e) {
      resolve(); // ignore if table does not exist yet
    }
  });
}

async function applyIncrementalMigrations(db) {
  // student_profiles extensions
  await addColumnIfNotExists(db, 'student_profiles', 'college TEXT', 'college');
  await addColumnIfNotExists(db, 'student_profiles', 'degree TEXT', 'degree');
  await addColumnIfNotExists(db, 'student_profiles', 'branch TEXT', 'branch');
  await addColumnIfNotExists(db, 'student_profiles', 'current_semester INTEGER', 'current_semester');
  await addColumnIfNotExists(db, 'student_profiles', 'graduation_year INTEGER', 'graduation_year');
  await addColumnIfNotExists(db, 'student_profiles', 'cgpa REAL', 'cgpa');
  await addColumnIfNotExists(db, 'student_profiles', 'achievements TEXT', 'achievements');
  await addColumnIfNotExists(db, 'student_profiles', 'preferred_roles TEXT', 'preferred_roles');
  await addColumnIfNotExists(db, 'student_profiles', 'preferred_locations TEXT', 'preferred_locations');
  await addColumnIfNotExists(db, 'student_profiles', "work_mode_preference TEXT DEFAULT 'any'", 'work_mode_preference');

  // opportunities extensions
  await addColumnIfNotExists(db, 'opportunities', "type TEXT DEFAULT 'Job'", 'type');
  await addColumnIfNotExists(db, 'opportunities', "work_mode TEXT DEFAULT 'onsite'", 'work_mode');
  await addColumnIfNotExists(db, 'opportunities', 'min_cgpa REAL DEFAULT 0.0', 'min_cgpa');
  await addColumnIfNotExists(db, 'opportunities', "eligible_branches TEXT DEFAULT '[\"All\"]'", 'eligible_branches');
  await addColumnIfNotExists(db, 'opportunities', "eligible_grad_years TEXT DEFAULT '[\"All\"]'", 'eligible_grad_years');
  await addColumnIfNotExists(db, 'opportunities', 'stipend_range TEXT', 'stipend_range');
  await addColumnIfNotExists(db, 'opportunities', 'apply_link TEXT', 'apply_link');

  // resumes extensions
  await addColumnIfNotExists(db, 'resumes', "version_label TEXT DEFAULT 'v1'", 'version_label');

  // applications extensions
  await addColumnIfNotExists(db, 'applications', 'resume_version_used TEXT', 'resume_version_used');
  await addColumnIfNotExists(db, 'applications', 'reminder_date DATETIME', 'reminder_date');

  // Token persistence tables for serverless auth support
  await new Promise((resolve, reject) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
    `, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  // Ensure applications table CHECK constraint includes 'offer'
  await new Promise((resolve, reject) => {
    db.get('SELECT sql FROM sqlite_master WHERE name = "applications"', (err, row) => {
      if (err) return reject(err);
      if (row && row.sql && !row.sql.includes("'offer'")) {
        console.log('  🔄 Upgrading applications table CHECK constraint to include "offer"...');
        db.exec(`
          BEGIN TRANSACTION;
          CREATE TABLE applications_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
            job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
            student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
            resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
            resume_version_used TEXT,
            status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn', 'under_review', 'shortlisted', 'selected')),
            match_score REAL DEFAULT 0,
            cover_note TEXT,
            notes TEXT,
            reminder_date DATETIME,
            pipeline_stage TEXT DEFAULT 'profile',
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(job_id, student_id)
          );
          INSERT INTO applications_new (
            id, opportunity_id, job_id, student_id, resume_id, resume_version_used,
            status, match_score, cover_note, notes, reminder_date, pipeline_stage, applied_at, applied_date, updated_at
          )
          SELECT
            id, opportunity_id, job_id, student_id, resume_id, resume_version_used,
            status, match_score, cover_note, notes, reminder_date, pipeline_stage, applied_at, applied_date, updated_at
          FROM applications;
          DROP TABLE applications;
          ALTER TABLE applications_new RENAME TO applications;
          CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
          CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);
          CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
          CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
          COMMIT;
        `, (upgradeErr) => {
          if (upgradeErr) return reject(upgradeErr);
          console.log('  ✅ applications table CHECK constraint upgraded with offer status.');
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function runMigrations(targetPath = DB_PATH) {
  console.log(`🔄 Applying migrations to: ${targetPath}`);
  const candidatePaths = [
    path.join(__dirname, '../schema/schema.sql'),
    path.resolve(__dirname, '../../database/schema/schema.sql'),
    path.resolve(process.cwd(), 'database/schema/schema.sql')
  ];
  let schemaSql = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        schemaSql = fs.readFileSync(p, 'utf8');
        break;
      } catch (e) {}
    }
  }
  if (!schemaSql) {
    throw new Error('Could not locate database/schema/schema.sql in any candidate path.');
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(targetPath, async (err) => {
      if (err) return reject(err);

      db.exec(schemaSql, async (execErr) => {
        if (execErr) {
          db.close();
          return reject(execErr);
        }

        try {
          await applyIncrementalMigrations(db);
          console.log('✅ Schema migration and incremental columns completed successfully.');
          db.close(resolve);
        } catch (migErr) {
          db.close();
          reject(migErr);
        }
      });
    });
  });
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
