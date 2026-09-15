# Repository Migration Plan: Monorepo Clean Restructuring

**Lead Author**: Agent 1 (Architect / Tech Lead)
**Contributors**: Agents 2, 3, 4, 5, 6
**Status**: Approved for Execution
**Document Path**: `docs/architecture/repository-migration-plan.md`

---

## 1. Migration Objectives & Rules

1. **Zero Logic Rewrites**: Application business logic is preserved; files are organized by layered domain responsibility.
2. **Zero Code Loss**: Working parsers, interview evaluators, ATS checkers, and assessment engines are retained.
3. **Zero Dead/Fake Folders**: Every folder has concrete implementation, configuration, or documentation files.
4. **Git Safety**: Existing files are moved with `git mv` where feasible to preserve version history.
5. **Verified Imports**: All relative import paths (`require`, `import`) are methodically updated and verified via startup and test execution.

---

## 2. File Relocation Matrix

### 2.1 Backend Modules & Services

 | Current Location | Target Location | Rationale & Architectural Purpose | Dependencies | Inherent Risks & Mitigation | 
 | :--- | :--- | :--- | :--- | :--- | 
 | `api/database/connection.js` | `backend/app/core/database/connection.js` | Core DB connection layer with SQLite WAL mode | `sqlite3`, `path` | Path to `data/talentai.db` must resolve relative to monorepo root | 
 | `api/database/schema.sql` | `database/schema/schema.sql` | Canonical database DDL definition | SQLite / PostgreSQL | Referenced by migration runners | 
 | `api/database/migrate.js` | `database/migrations/migrate.js` | Database migration runner | `connection.js`, `schema.sql` | Ensure connection import points to `backend/app/core/database` | 
 | `api/database/seed.js` | `database/seeds/seed.js` | Taxonomy and demo records seeder | `connection.js`, `bcryptjs` | Ensure canonical skill references match schema | 
 | `api/middleware/auth.js` | `backend/app/core/authentication/auth.js` | Core JWT authentication & token management | `jsonwebtoken`, `crypto` | Update token secrets & export references | 
 | `api/middleware/security.js` | `backend/app/core/security/security.js` | Helmet, rate limiting, HPP, XSS sanitizers | `helmet`, `express-rate-limit` | Ensure rate limiter limits match route requirements | 
 | `api/middleware/logger.js` | `backend/app/core/logging/logger.js` | Winston & Morgan HTTP logging | `winston`, `morgan` | Centralized logging across all modules | 
 | `api/middleware/errorHandler.js` | `backend/app/core/exceptions/errorHandler.js` | Central error and 404 handler | `logger.js` | Standard HTTP error envelope `{ success: false, error }` | 
 | `api/services/resumeTailor.js` | `backend/app/ai/resume_analyzer/resumeTailor.js` | ATS scoring, deterministic parsing, docx/LaTeX | `docx`, `pdf-parse`, `mammoth` | Multi-format parsing dependencies must resolve | 
 | `api/services/interviewEvaluator.js` | `backend/app/services/interview/interviewEvaluator.js` | AI interview transcript evaluation | `talentai.js` | Links to TalentAI model router | 
 | `api/services/biasDetection.js` | `backend/app/ai/bias_detector/biasDetection.js` | Demographic and gender bias detector | OpenRouter / LLM | Keep prompt format intact | 
 | `api/services/feedbackGenerator.js` | `backend/app/services/feedback/feedbackGenerator.js` | Candidate post-interview feedback | OpenRouter / LLM | Structured JSON generation | 
 | `talentai.js` (root) | `backend/app/ai/matching_engine/talentRouter.js` | Multi-model routing engine & fallback chains | OpenRouter / Gemini | Update relative requires to modelStats & costTracker | 
 | `modelStats.js` (root) | `backend/app/ai/matching_engine/modelStats.js` | Latency & error metrics tracker | Node.js runtime | AI statistics endpoint dependency | 
 | `costTracker.js` (root) | `backend/app/ai/matching_engine/costTracker.js` | Per-token AI cost estimator | Pricing model config | Cost endpoint dependency | 
 | `abTest.js` (root) | `backend/app/ai/matching_engine/abTest.js` | A/B model routing logic | Node.js runtime | Router dependency | 
 | `api/routes/v1/ai.js` | `backend/app/api/ai/routes.js` | AI API endpoints (`/bias-detect`, `jd-match`, etc.) | Auth, security middleware | Express router mounting in main server | 
 | `api/[...talentai].js` | `backend/app/server.js` | Main Express server entry point | All modular routers | Refactored to import modular route handlers | 
 | `api/package.json` | `backend/package.json` | Backend dependencies & scripts | npm | Add start/dev/test scripts | 

### 2.2 Database Directory (`database/`)

 | Target Location | Purpose & Contents | Source / Implementation | 
 | :--- | :--- | :--- | 
 | `database/schema/schema.sql` | Canonical relational DDL schema (18 tables) | Copied from `api/database/schema.sql` | 
 | `database/migrations/migrate.js` | Migration executor applying SQL DDL | Adapted from `api/database/migrate.js` | 
 | `database/seeds/seed.js` | Taxonomy, user roles, sample jobs seeder | Adapted from `api/database/seed.js` | 
 | `database/seeds/skills_data.json` | Comprehensive 500+ skill taxonomy dataset | Generated canonical skill hierarchy | 
 | `database/ERD/database-erd.md` | Mermaid ER diagram and table dictionary | Extracted from database-design doc | 
 | `database/fixtures/` | Sample candidate resumes & JD test fixtures | Structured test files | 
 | `database/README.md` | Database maintenance, migrations, and seeding guide | Comprehensive guide | 

### 2.3 Authentication & Security Artifacts (`authentication/`, `security/`)

 | Target Location | Purpose & Contents | 
 | :--- | :--- | 
 | `authentication/documentation/` | Complete JWT and RBAC flow documentation | 
 | `authentication/flows/` | Mermaid sequence diagrams for Registration, Login, Token Refresh | 
 | `authentication/README.md` | Architecture and security guidelines for auth | 
 | `security/threat-model/` | STRIDE threat model covering IDOR, prompt injection, and data leaks | 
 | `security/security-policies/` | Security and access policies for Student, Recruiter, and Admin | 
 | `security/vulnerability-checklists/` | OWASP Top 10 verification checklist | 
 | `security/security-reports/` | Audit report of fixed vulnerabilities | 
 | `security/README.md` | Overview of security posture | 

### 2.4 Testing Artifacts (`testing/`, `backend/tests/`, `frontend/tests/`)

 | Target Location | Purpose & Contents | 
 | :--- | :--- | 
 | `testing/test-plans/` | 6-Gate verification strategy and master test plan | 
 | `testing/test-cases/` | 15 deterministic matching test case definitions | 
 | `testing/security-tests/` | Penetration and authorization test vectors | 
 | `testing/reports/` | Test execution reports | 
 | `testing/README.md` | Cross-system testing instructions | 
 | `backend/tests/unit/` | Jest/Mocha tests for matching engine, skill taxonomy, resume parsing | 
 | `backend/tests/integration/` | API route integration tests for auth, jobs, applications | 
 | `backend/tests/security/` | Automated RBAC and IDOR tests | 
 | `frontend/tests/` | Component and route render tests | 

### 2.5 Documentation (`docs/`)

 | Target Location | Purpose & Contents | 
 | :--- | :--- | 
 | `docs/architecture/` | Architecture specs, system design, migration plan | 
 | `docs/api/` | Complete RESTful API overview and endpoint catalog | 
 | `docs/database/` | Database architecture and relational schema docs | 
 | `docs/ai/` | Matching engine, resume intelligence, prompt designs | 
 | `docs/security/` | Security model and privacy guidelines | 
 | `docs/deployment/` | Deployment guide (Local, Docker, Vercel/Cloud) | 
 | `docs/user-guides/` | Guides for Student, Recruiter, Admin/TPO | 
 | `docs/diagrams/` | 10 Mermaid architectural diagrams | 

### 2.6 Scripts & Infrastructure (`scripts/`, `infrastructure/`)

 | Target Location | Purpose & Contents | 
 | :--- | :--- | 
 | `scripts/setup/` | One-click environment bootstrap (`setup.sh`, `setup.ps1`) | 
 | `scripts/database/` | Migration and seeding execution scripts | 
 | `scripts/development/` | Concurrent frontend & backend dev runner | 
 | `scripts/testing/` | Comprehensive test runner | 
 | `infrastructure/docker/` | Dockerfiles for frontend and backend | 
 | `infrastructure/nginx/` | Nginx reverse proxy configuration | 
 | `docker-compose.yml` (root) | Multi-container composition (frontend, backend, db) | 
 | `Makefile` (root) | Developer shortcuts (`make setup`, `make dev`, `make test`, `make seed`) | 
 | `.github/workflows/` | CI workflow for linting, testing, and building | 

---

## 3. Step-by-Step Execution Sequence

1. **Step 1: Directory Scaffolding**: Create the target folder hierarchy (`backend/`, `database/`, `security/`, `authentication/`, `testing/`, `docs/`, `scripts/`, `infrastructure/`).
2. **Step 2: Database Migration**: Relocate and adapt schema, migration runner, seeders, and ERD into `database/` and `backend/app/core/database/`.
3. **Step 3: Backend Restructuring**: Migrate and modularize backend logic into `backend/app/{api, core, models, services, ai, middleware}`. Create clean `backend/app/server.js`.
4. **Step 4: Frontend Reorganization**: Structure `frontend/src/` into standard responsibility directories (`components`, `pages`, `layouts`, `hooks`, `services`, `api`, `student`, `recruiter`, `admin`, `jobs`, `applications`, `resume`, `matching`, `skills`).
5. **Step 5: Documentation & Artifacts**: Populate `docs/`, `security/`, `authentication/`, `testing/`, `scripts/`, and `infrastructure/`.
6. **Step 6: Root Configuration**: Update root `package.json`, `.env.example`, `docker-compose.yml`, `Makefile`, and create the comprehensive root `README.md`.
7. **Step 7: Import Fixes & Verification**: Validate all imports, execute database migrations and seeds, run automated backend and frontend tests, and test live server startup.
