# System Architecture: Unified TalentAI Career Platform

**Platform**: Unified TalentAI Career & Recruitment Platform  
**Architecture Classification**: Modular Monorepo with Clean Layered Domains

---

## 1. High-Level Architectural Vision

TalentAI connects students, recruiters, and academic administrators into a single unified platform. Rather than running disconnected applications, the platform shares:
- **One Frontend**: A modern, responsive React 18 Single Page Application with role-based routing.
- **One Backend**: A layered Node.js / Express API service with an optional Python ML service.
- **One Relational Database**: SQLite for local zero-config development/demo and PostgreSQL for cloud production.
- **One Unified Auth System**: JWT-based authentication with decoupled Role-Based Access Control (RBAC).
- **One Two-Way Matching Engine**: Deterministic hybrid scoring algorithm serving both candidate ranking and job recommendations.

```mermaid
graph TD
    subgraph ClientLayer ["Frontend (React 18 Single Page App)"]
        StudentUI["Student Portal (/student)"]
        RecruiterUI["Recruiter Portal (/recruiter)"]
        AdminUI["Admin / TPO Portal (/admin)"]
        SharedUI["Shared Components & Design Tokens"]
    end

    subgraph Gateway ["Reverse Proxy & Network Gateway"]
        Nginx["Nginx Reverse Proxy / Port 80"]
        RateLimiter["Rate Limiting & Helmet Guard"]
    end

    subgraph BackendAPI ["Unified Backend (Express Layered Monolith)"]
        AuthController["Auth & RBAC Controllers"]
        JobController["Job & Application Controllers"]
        MatchingController["Matching Engine Controller"]
        ResumeController["Resume Intelligence Controller"]
    end

    subgraph CoreLayers ["Core Domain & Services"]
        DomainServices["Domain Services (Student, Recruiter, Jobs)"]
        DeterministicMatcher["Hybrid Explainable Matcher (40/20/15/10/10/5)"]
        ATSParser["Deterministic Resume Parser & ATS Analyzer"]
    end

    subgraph DataLayer ["Data Persistence"]
        RelationalDB[("SQLite (Dev) / PostgreSQL (Prod)")]
        SkillTaxonomy[("Canonical Skill Graph (18 Tables)")]
    end

    ClientLayer --> Gateway
    Gateway --> BackendAPI
    BackendAPI --> CoreLayers
    CoreLayers --> DataLayer
```
