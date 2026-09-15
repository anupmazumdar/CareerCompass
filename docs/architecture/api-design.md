# API Design: Unified RESTful Platform Interfaces

**Lead Author**: Agent 2 (Backend Engineer)  
**Contributors**: Agent 1 (Architect), Agent 5 (Security)  
**Status**: Proposal for Review  
**Document Path**: `docs/architecture/api-design.md`

---

## 1. Design Conventions & Standards

All endpoints follow strict REST conventions:
- Base path: `/api/v1` (with backward-compatible aliases for existing `/api/*` routes).
- Standard JSON envelope: `{ "success": boolean, "data"?: any, "error"?: string, "message"?: string }`.
- Authentication: `Authorization: Bearer <jwt_access_token>`.
- Server-Side Role Enforcement: Roles: `student`, `recruiter`, `admin`.
- Object-Level Authorization (OLAC): Enforced in data access layer — candidates cannot view or modify other candidates' data; recruiters can only view candidates who applied to their jobs or are whitelisted.

---

## 2. API Endpoint Catalog

### 2.1 Authentication & Session (`/api/auth`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/register` | No | Public | Register new Student or Recruiter account |
| `POST` | `/api/auth/login` | No | Public | Authenticate with email/password; returns JWT + profile |
| `POST` | `/api/auth/refresh` | No | Public | Exchange refresh token for new access token |
| `POST` | `/api/auth/logout` | Yes | All | Revoke refresh token and blacklist access token |
| `GET` | `/api/auth/me` | Yes | All | Get current authenticated user details and active role |

### 2.2 Student Profiles & Portfolios (`/api/students`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/students/me` | Yes | `student` | Get full profile (education, experience, projects, skills) |
| `PUT` | `/api/students/me` | Yes | `student` | Update profile bio, headline, links, preferences |
| `POST` | `/api/students/me/education` | Yes | `student` | Add education entry |
| `DELETE`| `/api/students/me/education/:id` | Yes | `student` | Delete education entry |
| `POST` | `/api/students/me/experience` | Yes | `student` | Add work/internship experience |
| `DELETE`| `/api/students/me/experience/:id`| Yes | `student` | Delete experience entry |
| `POST` | `/api/students/me/projects` | Yes | `student` | Add project entry |
| `DELETE`| `/api/students/me/projects/:id` | Yes | `student` | Delete project entry |
| `POST` | `/api/students/me/skills` | Yes | `student` | Add/claim skill |
| `DELETE`| `/api/students/me/skills/:id` | Yes | `student` | Remove skill |
| `GET` | `/api/students/:id` | Yes | `recruiter`, `admin` | View student candidate profile (authorized applicants only) |

### 2.3 Resumes & Intelligence (`/api/resumes`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/resumes/upload` | Yes | `student` | Upload PDF/DOCX resume; triggers text extraction & parsing |
| `POST` | `/api/resumes/analyze` | Yes | `student` | Perform full ATS analysis, skill extraction, and gap diagnostic |
| `GET` | `/api/resumes/my-resume` | Yes | `student` | Get current student resume data & analysis |
| `GET` | `/api/resumes/:id/download` | Yes | `student`, `recruiter`, `admin` | Secure authorized document download (checks application link) |
| `POST` | `/api/resumes/tailor` | Yes | `student` | Generate tailored resume for specific JD text |
| `POST` | `/api/resumes/export-docx` | Yes | `student` | Export current resume as DOCX binary |
| `POST` | `/api/resumes/export-latex` | Yes | `student` | Export current resume as LaTeX code |

### 2.4 Recruiters & Companies (`/api/recruiters`, `/api/companies`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/recruiters/me` | Yes | `recruiter` | Get recruiter profile & associated company info |
| `PUT` | `/api/recruiters/me` | Yes | `recruiter` | Update recruiter designation & contact details |
| `GET` | `/api/companies` | Yes | All | List verified companies |
| `GET` | `/api/companies/:id` | Yes | All | Get company details and active job listings |
| `POST` | `/api/companies` | Yes | `recruiter`, `admin` | Register/create company profile |
| `PUT` | `/api/companies/:id` | Yes | `recruiter` (company admin), `admin` | Update company profile, branding, website |

### 2.5 Job Management (`/api/jobs`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/jobs` | No / Yes | Public / All | Browse published active jobs (filterable by skill, role, location) |
| `GET` | `/api/jobs/:id` | No / Yes | Public / All | Get full job description, requirements, and company details |
| `POST` | `/api/jobs` | Yes | `recruiter` | Create new job posting (status: draft or published) |
| `PUT` | `/api/jobs/:id` | Yes | `recruiter` (owner), `admin` | Update job details, requirements, deadline, or status |
| `DELETE`| `/api/jobs/:id` | Yes | `recruiter` (owner), `admin` | Close / soft-delete job posting |
| `GET` | `/api/jobs/my-jobs` | Yes | `recruiter` | List all jobs created by authenticated recruiter |

### 2.6 Applications & Lifecycle (`/api/applications`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/jobs/:id/apply` | Yes | `student` | Apply to a job posting with selected resume |
| `GET` | `/api/students/me/applications` | Yes | `student` | Get student's application history and current statuses |
| `GET` | `/api/jobs/:id/applications` | Yes | `recruiter` (owner), `admin` | Get all applicants for a job with match scores & filters |
| `GET` | `/api/applications/:id` | Yes | Applicant, Job Owner, `admin` | View single application details and timeline |
| `PATCH`| `/api/applications/:id/status` | Yes | `recruiter` (owner), `admin` | Transition status (`under_review`, `shortlisted`, `interview`, `selected`, `rejected`) |
| `GET` | `/api/applications/:id/history` | Yes | Applicant, Job Owner, `admin` | View immutable audit history of status changes |

### 2.7 Matching & Recommendations (`/api/matching`, `/api/recommendations`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/recommendations/jobs` | Yes | `student` | Get personalized recommended jobs ranked by match score |
| `GET` | `/api/jobs/:id/matching-candidates` | Yes | `recruiter` (owner), `admin` | Get AI-ranked candidate pool for a specific job |
| `GET` | `/api/matching/student/:studentId/job/:jobId` | Yes | Authorized Student / Recruiter / Admin | Get full explainable match score breakdown & skill gap analysis |

### 2.8 Skills Taxonomy (`/api/skills`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/skills` | No | Public | Search canonical skills with auto-complete |
| `GET` | `/api/skills/categories` | No | Public | List all skill categories |
| `POST` | `/api/skills` | Yes | `admin` | Add canonical skill to taxonomy |
| `POST` | `/api/skills/alias` | Yes | `admin` | Map alias to canonical skill (e.g., `JS` -> `JavaScript`) |

### 2.9 Admin / TPO Governance (`/api/admin`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/admin/stats` | Yes | `admin` | Platform KPIs: active students, recruiters, jobs, placements |
| `GET` | `/api/admin/recruiters` | Yes | `admin` | List recruiters with verification statuses |
| `PATCH`| `/api/admin/recruiters/:id/approve` | Yes | `admin` | Approve or reject recruiter registration |
| `GET` | `/api/admin/companies` | Yes | `admin` | List companies with verification queue |
| `PATCH`| `/api/admin/companies/:id/verify` | Yes | `admin` | Verify company credentials |
| `GET` | `/api/admin/audit-logs` | Yes | `admin` | Query security and authorization audit log |
| `PATCH`| `/api/admin/users/:id/status` | Yes | `admin` | Enable or disable user account |

---

## 3. Standard Request & Response Schemas

### 3.1 Job Application Submission
`POST /api/jobs/18/apply`
```json
// Headers: Authorization: Bearer <token>
{
  "resume_id": 4,
  "cover_note": "Experienced full-stack developer enthusiastic about Node.js and React roles."
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "application_id": 92,
    "job_id": 18,
    "student_id": 142,
    "status": "applied",
    "match_score": 81.5,
    "applied_at": "2026-09-15T14:35:00.000Z"
  },
  "message": "Application submitted successfully"
}
```

### 3.2 Application Status Transition
`PATCH /api/applications/92/status`
```json
// Headers: Authorization: Bearer <recruiter_token>
{
  "status": "shortlisted",
  "notes": "Strong technical skills in Python and FastAPI. Scheduled for technical interview."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "application_id": 92,
    "previous_status": "applied",
    "current_status": "shortlisted",
    "updated_by": "Recruiter Jane Smith",
    "updated_at": "2026-09-15T14:40:00.000Z"
  },
  "message": "Application status updated to shortlisted"
}
```

---

## 4. Error Handling & HTTP Status Standards

| HTTP Code | Error Code | Scenario | Example Response |
| :---: | :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Missing required fields, invalid email format | `{ "success": false, "error": "VALIDATION_ERROR", "message": "Email and password are required" }` |
| `401` | `UNAUTHORIZED` | Missing, expired, or invalid JWT access token | `{ "success": false, "error": "UNAUTHORIZED", "message": "Authentication required" }` |
| `403` | `FORBIDDEN` | Role mismatch or unauthorized candidate access (IDOR) | `{ "success": false, "error": "FORBIDDEN", "message": "Access denied. Only applicants to your jobs may be viewed" }` |
| `404` | `NOT_FOUND` | Resource ID does not exist | `{ "success": false, "error": "NOT_FOUND", "message": "Job posting not found" }` |
| `409` | `CONFLICT` | Duplicate registration or applying twice to same job | `{ "success": false, "error": "CONFLICT", "message": "You have already applied to this job" }` |
| `429` | `TOO_MANY_REQUESTS`| Rate limit exceeded | `{ "success": false, "error": "TOO_MANY_REQUESTS", "message": "Rate limit exceeded. Try again in 60s" }` |
| `500` | `INTERNAL_ERROR` | Unexpected server failure (sanitized, stack hidden in prod)| `{ "success": false, "error": "INTERNAL_ERROR", "message": "An internal error occurred" }` |
