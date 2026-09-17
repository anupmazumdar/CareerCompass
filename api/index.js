'use strict';

let app = null;
let db = null;
let runMigrations = null;
let seedDatabase = null;
let bootError = null;

try {
  const serverModule = require('../backend/app/server');
  app = serverModule.app;
  db = require('../backend/app/core/database/connection');
  const migModule = require('../database/migrations/migrate');
  runMigrations = migModule.runMigrations;
  const seedModule = require('../database/seeds/seed');
  seedDatabase = seedModule.seedDatabase;
} catch (err) {
  bootError = err;
  console.error('❌ Serverless Boot Error:', err);
}

let initPromise = null;

async function ensureDbReady() {
  if (initPromise) return initPromise;
  if (!db || !runMigrations || !seedDatabase) {
    console.warn('⚠️ DB utilities unavailable for auto-migration.');
    return;
  }

  initPromise = (async () => {
    try {
      const usersTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      if (!usersTable) {
        console.log('🔄 Initializing SQLite database schema on Vercel serverless cold start...');
        await runMigrations(db.DB_PATH);
      }

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
  // If top-level module load failed, return structured JSON error rather than raw lambda crash
  if (bootError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.end(
      JSON.stringify({
        success: false,
        error: 'SERVERLESS_COLD_START_MODULE_LOAD_FAILURE',
        message: bootError.message,
        stack: bootError.stack,
        code: bootError.code
      })
    );
  }

  // Bypass DB readiness on health checks so health always responds immediately
  const isHealthCheck = req.url && req.url.includes('/health');
  if (!isHealthCheck) {
    try {
      await ensureDbReady();
    } catch (dbErr) {
      console.warn('⚠️ DB readiness warning:', dbErr.message);
    }
  }

  // Wrap Express dispatch in a Promise tied to the response stream.
  // This prevents Vercel serverless runtime from prematurely terminating before
  // Express finishes sending the response.
  return new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', (err) => {
      console.error('Response stream error:', err);
      resolve();
    });

    app(req, res, (err) => {
      if (err && !res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.end(
          JSON.stringify({
            success: false,
            error: 'EXPRESS_UNHANDLED_ERROR',
            message: err.message || 'Unhandled server error'
          })
        );
      }
      resolve();
    });
  });
};
