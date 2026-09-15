// backend/app/utils/validators.js

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

function clampScore(score, min = 0, max = 100) {
  const num = Number(score);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, Math.round(num)));
}

module.exports = {
  isValidEmail,
  sanitizeString,
  clampScore
};
