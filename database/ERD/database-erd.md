# Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o| student_profiles : "1:1 profile"
    users ||--o| recruiter_profiles : "1:1 profile"
    companies ||--o{ recruiter_profiles : "employs"
    companies ||--o{ jobs : "offers"
    recruiter_profiles ||--o{ jobs : "posts"

    student_profiles ||--o{ student_education : "contains"
    student_profiles ||--o{ student_experience : "contains"
    student_profiles ||--o{ student_projects : "contains"
    student_profiles ||--o{ student_certifications : "contains"
    student_profiles ||--o{ student_skills : "has"
    student_profiles ||--o{ resumes : "submits"
    student_profiles ||--o{ applications : "submits"

    skills ||--o{ student_skills : "categorizes"
    skills ||--o{ job_skills : "requires"
    skills }o--|| skill_categories : "belongs to"
    skills ||--o{ skill_aliases : "aliased as"

    jobs ||--o{ job_skills : "demands"
    jobs ||--o{ applications : "receives"

    resumes ||--o| resume_analysis : "analyzed by"
    applications ||--o{ application_status_history : "logs transitions"
    applications ||--o| match_scores : "scored by"

    users ||--o{ audit_logs : "triggers"

```

## Entity Summary

* `users`: Universal identity table with roles (`student`, `recruiter`, `admin`).
* `companies`: Registered and verified hiring organizations.
* `student_profiles`: Enriched candidate data (bio, location, links, preferences).
* `recruiter_profiles`: Employer accounts linked to companies.
* `jobs`: Job listings with salary, location, requirements, and status.
* `job_skills`: Required vs. preferred technical competencies per job.
* `skills`, `skill_categories`, `skill_aliases`: Canonical ontology with parent-child relationships.
* `applications`: Application state tracking (`applied`, `under_review`, `shortlisted`, `interview`, `selected`, `rejected`).
* `match_scores`: Multi-criteria explainable evaluations.
