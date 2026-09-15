# Database Architecture & Relational Data Model

## 1. Overview

The database schema consists of 18 normalized relational tables designed to support ACID transactions, auditability, and deterministic skill matching.

## 2. Table Catalog

1. `users`: Unified identity records for Student, Recruiter, and Admin.
2. `student_profiles`: Academic and career preferences.
3. `recruiter_profiles`: Employer designations and company affiliations.
4. `companies`: Registered employer profiles and verification status.
5. `student_education`: Educational degrees, GPA, and institutions.
6. `student_experience`: Past internships and full-time employment.
7. `student_projects`: Portfolio projects with technology tags.
8. `student_certifications`: Industry certifications and credential URLs.
9. `skill_categories`: Canonical categorization taxonomy.
10. `skills`: Normalized skill entities with parent-child relationships.
11. `skill_aliases`: Canonical alias mappings (e.g., 'React.js' -> 'React').
12. `student_skills`: Verified and self-reported skills per student.
13. `jobs`: Employment postings and hiring criteria.
14. `job_skills`: Required and preferred skill requirements per job.
15. `resumes`: Binary metadata and raw extracted text.
16. `resume_analysis`: ATS diagnostic scores and feedback.
17. `applications`: Candidate job applications and calculated match scores.
18. `application_status_history`: Immutable status transition audit logs.
