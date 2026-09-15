# RESTful API Overview & Endpoint Catalog

Base URL: `/api`

## Core Endpoint Catalog

### Authentication (`/api/auth`)

* `POST /api/auth/register` — Register new Student or Recruiter account
* `POST /api/auth/login` — Authenticate and receive JWT access token
* `POST /api/auth/refresh` — Refresh access token
* `GET /api/auth/me` — Retrieve current authenticated user profile
* `POST /api/auth/logout` — Invalidate user session

### Jobs (`/api/jobs`)

* `GET /api/jobs` — Browse published jobs with search & location filters
* `GET /api/jobs/:id` — Get single job details with required skills
* `POST /api/jobs` — Create new job posting (Recruiter only)
* `PUT /api/jobs/:id` — Update existing job posting (Recruiter only)

### Applications (`/api/applications`)

* `POST /api/applications` — Submit job application (Student only)
* `GET /api/applications/me` — Get student's application history
* `PATCH /api/applications/:id/stage` — Update application stage status (Recruiter only)

### Matching & Recommendations (`/api/matching`, `/api/recommendations`)

* `POST /api/matching/calculate` — Calculate hybrid match score between candidate and job
* `GET /api/recommendations/jobs` — Personalized recommended jobs for student
* `GET /api/matching/jobs/:jobId/candidates` — Ranked candidates for a specific job

### Resumes (`/api/resumes`)

* `POST /api/resumes/analyze` — Run ATS diagnostic scoring on resume content
