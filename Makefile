# Unified TalentAI Platform Makefile
.PHONY: setup dev dev-backend dev-frontend test test-backend test-frontend migrate seed lint clean docker-build docker-up docker-down

setup:
	@echo "Installing root, backend, and frontend dependencies..."
	npm install
	cd backend && npm install
	cd frontend && npm install

dev:
	@echo "Starting backend and frontend concurrently..."
	npm run dev

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm start

test:
	@echo "Running backend and frontend test suites..."
	cd backend && npm test
	cd frontend && CI=true npm test -- --watchAll=false

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && CI=true npm test -- --watchAll=false

migrate:
	@echo "Running database migrations..."
	node database/migrations/migrate.js

seed:
	@echo "Seeding canonical database data..."
	node database/seeds/seed.js

clean:
	@echo "Cleaning up temporary files..."
	rm -rf backend/node_modules frontend/node_modules node_modules frontend/build

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
