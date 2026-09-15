# scripts/deployment/deploy.ps1
Write-Host "=== Building and Deploying Production Containers ===" -ForegroundColor Cyan
docker-compose -f infrastructure/deployment/docker-compose.prod.yml build
docker-compose -f infrastructure/deployment/docker-compose.prod.yml up -d
Write-Host "[DEPLOYED] Production services running on port 80." -ForegroundColor Green
