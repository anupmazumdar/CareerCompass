'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e1) {
  try {
    sqlite3 = require(path.resolve(__dirname, '../../../../backend/node_modules/sqlite3')).verbose();
  } catch (e2) {
    try {
      sqlite3 = require(path.resolve(__dirname, '../../../../node_modules/sqlite3')).verbose();
    } catch (e3) {
      console.warn('⚠️ Warning: sqlite3 driver could not be loaded:', e3.message);
    }
  }
}
const config = require('../config');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);

// In serverless (e.g. Vercel / AWS Lambda), the filesystem is read-only except /tmp
let effectiveDbPath = config.database.dbPath;
if (isServerless) {
  // In serverless, always enforce a writable location in os.tmpdir() regardless of DB_PATH env var
  if (!process.env.DB_PATH || !process.env.DB_PATH.startsWith(os.tmpdir())) {
    effectiveDbPath = path.join(os.tmpdir(), 'talentai.db');
  }
}

const DB_PATH = effectiveDbPath;
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    console.warn(`⚠️ Warning: could not create dbDir ${dbDir}:`, err.message);
  }
}

let dbInstance = null;

function getDatabase(dbPath = DB_PATH) {
  if (dbInstance) return dbInstance;
  if (!sqlite3) {
    throw new Error('SQLite database driver (sqlite3) is not available in this environment.');
  }

  dbInstance = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Failed to connect to SQLite database:', err.message);
    }
  });

  dbInstance.run('PRAGMA foreign_keys = ON;', () => {});
  // WAL mode requires shared-memory mmap which is unsupported in serverless /tmp
  if (!isServerless) {
    dbInstance.run('PRAGMA journal_mode = WAL;', () => {});
  } else {
    dbInstance.run('PRAGMA journal_mode = MEMORY;', () => {});
  }

  return dbInstance;
}

function run(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function exec(sql) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function close() {
  if (!dbInstance) return Promise.resolve();
  return new Promise((resolve, reject) => {
    dbInstance.close((err) => {
      if (err) return reject(err);
      dbInstance = null;
      resolve();
    });
  });
}

module.exports = {
  getDatabase,
  run,
  get,
  all,
  exec,
  close,
  DB_PATH
};
