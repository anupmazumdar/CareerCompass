# End-to-End User Verification Flows

## 1. Student Onboarding to Job Application Flow

1. **Registration**: Student creates account with email and password via `POST /api/auth/register`.
2. **Profile Completion**: Student adds education, technical skills (`React`, `Node.js`, `SQL`), and past projects.
3. **Resume Diagnostic**: Student uploads PDF resume; ATS parser scores structure, contact clarity, and extracts skills.
4. **Job Discovery**: Student browses recommended jobs; receives calculated 86% match score with explicit skill breakdown.
5. **Application**: Student applies with one click; application transitions to `APPLIED` state.

## 2. Recruiter Job Posting & Candidate Funnel Flow

1. **Authentication**: Recruiter logs into portal.
2. **Post Job**: Recruiter creates listing specifying mandatory skills, experience threshold, and JD description.
3. **Funnel Review**: Recruiter views applicant pipeline ranked descending by AI match score.
4. **Stage Transition**: Recruiter inspects candidate match details and advances candidate from `APPLIED` to `SHORTLISTED` and `INTERVIEW`.

## 3. Administrator / TPO Governance Flow

1. **Verification**: Admin approves newly registered recruiter profiles and company associations.
2. **Taxonomy Management**: Admin views canonical skill graph and resolves aliases.
3. **Placement Analytics**: TPO monitors overall student placement conversion rates and company engagement.
