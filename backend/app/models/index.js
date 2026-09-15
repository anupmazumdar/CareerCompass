// backend/app/models/index.js
// Centralized Entity Models and Schema Types

class User {
  constructor({ id, email, password_hash, role, first_name, last_name, is_active = 1, is_verified = 0, created_at, updated_at }) {
    this.id = id;
    this.email = email;
    this.password_hash = password_hash;
    this.role = role; // 'STUDENT' | 'RECRUITER' | 'ADMIN'
    this.first_name = first_name;
    this.last_name = last_name;
    this.is_active = is_active;
    this.is_verified = is_verified;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

class StudentProfile {
  constructor({ id, user_id, headline, bio, location, gpa, graduation_year, github_url, linkedin_url, portfolio_url }) {
    this.id = id;
    this.user_id = user_id;
    this.headline = headline;
    this.bio = bio;
    this.location = location;
    this.gpa = gpa;
    this.graduation_year = graduation_year;
    this.github_url = github_url;
    this.linkedin_url = linkedin_url;
    this.portfolio_url = portfolio_url;
  }
}

class RecruiterProfile {
  constructor({ id, user_id, company_id, title, department, phone, linkedin_url }) {
    this.id = id;
    this.user_id = user_id;
    this.company_id = company_id;
    this.title = title;
    this.department = department;
    this.phone = phone;
    this.linkedin_url = linkedin_url;
  }
}

class Company {
  constructor({ id, name, website, description, industry, location, logo_url, is_verified = 0 }) {
    this.id = id;
    this.name = name;
    this.website = website;
    this.description = description;
    this.industry = industry;
    this.location = location;
    this.logo_url = logo_url;
    this.is_verified = is_verified;
  }
}

class Job {
  constructor({ id, company_id, recruiter_id, title, description, department, location, job_type = 'FULL_TIME', experience_level = 'ENTRY', min_experience_years = 0, min_salary, max_salary, is_active = 1, expires_at }) {
    this.id = id;
    this.company_id = company_id;
    this.recruiter_id = recruiter_id;
    this.title = title;
    this.description = description;
    this.department = department;
    this.location = location;
    this.job_type = job_type;
    this.experience_level = experience_level;
    this.min_experience_years = min_experience_years;
    this.min_salary = min_salary;
    this.max_salary = max_salary;
    this.is_active = is_active;
    this.expires_at = expires_at;
  }
}

class Application {
  constructor({ id, job_id, student_id, resume_id, status = 'APPLIED', match_score, notes, created_at, updated_at }) {
    this.id = id;
    this.job_id = job_id;
    this.student_id = student_id;
    this.resume_id = resume_id;
    this.status = status; // 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN'
    this.match_score = match_score;
    this.notes = notes;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

class Skill {
  constructor({ id, name, normalized_name, category_id }) {
    this.id = id;
    this.name = name;
    this.normalized_name = normalized_name;
    this.category_id = category_id;
  }
}

module.exports = {
  User,
  StudentProfile,
  RecruiterProfile,
  Company,
  Job,
  Application,
  Skill
};
