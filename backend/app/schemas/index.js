// backend/app/schemas/index.js
// Request and Payload Validation Schemas

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

const Schemas = {
  validateRegister(body) {
    const errors = [];
    if (!validateEmail(body.email)) errors.push('Valid email is required');
    if (!validatePassword(body.password)) errors.push('Password must be at least 6 characters');
    if (!body.firstName || typeof body.firstName !== 'string') errors.push('First name is required');
    if (!body.lastName || typeof body.lastName !== 'string') errors.push('Last name is required');
    if (!['STUDENT', 'RECRUITER', 'ADMIN'].includes(body.role)) errors.push('Role must be STUDENT, RECRUITER, or ADMIN');
    return { isValid: errors.length === 0, errors };
  },

  validateLogin(body) {
    const errors = [];
    if (!validateEmail(body.email)) errors.push('Valid email is required');
    if (!body.password) errors.push('Password is required');
    return { isValid: errors.length === 0, errors };
  },

  validateJobCreate(body) {
    const errors = [];
    if (!body.title || typeof body.title !== 'string') errors.push('Job title is required');
    if (!body.description || typeof body.description !== 'string') errors.push('Job description is required');
    if (body.min_experience_years && typeof body.min_experience_years !== 'number') {
      errors.push('min_experience_years must be a number');
    }
    return { isValid: errors.length === 0, errors };
  },

  validateApplicationStage(body) {
    const validStages = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];
    const errors = [];
    if (!validStages.includes(body.status)) {
      errors.push(`Status must be one of: ${validStages.join(', ')}`);
    }
    return { isValid: errors.length === 0, errors };
  }
};

module.exports = Schemas;
