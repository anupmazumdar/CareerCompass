# scripts/development/start-dev.ps1
Write-Host "Starting TalentAI Monorepo in Development Mode..." -ForegroundColor Cyan

# Check if data directory exists
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

npm run dev
