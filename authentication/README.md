# Authentication Architecture & Flows (`authentication/`)

## Purpose
This directory contains architectural specifications, sequence flows, and sequence diagrams for the Unified TalentAI Platform authentication and authorization system.

## Directory Structure
```
authentication/
├── documentation/
│   └── jwt-rbac-authentication.md       # Token mechanics, hashing, role boundaries
├── flows/
│   └── auth-sequence-flows.md           # Registration, login, token refresh flows
├── diagrams/
│   └── auth-architecture-diagram.md     # Mermaid visual architecture
└── README.md
```

## Implementation Boundary
- **Documentation & Flows**: Maintained in this directory (`authentication/`).
- **Actual Runtime Implementation**:
  - `backend/app/core/authentication/`: Registration, login, password hashing, token issue and verification.
  - `backend/app/core/authorization/`: Role-Based Access Control (RBAC) and Object-Level Access Control (OLAC) guards.
  - `frontend/src/auth/`: React AuthContext, ProtectedRoute guards, session persistence.
