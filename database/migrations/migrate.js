'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR = process.env.DB_DIR || path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'talentai.db');

function runMigrations() {
  console.log(`🔄 Applying migrations to: ${DB_PATH}`);
  const schemaPath = path.resolve(__dirname, '../schema/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err);
    });

    db.exec(schemaSql, (err) => {
      if (err) {
        db.close();
        return reject(err);
      }
      console.log('✅ Schema migration completed successfully.');
      db.close(resolve);
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
