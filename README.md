# CareerCompass — Student Digital Career & Opportunity Platform

[![Node.js CI](https://github.com/anupmazumdar/CareerCompass/actions/workflows/ci.yml/badge.svg)](https://github.com/anupmazumdar/CareerCompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite%203-003B57.svg)](https://sqlite.org)

An enterprise-grade, student-centric **Digital Career Management Platform** designed to empower students and university placement cells with deterministic opportunity discovery, personalized skill gap intelligence, multi-resume management, and interactive application lifecycle tracking.

---

## 1. Platform Overview & Highlights

CareerCompass bridges the gap between academic graduation and high-impact technology careers:

* **Opportunity Discovery Engine:** 42+ curated, realistic opportunities spanning Internships, Full-Time Jobs, Hackathons, Scholarships, and Certified Courses across Remote, Hybrid, and Onsite modalities.
* **Deterministic Matching Score:** Transparent multi-factor algorithm weighting **Skills (50%)**, **Role Alignment (20%)**, **Location (15%)**, and **Work Mode (15%)** — giving students explicit score breakdowns.
* **Skill Gap Radar & Curated Resources:** Automatically compares student skill profiles against target opportunity requirements, linking directly to free, high-yield learning modules (YouTube, official documentation).
* **Multi-Resume Versioning:** Upload and tag multiple resume profiles (e.g. *Full-Stack Core*, *Data Science*, *Cloud DevOps*), dynamically choosing which version accompanies each application.
* **Interactive Application Kanban:** Visual 5-stage tracking (`saved` $\rightarrow$ `applied` $\rightarrow$ `interview` $\rightarrow$ `offer` $\rightarrow$ `rejected`), custom external application logging, note-taking, and interview reminder alerts.
* **AI Career Advisor:** Grounded career guidance powered by OpenRouter / Gemini or zero-cost local heuristics, recommending actionable upskilling roadmaps without hallucinated prerequisites.

---

## 2. System Architecture

```
                                  +-----------------------+
                                  |   Web Browser (SPA)   |
                                  | React 18 + TailwindCSS|
                                  +-----------------------+
                                              |
                          HTTP /api/*         | Static Assets
                                              v
                              +-------------------------------+
                              |    Vercel Monorepo Serverless |
                              |      (api/index.js Router)    |
                              +-------------------------------+
                                              |
                                              v
                              +-------------------------------+
                              |   Express.js Application Core |
                              |    RBAC Auth + Domain Routers |
                              +-------------------------------+
                                  |                       |
                                  v                       v
                      +----------------------+ +----------------------+
                      |  SQLite 3 Database   | | External AI Gateway  |
                      | (Auto-migrated &     | | (OpenRouter/Mistral/ |
                      |  Seeded on boot)     | |  Google Gemini)      |
                      +----------------------+ +----------------------+
```

### Monorepo Structure

```
CareerCompass/
├── api/                         # Vercel Serverless Function entry (api/index.js)
├── backend/                     # Express.js layered backend
│   ├── app/
│   │   ├── api/                 # Domain routes (auth, students, opportunities, applications, skills)
│   │   ├── core/                # Config, SQLite connection, security, rate limiters, logging
│   │   ├── models/              # Student, opportunity, application, and resume domain models
│   │   ├── repositories/        # SQL abstraction layer
│   │   ├── services/            # Matching engine, AI career advisor, ATS parser
│   │   └── server.js            # Express application bootstrap
│   └── tests/                   # Integration, unit, security, and e2e test suites
├── database/                    # Relational schema and seed data
│   ├── migrations/              # Incremental migration runner (migrate.js)
│   ├── schema/                  # Full relational DDL (schema.sql)
│   └── seeds/                   # 42+ opportunities & student seed generator (seed.js)
├── docs/                        # Technical & business documentation
│   ├── business/                # Business case & product strategy
│   ├── architecture/            # Architecture diagrams & contracts
│   └── security/                # Threat model and security policies
├── frontend/                    # React 18 single-page application
│   ├── src/
│   │   ├── api/                 # Unified client with JWT injection (client.js)
│   │   ├── auth/                # AuthContext single source & ProtectedRoute guard
│   │   ├── student/             # Student Digital Career suite (Dashboard, Opportunities, Kanban, Skills, Advisor, Profile)
│   │   └── pages/               # Landing, Privacy Policy, Terms
├── scripts/setup/               # Cross-platform environment bootstrap scripts (setup.sh / setup.ps1)
├── vercel.json                  # Monorepo serverless deployment specification
└── VERCEL_DEPLOYMENT.md         # Step-by-step production cloud deployment guide
```

---

## 3. Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **npm**: v9.x or later

### Automated Setup (Recommended)

Run the single-command platform setup to install all workspace dependencies, run database migrations, and seed sample opportunities:

**On Linux / macOS:**
```bash
chmod +x scripts/setup/setup.sh
./scripts/setup/setup.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\setup\setup.ps1
```

### Manual Setup

1. **Install Dependencies:**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

2. **Configure Environment:**
   Create `.env` at the root of the repository:
   ```env
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=super_secure_development_secret_min_32_characters_long!
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
   ```

3. **Migrate & Seed Database:**
   ```bash
   node database/migrations/migrate.js
   node database/seeds/seed.js
   ```

4. **Start Development Servers:**
   Run both backend and frontend concurrently from root:
   ```bash
   npm run dev
   ```
   - **Frontend App:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 4. Default Demo Credentials

The seed generator prepares out-of-the-box demo accounts for testing:

| Role | Email | Password | Pre-seeded Context |
|---|---|---|---|
| **Student** | `student@careercompass.io` | `Password@123` | Alex Chen (MCA), 8 Skills, 1 Resume, 1 Active Goal |
| **Recruiter**| `recruiter@razorpay.com` | `Password@123` | Razorpay Hiring Lead |
| **Recruiter**| `recruiter@microsoft.com` | `Password@123` | Microsoft Cloud Recruiter |

*Note: For production deployments, superadmin accounts are seeded exclusively via private environment variables (`SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD`).*

---

## 5. Testing & Verification

The platform maintains 100% automated test coverage across unit, integration, and security gates:

```bash
# Run all backend test suites (ephemeral DB isolation)
cd backend
npm test

# Run frontend test suite
cd ../frontend
npm test -- --watchAll=false

# Validate production bundle
npm run build
```

---

## 6. Vercel Cloud Deployment

CareerCompass is pre-configured for instant zero-configuration deployment to [Vercel](https://vercel.com):

1. Connect your GitHub repository to Vercel.
2. Ensure Root Directory is set to `./` (root).
3. Set environment variables in Vercel Project Settings:
   - `JWT_SECRET` (at least 32 characters)
   - `NODE_ENV=production`
   - `OPENROUTER_API_KEY` (optional, for cloud AI features)
4. Deploy. Vercel automatically builds the React SPA and serves `/api/*` requests through the serverless function in `api/index.js`.
5. For complete instructions, review [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

---

## 7. License

Distributed under the MIT License. See `LICENSE` for more information.
