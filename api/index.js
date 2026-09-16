'use strict';

const { app } = require('../backend/app/server');
const db = require('../backend/app/core/database/connection');
const { runMigrations } = require('../database/migrations/migrate');
const { seed } = require('../database/seeds/seed_career_compass_30');

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

      // 2. Ensure initial dataset (30 opportunities + demo student Alex Chen) is seeded
      const oppCount = await db.get('SELECT COUNT(*) as count FROM opportunities');
      if (!oppCount || oppCount.count === 0) {
        console.log('🌱 Seeding 30 realistic opportunities & demo student profile on cold start...');
        await seed();
      }
    } catch (err) {
      console.warn('⚠️ Serverless DB initialization notice:', err.message);
    }
  })();
  return initPromise;
}

module.exports = async (req, res) => {
  await ensureDbReady();
  return app(req, res);
};
