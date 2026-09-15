# Master Architectural Diagrams (10 Mermaid Diagrams)

---

## 1. Overall System Architecture

```mermaid
graph TD
    User([Students, Recruiters, Admins])
    Frontend[Unified React 18 Frontend]
    Gateway[Nginx & Security Proxy]
    Backend[Layered Node.js/Express API]
    Matcher[Two-Way Matching Engine]
    DB[(Normalized Relational DB)]

    User --> Frontend
    Frontend --> Gateway
    Gateway --> Backend
    Backend --> Matcher
    Backend --> DB

```

---

## 2. Frontend / Backend Architecture

```mermaid
graph LR
    subgraph Frontend
        Views[Role Portals]
        Context[Auth Context]
        Client[Axios Client]
    end
    subgraph Backend
        Router[Express Routers]
        Auth[Auth & RBAC Middleware]
        Services[Domain Services]
        Repo[Data Repositories]
    end
    Views --> Context
    Views --> Client
    Client --> Router
    Router --> Auth
    Auth --> Services
    Services --> Repo

```

---

## 3. Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o| student_profiles : has
    users ||--o| recruiter_profiles : has
    companies ||--o{ recruiter_profiles : employs
    companies ||--o{ jobs : posts
    student_profiles ||--o{ student_skills : possesses
    skills ||--o{ student_skills : references
    jobs ||--o{ job_skills : requires
    skills ||--o{ job_skills : references
    student_profiles ||--o{ applications : submits
    jobs ||--o{ applications : receives
    applications ||--o{ application_status_history : tracks

```

---

## 4. Authentication Flow

```mermaid
sequenceDiagram
    Client->>API: POST /api/auth/login { email, password }
    API->>DB: Query user by email
    DB-->>API: User record
    API->>API: Verify password via bcrypt
    API->>API: Sign HS256 JWT
    API-->>Client: Return { accessToken, user }

```

---

## 5. Authorization & RBAC

```mermaid
graph TD
    Req[Incoming HTTP Request] --> CheckToken{Has Valid JWT?}
    CheckToken -- No --> Ret401[401 Unauthorized]
    CheckToken -- Yes --> CheckRole{Has Required Role?}
    CheckRole -- No --> Ret403[403 Forbidden]
    CheckRole -- Yes --> Controller[Execute Controller]

```

---

## 6. Resume Processing Lifecycle

```mermaid
flowchart TD
    RawFile[Resume Upload / Text] --> Parse[Deterministic Section Parser]
    Parse --> Extract[Extract Skills, Education, Exp]
    Extract --> Score[Calculate ATS Score & Diagnostic]
    Score --> Save[(Persist to DB)]
    Save --> Return[Return Diagnostic & Recommendations]

```

---

## 7. Two-Way Hybrid Matching Engine

```mermaid
graph TD
    Cand[Candidate Profile] --> Matcher[Hybrid Matching Engine]
    Job[Job Specification] --> Matcher
    Taxonomy[(Canonical Skill Taxonomy)] --> Matcher
    Matcher --> Weights["Apply Weights: 40% Skills, 20% Exp, 15% Edu, 10% Proj, 10% Loc, 5% Cert"]
    Weights --> FinalScore[Explainable Match Score 0-100%]

```

---

## 8. Student Job Recommendation Flow

```mermaid
sequenceDiagram
    Student->>API: GET /api/recommendations/jobs
    API->>DB: Fetch Active Published Jobs
    API->>Engine: Score Jobs against Student Profile
    Engine-->>API: Scored Job List
    API-->>Student: Return Top Ranked Jobs with Match Explanations

```

---

## 9. Recruiter Candidate Ranking Flow

```mermaid
sequenceDiagram
    Recruiter->>API: GET /api/matching/jobs/:jobId/candidates
    API->>DB: Fetch Applicants for Job
    API->>Engine: Calculate Match Breakdown per Applicant
    Engine-->>API: Ranked Candidate List
    API-->>Recruiter: Display Candidate Funnel Sorted by Score

```

---

## 10. Application Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Applied
    Applied --> UnderReview : Recruiter reviews
    UnderReview --> Shortlisted : Strong candidate
    UnderReview --> Rejected : Qualifications mismatch
    Shortlisted --> Interview : Schedule technical interview
    Interview --> Offer : Candidate selected
    Interview --> Rejected : Unsuccessful interview
    Offer --> [*]
    Rejected --> [*]

```
