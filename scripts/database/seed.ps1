# scripts/database/seed.ps1
Write-Host "Seeding database with skills taxonomy and test accounts..." -ForegroundColor Cyan
node database/seeds/seed.js
