# scripts/setup/setup.ps1
Write-Host "=== TalentAI Monorepo Environment Setup ===" -ForegroundColor Cyan

Write-Host "`n1. Checking Node.js runtime..."
node -v
if ($LASTEXITCODE -ne 0) {
    Write-Error "Node.js is required but not found in PATH."
    exit 1
}

Write-Host "`n2. Installing backend dependencies..."
Push-Location "backend"
npm install
Pop-Location

Write-Host "`n3. Installing frontend dependencies..."
Push-Location "frontend"
npm install
Pop-Location

Write-Host "`n4. Running database migrations..."
node database/migrations/migrate.js

Write-Host "`n5. Seeding database..."
node database/seeds/seed.js

Write-Host "`n[SUCCESS] Unified TalentAI environment is ready for development!" -ForegroundColor Green
