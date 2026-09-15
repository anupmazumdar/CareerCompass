# Security Architecture & Verification (`security/`)

## Purpose
This directory houses all security artifacts, threat models, penetration test suites, audit reports, and compliance checklists for the Unified TalentAI Career Platform.

## Directory Structure
```
security/
├── threat-model/
│   └── stride-threat-model.md          # STRIDE matrix covering auth, IDOR, AI injection
├── security-reports/
│   └── security-audit-report.md        # Baseline vulnerability remediation report
├── penetration-tests/
│   └── security-test-suite.js          # Automated security & penetration test runner
├── vulnerability-checklists/
│   └── owasp-top-10-checklist.md       # OWASP Top 10 compliance verification
├── security-policies/
│   └── data-privacy-and-access-policy.md # Candidate privacy and access rules
└── README.md
```

## What Belongs Here
- Threat modeling artifacts and architectural security analyses.
- Automated security regression scripts and penetration test suites.
- Vulnerability remediation reports and compliance checklists.

## What Does NOT Belong Here
- Production secrets, private keys, or credentials (these belong in `.env` and secret managers).
- Operational runtime security middleware (this belongs in `backend/app/core/security/`).
