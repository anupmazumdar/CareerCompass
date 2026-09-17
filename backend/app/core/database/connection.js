'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);

// In serverless (e.g. Vercel / AWS Lambda), the filesystem is read-only except /tmp
let effectiveDbPath = config.database.dbPath;
if (isServerless && !process.env.DB_PATH) {
  effectiveDbPath = path.join(os.tmpdir(), 'talentai.db');
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

  dbInstance = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Failed to connect to SQLite database:', err.message);
    }
  });

  dbInstance.run('PRAGMA foreign_keys = ON;', () => {});
  dbInstance.run('PRAGMA journal_mode = WAL;', () => {});

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
