# CareerPath: Digital Career & Placement Platform for Students
## MCA Final Year Academic System Architecture & Engineering Report

---

### Executive Summary & Academic Scope

**CareerPath** is a production-grade, full-stack digital career ecosystem engineered specifically for MCA (Master of Computer Applications) and Computer Science students. The platform bridges the divide between academic student preparations and enterprise campus recruitment by providing:

1. **Rich Student Profiles**: Structured multi-degree academic histories, verified skill inventories with proficiency ratings, full-stack project portfolios, certifications, ATS-optimized resume upload with binary magic-byte validation, and an automated profile completeness score.
2. **Opportunity Discovery & Multi-Factor Matching**: A multi-attribute weighted matching engine evaluating skill overlap (45%), experience (20%), education (15%), project portfolio (10%), location preferences (5%), and certifications (5%) against curated internships and job openings.
3. **Application Tracking Pipeline & Timeline**: An end-to-end recruitment pipeline (`Saved / Wishlist` $\rightarrow$ `Applied` $\rightarrow$ `In Review / Screening` $\rightarrow$ `Interview Scheduled` $\rightarrow$ `Offer / Selected` / `Rejected` / `Withdrawn`) backed by an immutable audit trail and private interview preparation notes with reminder dates.
4. **Skills Management & Target Role Gap Analysis**: Target role benchmark diagnostics (Full-Stack, Backend, Frontend, AI/Data Science, DevOps) identifying critical missing competencies and mapping them directly to curated, free masterclasses.
5. **Grounded AI Career Advisor**: An intelligent, multi-turn AI mentor proxying high-capability OpenRouter free models with an automatic fallback chain, strict profile context grounding, low temperature (0.2), and an ephemeral in-memory session boundary.
6. **Placement Analytics & Institutional Readiness**: Application funnel visualization, skill distribution analytics, and institutional compliance reporting.

Companion Architecture: While operating standalone with zero recruiter dependencies, CareerPath is designed with standardized relational schemas and decoupled UUID contracts to seamlessly interoperate with the companion **TalentAI Recruiter Platform**.

---

### 1. System Architecture

CareerPath employs a layered, modular client-server architecture:

```
+-----------------------------------------------------------------------------------+
|                           PRESENTATION TIER (React 19)                            |
|  - Light-First Primary UI System (Deep Slate, Warm Slate, Indigo Accents)         |
|  - Circular SVG Completeness Ring & Radial Skill Gap Gauges                       |
|  - Multi-Column Kanban Board & Responsive Tabular List Views                      |
|  - In-Memory Grounded AI Chat Assistant (Clean Slate on Page Refresh)             |
+-----------------------------------------+-----------------------------------------+
                                          | REST JSON API (HTTP/1.1 over TLS)
                                          v
+-----------------------------------------------------------------------------------+
|                            APPLICATION TIER (Node/Express)                        |
|  - Authentication & Token Rotation: JWT (15m access) + httpOnly Refresh Cookie     |
|  - Server-Side Schema Validation: Zod (studentSchemas, applicationSchemas)         |
|  - Enterprise Security Middleware: Helmet, CORS, XSS clean, Rate Limiting         |
|  - Object-Level Access Control (OLAC): IDOR defenses on candidate profiles       |
+-----------------------------------------+-----------------------------------------+
       |                                  |                                   |
       v                                  v                                   v
+-----------------------+    +--------------------------+    +----------------------+
|  AI MATCHING ENGINE   |    |  OPENROUTER AI GATEWAY   |    | RESUME PARSER GATEWAY|
|  - Weighted Multi-    |    |  - Free-Tier Model Chain |    | - Double Validation  |
|    Attribute Scoring  |    |    (Gemma-4-31B, Nemotron|    |   (MIME + 0x25504446)|
|  - Gap Diagnostics    |    |     Gemma-4-26B, Nex-N2) |    | - Auto Skill Extract |
|  - Role Benchmarks    |    |  - Local Grounded Engine |    | - Dual PDF-Parse v2  |
+-----------------------+    +--------------------------+    +----------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             DATA TIER (Relational Engine)                         |
|  - Primary Development/Evaluation Engine: SQLite 3 with Foreign Keys & Check Constr|
|  - Cloud Staging / Production Engine: PostgreSQL 16 (Neon Serverless compatible)  |
|  - Fully Normalized 3NF Relational Tables with Cascading Constraints & Indexes    |
+-----------------------------------------------------------------------------------+
```

---

### 2. Relational Database Schema & Data Dictionary

The schema strictly adheres to third normal form (3NF) and enforces referential integrity across 15 core entities:

#### Key Relational Tables:
1. `users`: Authentication credentials, bcrypt hash, role check (`student`, `recruiter`, `admin`), audit timestamps.
2. `student_profiles`: 1:1 extension of user record holding bio, headline, links (GitHub, LinkedIn, Portfolio), preferred role, and visibility flag.
3. `student_education`: 1:N academic history tracking degrees (BCA, MCA, B.Tech), institutions, graduation years, and CGPA.
4. `student_skills`: M:N association between students and canonical skills, storing proficiency level (`beginner`, `intermediate`, `expert`) and acquisition source.
5. `student_projects`: Project portfolios with title, description, JSON array of tech stacks, and repository links.
6. `student_certifications`: Verified credentials with issuing authority, dates, credential URLs, and verification IDs.
7. `skills` & `skill_categories`: Canonical skill taxonomy with hierarchy support and aliases.
8. `jobs` / `opportunities`: Campus openings, required skills, employment types, salary brackets, and deadlines.
9. `applications`: Tracks student applications across statuses (`saved`, `applied`, `under_review`, `shortlisted`, `interview`, `selected`, `rejected`, `withdrawn`). Enforces `UNIQUE(job_id, student_id)`.
10. `application_status_history`: Immutable audit trail of every status transition with user attribution and transition notes.
11. `application_notes`: Student private interview preparation notes, follow-up deadlines, and reminder dates.
12. `match_scores`: Computed multi-factor match breakdowns (skill, experience, education, project, location, certification scores) with JSON arrays of matched vs missing skills.
13. `learning_resources`: Curated free masterclasses and documentation mapped to roles and gap areas.

---

### 3. Unified Matching Engine Mathematical Formula

The opportunity matching algorithm computes a holistic compatibility index between a student's profile ($P$) and a job opening ($J$):

$$\text{Final Match Score} = (0.45 \cdot S_{\text{skills}}) + (0.20 \cdot S_{\text{exp}}) + (0.15 \cdot S_{\text{edu}}) + (0.10 \cdot S_{\text{proj}}) + (0.05 \cdot S_{\text{loc}}) + (0.05 \cdot S_{\text{cert}})$$

#### Factor Decomposition:
1. **Skill Match Score ($S_{\text{skills}}$)**:
   $$\frac{\sum_{s \in \text{Matched}} W_s \cdot M_s}{\sum_{s \in \text{Required}} W_s} \times 100$$
   Where $W_s$ is the skill importance weight (Required = 1.0, Nice-to-have = 0.5) and $M_s$ is the proficiency multiplier ($\text{Beginner} = 0.60$, $\text{Intermediate} = 0.85$, $\text{Expert} = 1.0$).
2. **Experience Score ($S_{\text{exp}}$)**: Ratio of student's completed internship/work months to the minimum required experience (capped at 100%).
3. **Education Score ($S_{\text{edu}}$)**: Degree level alignment (e.g. MCA/M.Tech matches Master's criteria at 100%, Bachelor's at 80%).
4. **Project Score ($S_{\text{proj}}$)**: Relevance of student project technology tags to the job's core tech stack.
5. **Location Score ($S_{\text{loc}}$)**: Exact city match or Remote/Hybrid flexibility yields 100%; alternative regional hubs yield 60%.
6. **Certification Score ($S_{\text{cert}}$)**: Relevant industry certifications (AWS, Oracle, Kubernetes, etc.) boost candidate standing.

---

### 4. Grounded AI Architecture & Multi-Model Fallback

CareerPath incorporates an autonomous AI Career Advisor designed for high availability and zero hallucination:

```
Student Chat Query
       |
       v
+-----------------------------------------------------------+
|               Grounded Context Assembler                  |
| - Resolves verified skills & proficiencies                |
| - Formats academic history & CGPA                         |
| - Extracts project tech stacks & descriptions             |
| - Injects active application pipeline & interview statuses|
+-----------------------------------------------------------+
       |
       v  (System Prompt + History at Temperature = 0.2)
+-----------------------------------------------------------+
|              OpenRouter Multi-Model Fallback Chain        |
|                                                           |
| 1. google/gemma-4-31b-it:free (Primary - 30.7B Dense)     |
|       | (if 429/503/timeout)                              |
|       v                                                   |
| 2. nvidia/nemotron-3-super-120b-a12b:free (120B MoE)      |
|       |                                                   |
|       v                                                   |
| 3. google/gemma-4-26b-a4b-it:free (25.2B MoE)             |
|       |                                                   |
|       v                                                   |
| 4. nex-agi/nex-n2.5-pro:free (262K context)               |
|       |                                                   |
|       v                                                   |
| 5. nvidia/nemotron-3-ultra-550b-a55b:free (1M context)    |
|       |                                                   |
|       v                                                   |
| 6. openrouter/free (Dynamic load-balancing router)        |
|       |                                                   |
|       v (if all upstream models congested / offline)      |
| 7. careerpath-grounded-engine (Local Grounded Engine)     |
+-----------------------------------------------------------+
       |
       v
Markdown Advice Returned to Student
```

#### Session Boundary Integrity:
Modern browsers retain `sessionStorage` across soft reloads (`F5`). To enforce the academic requirement that a student may refresh the page to obtain an immediate clean slate conversation, the active message thread is stored in pure React component state (`useState`). The student can also click "New Session" at any time to clear conversation memory while preserving profile grounding.

---

### 5. Security & Defense-in-Depth Posture

CareerPath adheres to strict OWASP Top 10 defenses:

| Defense Vector | Implementation Mechanism | Purpose |
| :--- | :--- | :--- |
| **Password Storage** | Bcrypt with 12 salt rounds | Prevents rainbow table and GPU dictionary attacks |
| **Token Architecture** | JWT (15m access) + httpOnly, Secure, SameSite=Strict cookie | Neutralizes XSS access token theft and CSRF exploits |
| **Input Validation** | Server-side Zod schemas (`studentSchemas.js`, `applicationSchemas.js`) | Rejects malformed types, overlong strings, and illegal enums |
| **File Upload Security** | Double validation: MIME type + binary magic bytes (`0x25 0x50 0x44 0x46`) | Prevents malicious executable or polyglot files disguised as `.pdf` |
| **Database Injection** | Parameterized prepared statements (`?` place holders) | 100% immune to SQL injection attacks |
| **Object Authorization** | OLAC / IDOR middleware (`verifyCandidateAccess`) | Prevents Student A from viewing, editing, or adding notes to Student B's applications |
| **Rate Limiting** | Tiered `express-rate-limit` (auth, admin, global) | Mitigates brute-force credential stuffing and DoS flooding |

---

### 6. Companion Interoperability with TalentAI

CareerPath is engineered for independent execution during viva evaluation while maintaining seamless, loose coupling with the recruiter-facing TalentAI platform:

1. **Shared Database / Foreign Key Harmony**:
   - Both platforms connect to the same relational tables (`jobs`, `companies`, `applications`, `match_scores`, `skills`).
2. **Unified Status Lifecycle**:
   - `saved` (Student Wishlist) $\rightarrow$ `applied` (Candidate Submits) $\rightarrow$ `under_review` (Recruiter Reviews) $\rightarrow$ `shortlisted` $\rightarrow$ `interview` (Interview Scheduled) $\rightarrow$ `selected` (Offer Extended) / `rejected` / `withdrawn`.
3. **Decoupled API Boundaries**:
   - Students interact strictly with `/api/students/*`, `/api/applications/*`, `/api/skills/*`, and `/api/ai/*`.
   - Recruiters interact with `/api/recruiters/*`, `/api/candidates/*`, and `/api/jobs/*`.
   - Modifying student frontend logic has zero impact on recruiter operations.

---

### 7. Viva & Academic Defense Demonstration Walkthrough

When presenting this MCA project to professors and external examiners, follow this recommended 5-stage demonstration:

1. **Stage 1 — Registration & Profile Completeness Ring**:
   - Register a new student account (`new.student@careerpath.edu`).
   - Demonstrate the dynamic circular SVG completeness score increasing as education, skills, and projects are added.
   - Upload a sample PDF resume and show automatic magic-byte validation and skill extraction.
2. **Stage 2 — Opportunity Discovery & Multi-Factor Matching**:
   - Browse the 15 enterprise opportunities (Razorpay, Swiggy, Microsoft, etc.).
   - Demonstrate real-time search, employment type filters, and minimum match threshold sliders.
   - Open the "Match Breakdown" modal to demonstrate the 6-factor mathematical calculation.
3. **Stage 3 — Application Tracking & Pipeline Timeline**:
   - Save a job to wishlist (demonstrates status `'saved'`).
   - Add a private interview preparation note with a reminder date.
   - Submit the full application (promotes `'saved'` to `'applied'`).
   - Switch between **Kanban Board** and **Tabular List View**.
   - Inspect the immutable audit history stepper showing timestamps and actor attribution.
4. **Stage 4 — Skills Management & Target Role Gap Analysis**:
   - Navigate to `/skills` and select a target role (e.g. "Backend Engineer").
   - Demonstrate the radial readiness gauge and the breakdown of critical vs recommended skill gaps.
   - Click a curated free masterclass card (launches direct YouTube/documentation tutorial).
   - Click "Learned it" to immediately add the missing skill and watch the readiness score recalculate.
5. **Stage 5 — Grounded AI Career Assistant**:
   - Navigate to `/assistant` and select a quick prompt chip (e.g. "How can I improve my match score?").
   - Highlight the grounding badge verifying that the student's actual skills and active applications were injected into the system prompt.
   - Press `F5` (refresh) to demonstrate the in-memory session boundary reset.

---

### 8. Verification & Test Evidence

All components have been rigorously verified through automated integration test suites:

- `test_careerpath_auth_profile.js`: 10/10 tests passed (Bcrypt 12, JWT cookies, completeness ring, Zod validation).
- `test_careerpath_opportunity_matching.js`: 7/7 tests passed (Weighted matching engine, pagination, filters).
- `test_careerpath_application_tracking.js`: 11/11 tests passed (Idempotency, notes, timeline audit, IDOR defenses).
- `test_careerpath_skills_gap.js`: 7/7 tests passed (5 target roles, gap analysis, 22 curated resources).
- `test_careerpath_ai_assistant.js`: 5/5 tests passed (Multi-model fallback chain, grounding context, RBAC).
- `frontend build`: React 19 production build compiled successfully with 0 errors.

**Project Status: PRODUCTION READY FOR MCA ACADEMIC EVALUATION**
