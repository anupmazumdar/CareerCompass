'use strict';

const db = require('../database/connection');

const ROLE_ALIASES = {
  student: ['student', 'candidate'],
  candidate: ['student', 'candidate'],
  employer: ['employer', 'recruiter'],
  recruiter: ['employer', 'recruiter'],
  admin: ['admin', 'superadmin'],
  superadmin: ['admin', 'superadmin']
};

function normalizeRole(role) {
  const r = String(role || '').toLowerCase();
  if (ROLE_ALIASES.student.includes(r)) return 'student';
  if (ROLE_ALIASES.employer.includes(r)) return 'employer';
  if (ROLE_ALIASES.admin.includes(r)) return 'admin';
  return r;
}

/**
 * Server-side RBAC middleware generator.
 * @param  {...string} roles Allowed roles (e.g. 'student', 'employer', 'admin')
 */
function requireRole(...roles) {
  const allowed = roles.flat().map((r) => String(r).toLowerCase());
  const expandedAllowed = new Set();
  allowed.forEach((r) => {
    expandedAllowed.add(r);
    (ROLE_ALIASES[r] || []).forEach((alias) => expandedAllowed.add(alias));
  });

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    const userRole = String(req.user.role || req.user.userType || '').toLowerCase();

    if (!expandedAllowed.has(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Access denied. Required role: ${allowed.join(' or ')}`
      });
    }

    return next();
  };
}

/**
 * Object-Level Authorization (OLAC / IDOR defense):
 * Verifies that the requesting user has legitimate permission to view student candidate details.
 */
async function verifyCandidateAccess(req, res, next) {
  try {
    const studentProfileId = Number(req.params.id || req.params.studentId);
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const normalizedUserRole = normalizeRole(currentUser.role || currentUser.userType);

    // Platform admin has universal oversight
    if (normalizedUserRole === 'admin') {
      return next();
    }

    // Student can access their own profile
    if (normalizedUserRole === 'student') {
      const student = await db.get('SELECT id FROM student_profiles WHERE user_id = ?', [currentUser.userId]);
      if (student && student.id === studentProfileId) {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Access denied. You can only view your own candidate profile.'
      });
    }

    // Employer / recruiter can only view candidate if:
    //   (a) they are associated with a company
    //   (b) that company has verification_status = 'verified'  <-- SECURITY FIX (Fix 1, part 3)
    //   (c) the student applied to a job at that company
    //
    // ORIGINAL VULNERABILITY: The check only verified that an application existed
    // for the company, but did NOT verify whether the company itself was verified.
    // An attacker who registered a new (unverified) company could immediately see
    // candidate PII by posting a dummy job and receiving an application.
    //
    // FIX: Fetch the company row and assert verification_status = 'verified' before
    // allowing access. Unverified / pending companies cannot access candidate data.
    if (normalizedUserRole === 'employer') {
      const recruiter = await db.get(
        `SELECT rp.company_id, c.verification_status
         FROM recruiter_profiles rp
         LEFT JOIN companies c ON rp.company_id = c.id
         WHERE rp.user_id = ?`,
        [currentUser.userId]
      );

      if (!recruiter || !recruiter.company_id) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Recruiter is not associated with any company.'
        });
      }

      // SECURITY: Only verified companies may access candidate PII
      if (recruiter.verification_status !== 'verified') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Your company account is pending verification. Candidate access is not permitted until an administrator verifies your company.'
        });
      }

      const hasApplication = await db.get(
        `SELECT a.id FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.student_id = ? AND j.company_id = ?`,
        [studentProfileId, recruiter.company_id]
      );

      if (!hasApplication) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Access denied. You can only view candidates who submitted an application to your company.'
        });
      }

      return next();
    }

    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Unauthorized role' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireRole,
  verifyCandidateAccess
};