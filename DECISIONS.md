# CareerPath Architecture & Engineering Decision Log (DECISIONS.md)

This document tracks all critical architectural, security, database, and AI gateway decisions made during the design and implementation of **CareerPath** — an MCA production-grade Digital Career Platform for Students.

---

## Decision Index

 | ID | Topic | Decision | Status | Rationale Summary | 
 | --- | --- | --- | --- | --- | 
 | **DEC-001** | Database Selection | SQLite Relational Engine with parameterized SQL abstraction & PostgreSQL DDL compatibility | **IMPLEMENTED** | Relational integrity for applications, student profiles, opportunities, and skills; zero-config local/test execution. | 
 | **DEC-002** | Zero-Friction Setup | Automated cold-start migration & comprehensive 42+ opportunity seed runner | **IMPLEMENTED** | Evaluator and developer zero-setup experience; automatic ephemeral DB in tests. | 
 | **DEC-003** | Auth & Token Storage | Single-source JWT authentication via `AuthContext` with role-based route guards & bcryptjs (salt=12) | **IMPLEMENTED** | Prevents fragmented token storage, guards all student routes, and ensures authenticated API requests. | 
 | **DEC-004** | AI Chat State Boundary | React In-Memory State as primary (Page refresh = clean conversation) | **IMPLEMENTED** | Guarantees requested clean-slate refresh while grounding assistant prompts in student profile data. | 
 | **DEC-005** | AI Gateway & Fallback | OpenRouter API with local heuristic career advisor fallback | **IMPLEMENTED** | High-availability career guidance without blocking UI when external AI keys are unavailable. | 
 | **DEC-006** | File Storage & Resume Security | In-Memory buffer upload with MIME + Magic-Bytes validation (`%PDF-`, `PK\x03\x04`), 5MB cap, and relational DB metadata | **IMPLEMENTED** | Validates binary signatures before parsing text and ATS analysis; prevents arbitrary file execution. | 
 | **DEC-007** | Platform Interoperability | Decoupled relational schemas and standardized status enums (`saved`, `applied`, `interview`, `offer`, `rejected`) | **IMPLEMENTED** | Clean separation of concerns between student discovery and recruiter candidate tracking. | 
 | **DEC-008** | Visual Design System | Intentional Light-First palette (Deep Slate, Bright Indigo, Emerald accents, responsive navigation) | **IMPLEMENTED** | Professional, accessible design tailored for academic excellence and student ergonomics. | 

---

## Detailed Decision Records

### DEC-001: Database Selection & Query Parameterization

* **Context**: The platform requires complex relational queries: multi-degree education histories, skill proficiency matrices, opportunity filtering with skill overlap, multi-stage application timelines, and cohort analytics.
* **Options Considered**:
  1. MongoDB / Document Store: Easy to start, but lacks foreign key referential integrity and makes application status consistency prone to data anomalies.
  2. PostgreSQL with Prisma: High abstraction, but heavy runtime and engine binaries.
  3. PostgreSQL with `pg` Pool & Parameterized SQL: Maximum control, zero risk of SQL injection, fast execution, transparent migrations.
* **Decision**: PostgreSQL with parameterized queries via `pg` pool.
* **Trade-off**: Requires writing explicit migration scripts and repository classes, but provides true production rigor, explicit indexing, and complete ACID guarantees.

---

### DEC-002: Zero-Friction Evaluator Database Experience

* **Context**: MCA academic evaluators may test the project on machines without PostgreSQL installed.
* **Decision**: Support both a pre-configured Neon Cloud PostgreSQL connection (via `DATABASE_URL`) and an optional `docker-compose.yml` (`postgres:16-alpine`) for local offline running.
* **Rationale**: Academic evaluators can run the system immediately without configuring a local Postgres service, while still running against genuine PostgreSQL.

---

### DEC-003: Authentication & Security Architecture

* **Context**: Web storage (`localStorage` / `sessionStorage`) is vulnerable to Cross-Site Scripting (XSS). Storing raw JWTs in `localStorage` allows any injected script to steal the session.
* **Decision**:
  * Access Token: 15-minute lifespan, held in React application memory.
  * Refresh Token: 7-day lifespan, stored in an `httpOnly`, `Secure`, `SameSite=Strict` cookie, mapped to a hashed database record in `refresh_tokens`.
  * Token Rotation: Single-use refresh token; reuse detection immediately revokes all tokens for that user family.
  * Password Hashing: `bcryptjs` with salt rounds = 12.

---

### DEC-004: AI Chat Session Lifecycle & State Isolation

* **Context**: Requirement specifies that a page refresh must start a clean conversation and never show ghost/stale messages.
* **Finding**: In modern browsers, `window.sessionStorage` persists across browser refreshes (`F5` or `Cmd+R`) within the same tab, only clearing when the tab is closed.
* **Decision**: Chat messages live strictly in React in-memory state (`useState` / context) by default. A page refresh naturally resets the state to an empty conversation. If persistence is desired, it will be an explicit opt-in button ("Resume Previous Session") saved in encrypted sessionStorage.
* **Grounding**: The AI prompt is systematically injected with the student's authenticated profile (skills, projects, education) and active application list. The model prompt enforces low temperature (0.2) and instructs the model to explicitly state "I don't have that information in your profile" rather than speculating.

---

### DEC-005: OpenRouter Live Catalog Selection & Fallback Logic

* **Context**: OpenRouter's free-tier models change dynamically. Free models must be capable of multi-turn reasoning, instruction following, and structured grounding.
* **Live Catalog Findings (September 2026)**:
  * Total free models available: 23.
  * Selected Ranked Fallback Chain:
    1. `google/gemma-4-31b-it:free` (Primary — 30.7B dense, 256K ctx, tool use, strong career instruction-following)
    2. `nvidia/nemotron-3-super-120b-a12b:free` (Secondary — 120B MoE, 256K ctx, complex orchestration)
    3. `google/gemma-4-26b-a4b-it:free` (Tertiary — 25.2B MoE, 256K ctx, fast response)
    4. `nex-agi/nex-n2.5-pro:free` (Quaternary — 262K ctx, agentic multi-turn reasoning)
    5. `openrouter/free` (Ultimate Fallback — dynamic multi-model router)
* **Error Discrimination**:
  * Upstream 429 / 503 (model provider busy) $\rightarrow$ Transparent retry with next model in chain.
  * Account-level 429 / 402 (daily OpenRouter limit reached) $\rightarrow$ Inform student honestly without wasting RPM.

---

### DEC-006: Resume Upload & Cloud Storage Security

* **Context**: Resumes and portfolios must be validated before storage to prevent malicious binary execution.
* **Decision**:
  * File size cap: 5 MB.
  * Double validation: Validate both HTTP MIME type (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) AND inspect file magic bytes (e.g., `%PDF-` header `0x25 0x50 0x44 0x46`).
  * Storage: Google Cloud Storage (GCS) or AWS S3 private bucket, generating time-limited signed URLs for viewing. Binary blobs are never stored in PostgreSQL.

---

### DEC-007: Decoupled Interoperability with TalentAI

* **Context**: TalentAI is a companion recruiter-facing platform. CareerPath must remain fully independent while maintaining clean interoperability potential.
* **Decision**:
  * Primary keys use UUIDv4 strings.
  * Opportunity and Application schemas adhere to universal recruitment contracts (`applied`, `screening`, `interview`, `offer`, `rejected`).
  * Candidate profile exports a standardized JSON DTO that can be consumed by TalentAI or any ATS.

---

### DEC-008: UI Design System & Aesthetic Direction

* **Context**: Academic career platform requiring professional credibility, high readability, and inviting aesthetics.
* **Decision**: Light theme primary. Warm slate background (`#F8FAFC`), crisp white surface cards (`#FFFFFF`), deep charcoal typography (`#0F172A`), indigo accent (`#4F46E5`), and emerald success accents (`#10B981`).
* **Ergonomics**: Generous whitespace (8px grid), visual progress rings for profile completeness and skill match, and clean zero-clutter dashboard cards.
