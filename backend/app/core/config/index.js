'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from root or backend directory
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Fail-fast in production if secrets are missing or insecure
if (isProduction) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.includes('default_') || jwtSecret.length < 32) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: In production, JWT_SECRET must be explicitly set to a cryptographically secure key of at least 32 characters.'
    );
  }
}

module.exports = {
  port: Number(process.env.PORT || 3001),
  nodeEnv,
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_development_secret_key_change_in_production',
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default_jwt_access_secret_key_min_32_bytes',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default_jwt_refresh_secret_key_min_32_bytes',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'openrouter',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openrouterModel: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free',
    geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY || '',
    timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 25000)
  },
  database: {
    dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../../../data/talentai.db')
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,https://anupmazumdar-ai-recruitment-agent.vercel.app').split(',')
  }
};
