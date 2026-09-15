#!/usr/bin/env bash
set -e

echo "=== TalentAI Monorepo Environment Setup ==="

echo "1. Checking Node.js..."
node -v

echo "2. Installing backend dependencies..."
(cd backend && npm install)

echo "3. Installing frontend dependencies..."
(cd frontend && npm install)

echo "4. Running database migrations..."
node database/migrations/migrate.js

echo "5. Seeding database..."
node database/seeds/seed.js

echo "[SUCCESS] Environment setup complete!"
