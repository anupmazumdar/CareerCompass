# Module Architecture & Responsibility Layering

## 1. Monorepo Domain Organization

The monorepo enforces strict separation of concerns across layers:

```text
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   frontend/src/pages/  &  frontend/src/components/     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────▼────────────────────────────┐
│                    API Routing Layer                   │
│                 backend/app/api/*/routes.js            │
└───────────────────────────┬────────────────────────────┘
                            │ Controller Calls
┌───────────────────────────▼────────────────────────────┐
│                  Business Services Layer               │
│               backend/app/services/*/service.js        │
└───────────────────────────┬────────────────────────────┘
                            │ Data Access Calls
┌───────────────────────────▼────────────────────────────┐
│                 Data Repository Layer                  │
│             backend/app/repositories/*Repository.js     │
└───────────────────────────┬────────────────────────────┘
                            │ Parameterized SQL
┌───────────────────────────▼────────────────────────────┐
│                   Database Engine                      │
│                  database/schema/schema.sql            │
└────────────────────────────────────────────────────────┘
```

## 2. Cross-Cutting Concerns Layer (`backend/app/core/`)
- `authentication/`: Token generation, validation, and bcrypt hashing.
- `authorization/`: Declarative role requirements and Object-Level Access Control (OLAC).
- `security/`: Rate limiting, XSS filtering, and Helmet security headers.
- `logging/`: Winston structured logger.
- `exceptions/`: Universal error envelope formatting.
