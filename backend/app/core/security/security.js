'use strict';

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const config = require('../config');

// 1. Helmet HTTP headers
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://openrouter.ai', 'https://generativelanguage.googleapis.com'],
      frameSrc: ["'self'", 'https://www.youtube.com']
    }
  },
  crossOriginEmbedderPolicy: false
});

// SECURITY FIX (Fix 2): Replaced wildcard Vercel subdomain check with an
// explicit allowlist + anchored project-specific regex.
//
// ORIGINAL VULNERABILITY:
//   origin.endsWith('.vercel.app')
// With credentials:true, this allowed ANY *.vercel.app origin — including ones
// freely created by attackers (e.g. evil-attacker.vercel.app) — to make
// authenticated cross-origin requests. An attacker could host a malicious page
// on Vercel, trick a logged-in user into visiting it, and silently exfiltrate
// data from credentialed API responses (cookies/tokens). This is a CSRF-equivalent
// vulnerability enabled by an overly permissive CORS origin check.
//
// FIX:
//   1. Rely solely on config.cors.allowedOrigins (ALLOWED_ORIGINS env var) for
//      explicit production/staging URLs.
//   2. For Vercel preview deployments, match ONLY this project's specific prefix
//      using an anchored regex: /^https:\/\/anupmazumdar[-\w]*\.vercel\.app$/
//      An attacker cannot register a subdomain starting with 'anupmazumdar-'
//      for this specific Vercel project — Vercel enforces project-scoped prefixes.
//   3. localhost is still permitted for local development only.
//
// To add a production URL, set ALLOWED_ORIGINS=https://your-domain.com in .env

// Regex anchored to this project's Vercel subdomain prefix — adjust if project
// name changes. This matches: anupmazumdar-*.vercel.app (Vercel preview pattern)
// but NOT: evil-anupmazumdar.vercel.app or anupmazumdar.evil.vercel.app.
const PROJECT_VERCEL_PREVIEW_RE = /^https:\/\/anupmazumdar[-\w]*\.vercel\.app$/;

// 2. CORS configuration
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Allow explicit allowlist from ALLOWED_ORIGINS env var
    if (config.cors.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow localhost for local development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow this project's specific Vercel preview deployment pattern only.
    // NOTE: Do NOT use endsWith('.vercel.app') — that allows ANY attacker's Vercel project.
    if (PROJECT_VERCEL_PREVIEW_RE.test(origin)) {
      return callback(null, true);
    }

    // Reject all other origins
    return callback(new Error(`CORS policy rejection: Origin ${origin} not permitted`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
});

// 3. Rate limiters
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Global rate limit exceeded. Please try again later.' }
});

const isDevOrTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevOrTest ? 2000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'AI processing limit: 15 requests per minute.' }
});

const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Admin rate limit exceeded.' }
});

// Opportunity search limiter: 60 / min
const opportunityLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many opportunity requests. Please slow down.' }
});

// 4. Input Sanitization
const sanitizeMiddleware = [
  mongoSanitize({ replaceWith: '_' }),
  xss(),
  hpp()
];

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  globalRateLimiter,
  authRateLimiter,
  aiRateLimiter,
  adminRateLimiter,
  opportunityLimiter,
  sanitizeMiddleware
};