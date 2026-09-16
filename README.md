# Unified TalentAI Career & Recruitment Platform

[![Node.js CI](https://github.com/anupmazumdar/anupmazumdar-AIRecruitmentAgent/actions/workflows/ci.yml/badge.svg)](https://github.com/anupmazumdar/anupmazumdar-AIRecruitmentAgent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)

An enterprise-grade, unified AI-powered career and recruitment monorepo platform connecting students, university training & placement officers (TPOs), and technical recruiters.

---

## 1. Executive Summary

TalentAI consolidates the student career journey and corporate talent recruitment into **ONE cohesive platform**.

* **One Unified Frontend**: React 18 single page application with role-aware portals and responsive styling.
* **One Layered Backend**: Node.js / Express API architecture with optional Python ML service.
* **One Relational Database**: SQLite for instant zero-configuration local development and PostgreSQL for production scale.
* **One Authentication System**: HS256 JWT access tokens with decoupled Role-Based Access Control (RBAC).
* **One Two-Way Explainable Matching Engine**: Deterministic hybrid scoring algorithm serving student job discovery and recruiter candidate funnels.

---

## 2. Platform Roles

 | Role | Target Persona | Key Capabilities | 
 | :--- | :--- | :--- | 
 | **Student** | Students, Graduates, Job Seekers | Portfolio setup, ATS resume diagnostic, skill verification, job recommendations, one-click application submission, and stage tracking. | 
 | **Recruiter** | Talent Acquisition, Hiring Managers | Job creation with required/preferred skills, AI-ranked candidate funnels, transparent match score breakdowns, and stage advancement. | 
 | **Admin / TPO** | College TPO, Platform Administrators | Recruiter and company verification, skill taxonomy governance, campus placement analytics, and immutable audit log review. | 

---

## 3. Core & AI Features

### 3.1 Explainable Two-Way Matching Engine

Calculates compatibility $S(c, j) \in [0, 100]$ using deterministic, weighted criteria:

* **Skills (40%)**: Matches required and preferred skills against canonical taxonomy and aliases.
* **Experience (20%)**: Evaluates candidate experience years against job minimum thresholds.
* **Education (15%)**: Evaluates academic degree alignment and graduation status.
* **Projects (10%)**: Analyzes candidate project portfolio and technology tags.
* **Location (10%)**: Considers remote preferences, city alignment, and relocation willingness.
* **Certifications (5%)**: Credits accredited industry certifications.

### 3.2 ATS Resume Intelligence

* Deterministic section and keyword parser extracting contact info, skills, education, and work history.
* Readability, keyword density, and formatting diagnostics.
* Actionable improvement suggestions without subjective hallucination.

### 3.3 Application Pipeline & Audit History

* Structured state machine: `APPLIED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `INTERVIEW` $\rightarrow$ `SELECTED` / `REJECTED`.
* Immutable `application_status_history` logging timestamps, previous/new stages, and actor IDs.

---

## 4. Repository Structure

```text
/
├── frontend/                       # Unified React 18 Single Page Application
│   ├── public/                     # Static assets and HTML shell
│   ├── src/                        # Responsibility-driven frontend modules
│   │   ├── components/             # Reusable UI primitives (Buttons, Modals, Navbar)
│   │   ├── pages/                  # Top-level pages (Home, Privacy, Terms)
│   │   ├── layouts/                # Shared layout shells (AppLayout)
│   │   ├── hooks/                  # Custom hooks (useAuth, useDebounce)
│   │   ├── services/               # API & Local Storage services
│   │   ├── api/                    # Axios HTTP client with Bearer auth
│   │   ├── auth/                   # AuthContext & ProtectedRoute
│   │   ├── student/                # Student portal components
│   │   ├── recruiter/              # Recruiter portal components
│   │   ├── admin/                  # Admin & TPO governance views
│   │   ├── jobs/                   # Job board and posting views
│   │   ├── applications/           # Application tracker views
│   │   ├── resume/                 # ATS resume diagnostic views
│   │   ├── matching/               # Match score badges and explanations
│   │   ├── skills/                 # Skill tags and taxonomy selector
│   │   ├── notifications/          # In-app notification center
│   │   ├── utils/                  # Formatting utilities
│   │   ├── types/                  # Shared frontend enums
│   │   └── config/                 # Endpoint configuration
│   ├── tests/                      # Component, integration, and e2e tests
│   ├── package.json
│   └── README.md
│
├── backend/                        # Layered Express & Node.js API Service
│   ├── app/
│   │   ├── api/                    # Modular Express route controllers
│   │   ├── core/                   # Auth, RBAC, DB connection, logging, error handling
│   │   ├── models/                 # Domain entity classes
│   │   ├── schemas/                # Request validation schemas
│   │   ├── repositories/           # Data access layer (parameterized SQL)
│   │   ├── services/               # Domain business logic services
│   │   ├── ai/                     # Two-way matching engine, parser, prompts
│   │   ├── middleware/             # Security and error middleware
│   │   ├── utils/                  # Validators and HTTP response envelopes
│   │   ├── server.js               # Express application entrypoint
│   │   └── main.py                 # Python ML engine entrypoint
│   ├── tests/                      # Unit, integration, security, and e2e tests
│   ├── requirements.txt            # Python ML dependencies
│   ├── package.json
│   └── README.md
│
├── database/                       # Database migrations, seeds, schema, and ERD
│   ├── schema/schema.sql           # Canonical 18-table relational DDL
│   ├── migrations/migrate.js       # Migration runner
│   ├── seeds/seed.js               # Canonical skill taxonomy and demo seeder
│   ├── fixtures/                   # Test resume samples
│   ├── ERD/database-erd.md         # Mermaid ER diagram
│   └── README.md
│
├── security/                       # Security documentation & threat models
│   ├── threat-model/               # STRIDE threat model
│   ├── security-reports/           # Security audit and remediation report
│   ├── penetration-tests/          # Automated penetration test suites
│   ├── vulnerability-checklists/   # OWASP Top 10 checklist
│   ├── security-policies/          # Candidate data privacy and access policy
│   └── README.md
│
├── authentication/                 # Authentication architecture & diagrams
│   ├── documentation/              # JWT lifecycle & RBAC matrix documentation
│   ├── flows/                      # Registration, login, and refresh sequence diagrams
│   ├── diagrams/                   # Architecture diagrams
│   └── README.md
│
├── testing/                        # Cross-system test strategy & test plans
│   ├── test-plans/                 # 6-gate verification plan
│   ├── test-cases/                 # 15 deterministic matching test scenarios
│   ├── test-data/                  # Mock test accounts and jobs
│   ├── security-tests/             # RBAC and IDOR test documentation
│   ├── performance-tests/          # Target latency benchmarks
│   ├── e2e/                        # End-to-end user flows
│   ├── reports/                    # Test execution logs
│   └── README.md
│
├── docs/                           # Central platform documentation
│   ├── architecture/               # System and module architecture docs
│   ├── api/                        # REST API endpoint catalog
│   ├── database/                   # Database architecture docs
│   ├── ai/                         # Matching engine & resume intelligence docs
│   ├── security/                   # Security architecture docs
│   ├── deployment/                 # Deployment guides
│   ├── user-guides/                # Student, Recruiter, and Admin user manuals
│   └── diagrams/                   # 10 master Mermaid architectural diagrams
│
├── scripts/                        # Automation & developer scripts
│   ├── setup/                      # One-click environment bootstrap (setup.ps1, setup.sh)
│   ├── database/                   # Migration and seed scripts
│   ├── development/                # Dev runner
│   ├── testing/                    # Test runner scripts
│   └── deployment/                 # Production deployment scripts
│
├── infrastructure/                 # Container and deployment manifests
│   ├── docker/                     # Dockerfile.frontend, Dockerfile.backend
│   ├── nginx/                      # Nginx reverse proxy configuration
│   ├── deployment/                 # Production docker-compose configs
│   └── monitoring/                 # Container healthcheck probe
│
├── .github/workflows/              # GitHub Actions CI/CD pipelines
├── .env.example                    # Clean environment template (no secrets)
├── docker-compose.yml              # Local multi-container development setup
├── Makefile                        # Unified command shortcuts
└── README.md

```

---

## 5. Getting Started (Local Development)

### Prerequisites

* Node.js 18+ (Node 20 recommended)
* npm 9+
* Optional: Docker & Docker Compose
* Optional: Python 3.10+ (for Python ML service)

### One-Click Bootstrap

Run the setup script to install dependencies, run migrations, and seed initial demo data:

**PowerShell (Windows):**

```powershell
./scripts/setup/setup.ps1

```

**Bash (Linux / macOS):**

```bash
./scripts/setup/setup.sh

```

**Or using Make:**

```bash
make setup

```

### Running Locally

To start both backend and frontend concurrently:

```bash
npm run dev

```

* **Frontend App**: `http://localhost:3000`
* **Backend API**: `http://localhost:5000` (or `3001` per configuration)
* **API Health Check**: `http://localhost:5000/api/health`

---

## 6. Seeded Demo Accounts

 | Role | Email | Password | Pre-loaded Data | 
 | :--- | :--- | :--- | :--- | 
 | **Student** | `student@talentai.edu` | `Password@123` | MCA Student, 6 verified skills, projects, education | 
 | **Recruiter** | `recruiter@techcorp.com` | `Password@123` | TechCorp Innovations recruiter, active job listing | 

> **Security Notice**: Administrative / Superadmin accounts are **never** pre-seeded with public credentials. To provision an administrator account, configure `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` in your private `.env` or deployment environment variables.

---

## 7. Testing Strategy & Execution

The monorepo follows a strict 6-Gate verification protocol:

```bash

# Run all Backend test suites (Unit, Integration, Security, E2E)

cd backend && npm test

# Run all Frontend tests non-interactively

cd frontend && npm test -- --watchAll=false

# Run comprehensive platform tests

./scripts/testing/run-all-tests.ps1

```

---

## 8. Security & OWASP Compliance

* **Authentication**: JWT access tokens (HS256) and secure password hashing (`bcryptjs`).
* **Authorization**: Declarative server-side RBAC and Object-Level Access Control (OLAC) preventing IDOR data leaks.
* **Injection Defense**: Parameterized SQL queries on all database operations.
* **Application Hardening**: Helmet HTTP headers, CORS whitelisting, and rate limiting.

---

## 9. Deployment

### Using Docker Compose

```bash
docker-compose up --build -d

```

### Cloud Production

* **Backend**: Deploy container to Google Cloud Run, AWS ECS, or Render.
* **Frontend**: Deploy static bundle to Vercel, Netlify, or Cloudflare Pages.
* **Database**: Connect managed PostgreSQL via `DATABASE_URL`.

---

## 10. Contribution Workflow

1. Fork the repository and create a feature branch (`git checkout -b feat/your-feature`).
2. Make modular changes adhering to layered architecture.
3. Verify that all tests pass (`npm test` in backend and frontend).
4. Commit using conventional commits (`feat:`, `fix:`, `docs:`, `test:`).
5. Open a Pull Request for review.
