#!/usr/bin/env bash
set -e

echo "=== CareerCompass Monorepo Environment Setup ==="

echo "1. Checking Node.js..."
node -v

echo "2. Installing root workspace dependencies..."
npm install

echo "3. Installing backend dependencies..."
(cd backend && npm install)

echo "4. Installing frontend dependencies..."
(cd frontend && npm install)

echo "5. Running database migrations..."
node database/migrations/migrate.js

echo "6. Seeding realistic opportunity & student data..."
node database/seeds/seed.js

echo "[SUCCESS] CareerCompass environment setup complete!"
