# Database Management & Migrations

This directory contains the database schema, migration runners, initial taxonomy seeds, test fixtures, and ER diagrams for the unified TalentAI Career Platform.

---

## Directory Structure

```text
database/
├── schema/
│   └── schema.sql         # Canonical DDL schema for SQLite and PostgreSQL
├── migrations/
│   └── migrate.js         # Migration executor
├── seeds/
│   └── seed.js            # Initial taxonomy, demo accounts, and jobs seeder
├── fixtures/
│   └── sample_resume.txt  # Test fixtures for parsers and evaluation
├── ERD/
│   └── database-erd.md    # Mermaid ERD and data dictionary
└── README.md
```

---

## Commands

To initialize or reset the database:

```bash
# Run migrations (creates tables and indexes)
npm run db:migrate

# Seed Skill Taxonomy and demo accounts
npm run db:seed
```

---

## What Belongs Here
- DDL schema files (`.sql`)
- Database migration runners
- Seed data and taxonomy datasets
- Database documentation and ER diagrams
- Test database fixtures

## What Does NOT Belong Here
- ORM / query implementation code (lives in `backend/app/models/` and `backend/app/repositories/`)
- Secret credentials or production database backups
