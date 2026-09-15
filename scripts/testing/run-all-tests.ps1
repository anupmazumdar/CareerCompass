# scripts/testing/run-all-tests.ps1
Write-Host "=== Running TalentAI Monorepo Comprehensive Test Suites ===" -ForegroundColor Cyan

Write-Host "`n1. Backend Unit, Integration, and Security Tests:" -ForegroundColor Yellow
Push-Location "backend"
npm test
$backendStatus = $LASTEXITCODE
Pop-Location

Write-Host "`n2. Frontend Tests:" -ForegroundColor Yellow
Push-Location "frontend"
$env:CI="true"
npm test -- --watchAll=false
$frontendStatus = $LASTEXITCODE
Pop-Location

if ($backendStatus -eq 0 -and $frontendStatus -eq 0) {
    Write-Host "`n[PASSED] All platform test suites completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n[FAILED] One or more test suites reported errors." -ForegroundColor Red
    exit 1
}
