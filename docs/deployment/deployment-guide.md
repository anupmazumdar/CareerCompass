# Platform Deployment Guide

## 1. Local Development

```bash

# 1. Setup environment

npm run setup   # or ./scripts/setup/setup.ps1

# 2. Start frontend and backend concurrently

npm run dev

```

## 2. Docker Container Deployment

```bash

# Build and run multi-container stack

docker-compose up --build -d

```

* Frontend accessible at: `http://localhost:3000` (or `http://localhost` in production)
* Backend API accessible at: `http://localhost:5000`

## 3. Production Cloud Deployment

* **Database**: Managed PostgreSQL (e.g. Neon, Supabase, Cloud SQL) via `DATABASE_URL`.
* **Backend API**: Containerized deployment on Cloud Run, Render, or AWS ECS.
* **Frontend SPA**: Static asset CDN deployment on Vercel, Netlify, or Cloudflare Pages.
