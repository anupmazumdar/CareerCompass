# TalentAI Unified Backend API (`backend/`)

## Purpose
The unified server-side application for the **TalentAI Career & Recruitment Platform**. Built with Node.js, Express, SQLite/PostgreSQL, and an optional Python ML service. It provides layered architecture spanning authentication, authorization, domain repositories, business services, deterministic matching, and AI intelligence.

---

## Directory Organization

```text
backend/
├── app/
│   ├── api/                   # HTTP Route Controllers
│   │   ├── auth/              # Registration, login, token refresh
│   │   ├── students/          # Student profile and portfolio CRUD
│   │   ├── recruiters/        # Recruiter management
│   │   ├── companies/         # Employer verification and details
│   │   ├── jobs/              # Job postings and requirements
│   │   ├── applications/      # Job application lifecycle and history
│   │   ├── resumes/           # Resume analysis and upload endpoints
│   │   ├── skills/            # Canonical skill taxonomy
│   │   ├── matching/          # Two-way matching engine routes
│   │   ├── recommendations/   # Job recommendations for students
│   │   └── admin/             # TPO platform governance
│   │
│   ├── core/                  # Cross-cutting foundational concerns
│   │   ├── config/            # Configuration and environment loader
│   │   ├── database/          # Promisified SQLite / PostgreSQL connection
│   │   ├── authentication/    # JWT issuing, verification, revocation
│   │   ├── authorization/     # Role-based & object-level authorization (IDOR defense)
│   │   ├── security/          # Helmet, CORS, rate limits, sanitizers
│   │   ├── logging/           # Winston and Morgan HTTP logger
│   │   └── exceptions/        # Error envelopes and handlers
│   │
│   ├── models/                # Domain entity definitions
│   ├── schemas/               # Request validation schemas
│   ├── repositories/          # Data access layer (SQLite / Postgres)
│   ├── services/              # Domain business logic layer
│   │   ├── student/           # Student profile service
│   │   ├── recruiter/         # Recruiter domain service
│   │   ├── jobs/              # Job posting & management
│   │   ├── applications/      # Application lifecycle service
│   │   ├── resume/            # ATS scoring service
│   │   ├── skills/            # Skill taxonomy service
│   │   ├── matching/          # Matching calculation service
│   │   └── recommendations/   # Recommendation service
│   │
│   ├── ai/                    # AI intelligence layer
│   │   ├── resume_parser/     # Deterministic text & section parser
│   │   ├── resume_analyzer/   # ATS scoring and document generation
│   │   ├── matching_engine/   # Deterministic explainable matching engine
│   │   ├── recommendations/   # Collaborative & content-based rankers
│   │   └── prompts/           # System prompt templates and guardrails
│   │
│   ├── middleware/            # Express middleware adapters
│   ├── utils/                 # Validation & HTTP response formatters
│   ├── server.js              # Primary Express application entry point
│   └── main.py                # Python ML FastAPI service entry point
│
├── tests/
│   ├── unit/                  # Algorithmic matching & taxonomy tests
│   ├── integration/           # Auth and lifecycle integration tests
│   ├── security/              # RBAC and IDOR penetration tests
│   └── e2e/                   # End-to-end full application flows
│
├── requirements.txt           # Python ML dependencies
├── package.json               # Node.js backend dependencies and scripts
└── README.md
```

---

## What Belongs Here
- All RESTful API controllers, routing logic, and HTTP middleware.
- Core business logic, domain services, and database repositories.
- Deterministic matching calculation algorithms and AI prompts.
- Backend automated test suites (unit, integration, security, and e2e).

## What Does NOT Belong Here
- React components, JSX views, and client stylesheets (belongs in `frontend/`).
- Direct production database binary backups or raw migration files (belongs in `database/`).
- Hardcoded secrets or credentials (belongs in `.env`).

---

## Important Dependencies
- `express` (v4)
- `sqlite3` (v5)
- `jsonwebtoken`, `bcryptjs`
- `helmet`, `express-rate-limit`, `cors`
- `winston`, `morgan`
- `docx`, `pdf-parse`, `mammoth`
- `fastapi`, `uvicorn`, `scikit-learn`, `pydantic` (Python ML engine)

---

## How to Work With This Folder

```bash
# 1. Install dependencies
npm install

# 2. Run all backend tests (Unit, Integration, Security, E2E)
npm test

# 3. Start development server
npm start
```
