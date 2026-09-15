# Security & Authorization Test Matrix

## Test Suite: `tests/security/rbac.test.js`

### Test Vector 1: Unauthorized Role Endpoint Access

* **Action**: A user with role `STUDENT` issues a `POST /api/jobs` request.
* **Expected Outcome**: HTTP `403 Forbidden`. The middleware halts execution before invoking `jobRepository`.

### Test Vector 2: Candidate Resume Scrape (IDOR)

* **Action**: Recruiter A (registered under Company Alpha) attempts to retrieve resume binary via `GET /api/resumes/:resumeId` for a candidate who applied exclusively to Company Beta.
* **Expected Outcome**: HTTP `403 Forbidden` with error code `ACCESS_DENIED_UNAUTHORIZED_APPLICATION`.

### Test Vector 3: Tampered Stage Progression

* **Action**: An applicant issues a `PUT /api/applications/:id/stage` attempting to change their own status from `applied` to `selected`.
* **Expected Outcome**: HTTP `403 Forbidden`. Only the recruiter owning the job or an Admin can alter application stage status.
