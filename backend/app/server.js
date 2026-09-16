'use strict';

const path = require('path');
const express = require('express');
const config = require('./core/config');
const db = require('./core/database/connection');
const {
  helmetMiddleware,
  corsMiddleware,
  globalRateLimiter,
  authRateLimiter,
  adminRateLimiter,
  sanitizeMiddleware
} = require('./core/security/security');
const cookieParser = require('cookie-parser');
const { logger, morganMiddleware } = require('./core/logging/logger');
const { notFoundHandler, globalErrorHandler } = require('./core/exceptions/errorHandler');

// Domain Routers
const authRoutes = require('./api/auth/routes');
const studentRoutes = require('./api/students/routes');
const recruiterRoutes = require('./api/recruiters/routes');
const companyRoutes = require('./api/companies/routes');
const jobRoutes = require('./api/jobs/routes');
const applicationRoutes = require('./api/applications/routes');
const skillRoutes = require('./api/skills/routes');
const matchingRoutes = require('./api/matching/routes');
const recommendationRoutes = require('./api/recommendations/routes');
const resumeRoutes = require('./api/resumes/routes');
const opportunityRoutes = require('./api/opportunities/routes');
const aiRoutes = require('./api/ai/routes');
const adminRoutes = require('./api/admin/routes');

const app = express();

// 1. Security & Core Middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '2.0-unified');
  next();
});
app.use(morganMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize middleware (XSS, HPP, NoSQL)
sanitizeMiddleware.forEach((m) => app.use(m));

// Rate limiters
app.use(globalRateLimiter);
app.use('/api/auth', authRateLimiter);
app.use('/api/admin', adminRateLimiter);

// 2. Health & Diagnostic Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Unified TalentAI Career Platform',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// 3. Mount Domain API Routers
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// 4. Legacy Route Aliases for Compatibility
// Legacy candidate applications alias
app.get('/api/candidates', async (req, res, next) => {
  try {
    const candidates = await db.all(
      `SELECT sp.id, sp.headline as position, u.full_name as name, u.email,
              (SELECT COUNT(*) FROM applications WHERE student_id = sp.id) as totalScore,
              'review' as status
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id`
    );
    return res.json({ success: true, candidates });
  } catch (err) {
    next(err);
  }
});

// Legacy quiz questions alias
app.get('/api/admin/questions', async (req, res, next) => {
  try {
    const questions = await db.all('SELECT * FROM quiz_questions ORDER BY id ASC');
    return res.json({
      success: true,
      questions: questions.map(q => ({ ...q, options: JSON.parse(q.options || '[]') }))
    });
  } catch (err) {
    next(err);
  }
});

// 5. Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// 6. Server Initialization
async function ensureAdminUser() {
  try {
    // Purge publicly known default or legacy personal admin emails
    await db.run('DELETE FROM users WHERE email IN (?, ?, ?)', ['admin@talentai.me', 'admin@talentai.edu', 'anupmazumdar987@gmail.com']);

    const email = (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
    const password = process.env.SUPERADMIN_PASSWORD || '';
    if (!email || !password || ['admin@talentai.me', 'admin@talentai.edu', 'anupmazumdar987@gmail.com'].includes(email)) {
      logger.info('🔒 Default/public admin credentials blocked from seeding. Superadmin must be configured with private credentials.');
      return;
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
    const { hashPassword } = require('./core/authentication/auth');
    const hash = await hashPassword(password);

    if (!existing) {
      await db.run(
        `INSERT INTO users (email, password_hash, role, full_name, status) VALUES (?, ?, 'admin', ?, 'active')`,
        [email, hash, process.env.SUPERADMIN_NAME || 'TalentAI Admin']
      );
      logger.info(`🔐 Seeded initial admin account: ${email}`);
    } else {
      await db.run('UPDATE users SET password_hash = ?, role = "admin" WHERE id = ?', [hash, existing.id]);
      logger.info(`🔐 Updated admin account credentials: ${email}`);
    }
  } catch (err) {
    logger.warn(`⚠️ ensureAdminUser notice: ${err.message}`);
  }
}

async function ensureDbReady() {
  try {
    const usersTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    if (!usersTable) {
      logger.info('🔄 Initializing SQLite database schema...');
      const { runMigrations } = require(path.resolve(__dirname, '../../database/migrations/migrate'));
      await runMigrations(db.DB_PATH);
    }
    const oppCount = await db.get('SELECT COUNT(*) as count FROM opportunities');
    if (!oppCount || oppCount.count === 0) {
      logger.info('🌱 Seeding realistic opportunities & demo student profile...');
      const { seedDatabase } = require(path.resolve(__dirname, '../../database/seeds/seed'));
      await seedDatabase(db.DB_PATH);
    }
  } catch (err) {
    logger.warn(`⚠️ ensureDbReady notice: ${err.message}`);
  }
}

async function startServer(port = config.port) {
  await ensureDbReady();
  await ensureAdminUser();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      logger.info(`🚀 Unified TalentAI Backend running on port ${port} [env: ${config.nodeEnv}]`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
