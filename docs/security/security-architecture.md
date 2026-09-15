# Security Architecture: Defense-in-Depth

## 1. Multi-Tier Security Layers
1. **Network Layer**: Nginx reverse proxy, TLS termination, CORS origin validation, and rate limiting via `express-rate-limit`.
2. **Application Layer**: Helmet security headers, HTTP Parameter Pollution (HPP) defense, and XSS sanitization.
3. **Authentication Layer**: HS256 JWT tokens with 1-hour expiration; password hashing via `bcryptjs` with salt factor 10.
4. **Authorization Layer (RBAC + OLAC)**:
   - Server-side role enforcement: `requireRole(['RECRUITER'])`.
   - Object-Level Access Control: Recruiter can only inspect resumes of students who applied to their active jobs.
5. **Data Layer**: Parameterized SQL queries completely eliminate SQL injection risks.
