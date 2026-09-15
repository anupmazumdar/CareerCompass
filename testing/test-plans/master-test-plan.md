# Master Test Plan: Unified TalentAI Platform

**Author**: Agent 6 (QA / Testing Engineer)  
**Date**: September 2026  
**Scope**: Full Stack Platform Verification

---

## 1. The 6 Testing Gates

| Gate | Phase | Verification Scope | Passing Criteria |
| :--- | :--- | :--- | :--- |
| **Gate 1** | Build | `npm run build` (Frontend) & Node process startup (Backend) | Zero build errors, clean asset bundling |
| **Gate 2** | Unit Tests | Matching engine, skill taxonomy resolver, resume parser | 100% pass rate on algorithmic test matrix |
| **Gate 3** | Integration | Auth registration, login, job posting, application submission | 200/201 response status, correct DB state |
| **Gate 4** | Security | RBAC boundaries, IDOR access controls, parameterized SQL queries | 401/403 returned on unauthorized actions |
| **Gate 5** | QA / Edge Cases | Empty profiles, duplicate registrations, missing skills, non-ASCII text | Graceful degradation without uncaught exceptions |
| **Gate 6** | Final Review | Architecture compliance, import integrity, secret purge check | Ready for production deployment & viva demo |

---

## 2. Test Execution Commands

```bash
# Execute Backend unit, integration, and security tests
cd backend && npm test

# Execute Frontend React testing library suites
cd frontend && npm test -- --watchAll=false

# Run all suites via automation script
./scripts/testing/run-all-tests.ps1
```
