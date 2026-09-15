# Cross-System Testing Strategy (`testing/`)

## Purpose

This directory organizes platform-wide quality assurance, test plans, deterministic test scenarios, security test matrices, performance benchmarks, and test execution reports.

## Directory Structure

```text
testing/
├── test-plans/
│   └── master-test-plan.md              # 6-gate verification lifecycle
├── test-cases/
│   └── 15-matching-engine-test-cases.md # Algorithmic matching validation scenarios
├── test-data/
│   └── sample-test-data.json            # Canonical mock profiles and jobs
├── security-tests/
│   └── idor-and-rbac-tests.md           # Access control test documentation
├── performance-tests/
│   └── performance-benchmarks.md        # Target response latencies and limits
├── e2e/
│   └── e2e-user-flows.md                # End-to-end student, recruiter, and admin journeys
├── reports/
│   └── initial-test-run-report.md       # Empirical test execution logs
└── README.md

```

## Important Architectural Rule

Executable tests remain close to their target runtime:

* Backend executable tests: `backend/tests/` (`unit/`, `integration/`, `security/`, `e2e/`)
* Frontend executable tests: `frontend/tests/` and `frontend/src/*.test.js`
* This `testing/` folder serves as the central documentation, strategy, data, and reporting hub.
