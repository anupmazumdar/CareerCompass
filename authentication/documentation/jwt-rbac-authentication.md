# Unified Authentication & RBAC Documentation

**Platform**: Unified TalentAI Career Platform
**Implementation Location**: `backend/app/core/authentication/` and `backend/app/core/authorization/`

---

## 1. Authentication Architecture Overview

The platform uses a unified, single authentication system for all three platform roles:

1. `STUDENT`
2. `RECRUITER`
3. `ADMIN` (and Training & Placement Officers)

Every account resides in the central `users` table:

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('STUDENT', 'RECRUITER', 'ADMIN')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    is_verified INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

---

## 2. Token Lifecycle

* **Access Tokens**: Short-lived JSON Web Tokens (1 hour expiry) signed with `JWT_SECRET` via HS256 algorithm. Contains payload `{ userId, email, role }`.
* **Refresh Tokens**: Cryptographically random strings (7 day expiry) stored in HTTP-only cookies or database session table for rotation.
* **Password Hashing**: Passwords are never stored in plaintext; hashed using `bcryptjs` with salt work factor 10.
* **Role Enforcement**: Decoupled from authentication. Authentication verifies identity (`verifyToken`); Authorization verifies role permission (`requireRole`).
