# Data Privacy & Access Control Policy

## TalentAI Platform Governance Policy

1. **Candidate Data Ownership**:
   * A student maintains exclusive ownership of their resume, academic transcripts, and personal contact info.
   * Contact info (phone number, personal email, street address) is redacted from recruiter view until the student applies or accepts an interview invitation.

2. **Recruiter Access Boundaries**:
   * Recruiters are granted read access solely to candidate profiles who have active applications with their registered company.
   * Cross-company candidate harvesting is strictly prohibited and prevented at the database and API query level.

3. **Admin / TPO Oversight**:
   * Training & Placement Officers (TPO) and Platform Administrators possess audit access for compliance, student placement verification, and company onboarding approvals.
   * Administrative actions are recorded in `audit_logs` with actor ID and action payload.

4. **Retention and Data Deletion**:
   * Resumes uploaded for diagnostic ATS scoring without application submission can be purged upon user request or after 90 days of inactivity.
