# TalentAI Frontend Web Application (`frontend/`)

## Purpose

The single-page web client for the **Unified TalentAI Career & Recruitment Platform**. Built with React 18, React Router v6, Tailwind CSS, and Lucide React. It provides unified, role-tailored user interfaces for Students, Recruiters, and Admins/TPOs.

---

## Directory Organization

```text
frontend/
├── public/                    # Static web assets, favicon, index.html
├── src/
│   ├── components/            # Shared UI primitives (Navbar, SupportChatbot, Modals, Buttons)
│   ├── pages/                 # Public top-level pages (Home, Privacy, Terms, GlobeDemo)
│   ├── layouts/               # Responsive layout wrappers (AppLayout)
│   ├── hooks/                 # Custom React hooks (useAuth, useDebounce)
│   ├── services/              # Frontend API call services & storage persistence
│   ├── api/                   # Centralized Axios/fetch client with Bearer token interceptor
│   ├── auth/                  # AuthContext, ProtectedRoute guards, session management
│   ├── student/               # Student workspace (StudentDashboard, Profile, Education)
│   ├── recruiter/             # Recruiter workspace (RecruiterDashboard, CandidateRanking)
│   ├── admin/                 # TPO Admin workspace (AdminDashboard, Governance)
│   ├── jobs/                  # Job board, search filters, and detail views
│   ├── applications/          # Application tracker and status timeline
│   ├── resume/                # ATS diagnostic, resume intelligence & feedback
│   ├── matching/              # Match score badges and visual breakdown
│   ├── skills/                # Skill badge lists and selector components
│   ├── notifications/         # In-app notification center and alert banners
│   ├── utils/                 # Formatting and UI helper utilities
│   ├── types/                 # Shared frontend domain enums and constants
│   ├── config/                # Environment and endpoint configurations
│   ├── App.js                 # Universal declarative React Router v6 definitions
│   ├── index.js               # Application bootstrap
│   └── index.css              # Tailwind CSS and global styling tokens
│
├── tests/                     # Frontend testing suites
│   ├── unit/                  # Component and utility unit tests
│   ├── integration/           # Navigation and authentication flow tests
│   └── e2e/                   # User journey simulations
├── package.json
└── README.md

```

---

## What Belongs Here

* All client-side UI components, views, pages, and interactive layouts.
* Client-side routing, navigation guards, and role-based route protections.
* Client state management (`AuthContext`, local storage sync).
* Component unit, integration, and UI tests.

## What Does NOT Belong Here

* Backend server logic, Express route controllers, and direct database queries (belongs in `backend/`).
* Private API keys, JWT secret keys, or database credentials (belongs in `.env`).
* Database migration DDL or seeds (belongs in `database/`).

---

## Important Dependencies

* `react`, `react-dom` (v18)
* `react-router-dom` (v6)
* `tailwindcss` & `postcss`
* `lucide-react` (icons)
* `@testing-library/react` and `@testing-library/jest-dom`

---

## How to Work With This Folder

```bash

# 1. Install dependencies

npm install

# 2. Start local development server (http://localhost:3000)

npm start

# 3. Run automated tests non-interactively

npm test -- --watchAll=false

# 4. Build production static bundle

npm run build

```
