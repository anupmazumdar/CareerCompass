# scripts/database/migrate.ps1
Write-Host "Running database migrations..." -ForegroundColor Cyan
node database/migrations/migrate.js
