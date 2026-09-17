'use strict';

const { app } = require('../backend/app/server');
const db = require('../backend/app/core/database/connection');
const { runMigrations } = require('../database/migrations/migrate');
const { seedDatabase } = require('../database/seeds/seed');

let initPromise = null;

async function ensureDbReady() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      // 1. Ensure SQLite database is migrated
      const usersTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      if (!usersTable) {
        console.log('🔄 Initializing SQLite database schema on Vercel serverless cold start...');
        await runMigrations(db.DB_PATH);
      }

      // 2. Ensure initial dataset (40+ opportunities + demo student Alex Chen) is seeded
      const oppCount = await db.get('SELECT COUNT(*) as count FROM opportunities');
      if (!oppCount || oppCount.count === 0) {
        console.log('🌱 Seeding 40+ realistic opportunities & demo student profile on cold start...');
        await seedDatabase(db.DB_PATH);
      }
    } catch (err) {
      console.warn('⚠️ Serverless DB initialization notice:', err.message);
    }
  })();
  return initPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureDbReady();
    return app(req, res);
  } catch (err) {
    console.error('❌ Vercel Serverless Invocation Exception:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.end(
        JSON.stringify({
          success: false,
          error: 'SERVERLESS_INVOCATION_ERROR',
          message: err.message || 'Internal serverless handler exception',
          details: process.env.NODE_ENV === 'production' ? undefined : err.stack
        })
      );
    }
  }
};

