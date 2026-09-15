'use strict';

const db = require('../database/connection');

/**
 * Server-side RBAC middleware generator.
 * @param  {...string} roles Allowed roles (e.g. 'student', 'recruiter', 'admin')
 */
function requireRole(...roles) {
  const allowed = roles.flat().map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    const userRole = String(req.user.role || req.user.userType || '').toLowerCase();

    if (!allowed.includes(userRole)) {
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

    // Platform admin has universal oversight
    if (currentUser.role === 'admin') {
      return next();
    }

    // Student can access their own profile
    if (currentUser.role === 'student') {
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

    // Recruiter can only view candidate if student applied to a job at recruiter's company
    if (currentUser.role === 'recruiter') {
      const recruiter = await db.get('SELECT company_id FROM recruiter_profiles WHERE user_id = ?', [currentUser.userId]);
      if (!recruiter || !recruiter.company_id) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Recruiter is not associated with any verified company.'
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
