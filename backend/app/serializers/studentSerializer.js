'use strict';

/**
 * Candidate PII Serializer / DTO layer.
 * Enforces least-privilege exposure of sensitive candidate information.
 */

/**
 * Serializes candidate profile for the owning student.
 * Full access to all personal, academic, and application history data.
 */
function toOwnStudentProfile(student) {
  if (!student) return null;
  return { ...student };
}

/**
 * Serializes candidate profile for platform administrators.
 * Complete oversight data.
 */
function toAdminStudent(student) {
  if (!student) return null;
  return { ...student };
}

/**
 * Serializes candidate profile for authorized recruiters/employers.
 * Redacts personal phone number, private student goals, and unsubmitted resumes.
 */
function toRecruiterCandidate(student, options = {}) {
  if (!student) return null;

  const serialized = {
    id: student.id,
    user_id: student.user_id,
    full_name: student.full_name,
    email: student.email,
    headline: student.headline,
    bio: student.bio,
    location: student.location,
    college: student.college,
    degree: student.degree,
    branch: student.branch,
    current_semester: student.current_semester,
    graduation_year: student.graduation_year,
    cgpa: student.cgpa,
    achievements: student.achievements,
    github_url: student.github_url,
    linkedin_url: student.linkedin_url,
    portfolio_url: student.portfolio_url,
    preferred_roles: student.preferred_roles,
    preferred_locations: student.preferred_locations,
    work_mode_preference: student.work_mode_preference,
    education: student.education || [],
    experience: student.experience || [],
    projects: student.projects || [],
    skills: student.skills || [],
    certifications: student.certifications || [],
    profile_completeness: student.profile_completeness
  };

  // Only expose resume if explicitly provided in context (e.g. submitted with application)
  if (options.submittedResume) {
    serialized.resume = options.submittedResume;
  } else if (Array.isArray(student.resumes) && student.resumes.length > 0) {
    // Expose only the primary or first resume metadata (safe fields only)
    const primary = student.resumes.find(r => r.is_primary) || student.resumes[0];
    serialized.resume = {
      id: primary.id,
      version_label: primary.version_label,
      file_name: primary.file_name,
      file_size: primary.file_size,
      mime_type: primary.mime_type,
      created_at: primary.created_at
    };
  }

  // Personal goals are private to the student and omitted for recruiters
  // Phone is omitted by default for candidate privacy
  return serialized;
}

/**
 * Serializes student profile for public or unauthenticated browsing.
 * Strips all contact information, exact grades, personal goals, and resumes.
 */
function toPublicStudent(student) {
  if (!student) return null;

  return {
    id: student.id,
    full_name: student.full_name,
    headline: student.headline,
    bio: student.bio,
    college: student.college,
    degree: student.degree,
    branch: student.branch,
    graduation_year: student.graduation_year,
    github_url: student.github_url,
    linkedin_url: student.linkedin_url,
    portfolio_url: student.portfolio_url,
    projects: (student.projects || []).map(p => ({
      title: p.title,
      description: p.description,
      technologies: p.technologies,
      project_url: p.project_url,
      github_url: p.github_url
    })),
    skills: (student.skills || []).map(s => ({
      skill_name: s.skill_name || s.canonical_name,
      proficiency_level: s.proficiency_level
    })),
    certifications: (student.certifications || []).map(c => ({
      title: c.title,
      issuing_organization: c.issuing_organization,
      issue_date: c.issue_date
    }))
  };
}

module.exports = {
  toOwnStudentProfile,
  toAdminStudent,
  toRecruiterCandidate,
  toPublicStudent
};
