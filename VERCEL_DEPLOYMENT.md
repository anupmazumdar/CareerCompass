# Vercel Deployment Guide

CareerCompass is configured for unified monorepo deployment on Vercel:
- **Frontend SPA**: Built from `frontend` into `frontend/build` via `cd frontend && npm run build`.
- **Backend API**: Dispatched via Serverless Function at `api/index.js` (which mounts `backend/app/server.js`).
- **Database**: SQLite automated migration and cold-start seeding in `/tmp` for serverless runtimes.

---

## Deployment Steps

1. **Push to GitHub**:
   Push the latest changes on `main` to your repository:
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**:
   - Navigate to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New... -> Project"**.
   - Import `anupmazumdar/CareerCompass`.

3. **Configure Project Settings**:
   - **Framework Preset**: `Other` or `Create React App`.
   - **Root Directory**: `./` (leave at root — `vercel.json` coordinates building and routing).
   - **Build Command**: `cd frontend && npm run build` (overridden by `vercel.json`).
   - **Output Directory**: `frontend/build` (overridden by `vercel.json`).

4. **Environment Variables**:
   Configure these environment variables in your Vercel Project Settings:
   - `JWT_SECRET` — Strong secret (at least 32 characters, e.g., generated with crypto).
   - `JWT_ACCESS_SECRET` — Optional (defaults to `JWT_SECRET`).
   - `JWT_REFRESH_SECRET` — Optional (defaults to `JWT_SECRET`).
   - `AI_PROVIDER` — `openrouter` (or `gemini`).
   - `OPENROUTER_API_KEY` — Your OpenRouter API key.
   - `OPENROUTER_MODEL` — e.g. `mistralai/mistral-7b-instruct:free` or `anthropic/claude-3.5-sonnet`.
   - `NODE_ENV` — `production`.

5. **Deploy**:
   Click **Deploy**. Vercel will install dependencies, build the React SPA, and mount `/api/*` to `api/index.js`.

