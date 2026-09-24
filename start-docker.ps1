# ==============================================================================
# Datara AI Agentic Engine - Automated Docker Startup Script
# ==============================================================================
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Datara AI Agentic Engine - Docker Launcher        " -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Check if Docker command exists
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/" -ForegroundColor Yellow
    Exit 1
}

# 2. Check if Docker Daemon is running
Write-Host "[1/3] Checking Docker Daemon status..." -ForegroundColor Cyan
$dockerRunning = $false
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "[INFO] Docker Desktop daemon is not running yet." -ForegroundColor Yellow
    $dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopPath) {
        Write-Host "Launching Docker Desktop..." -ForegroundColor Cyan
        Start-Process $dockerDesktopPath
        Write-Host "Waiting for Docker daemon to initialize (this typically takes 20-30 seconds)..." -ForegroundColor Yellow
        $retries = 25
        while ($retries -gt 0 -and -not $dockerRunning) {
            Start-Sleep -Seconds 3
            $null = docker info 2>&1
            if ($LASTEXITCODE -eq 0) {
                $dockerRunning = $true
                break
            }
            Write-Host "." -NoNewline
            $retries--
        }
        Write-Host ""
    }
}

if (-not $dockerRunning) {
    Write-Host ""
    Write-Host "[ACTION REQUIRED] Docker Desktop is still starting or requires interactive launch." -ForegroundColor Yellow
    Write-Host "Please click/open 'Docker Desktop' from your Windows Start Menu." -ForegroundColor White
    Write-Host "Once the Docker whale icon in the taskbar is steady, re-run: npm run docker:up" -ForegroundColor Green
    Exit 1
}

Write-Host "[2/3] Docker Daemon is ACTIVE & HEALTHY." -ForegroundColor Green

# 3. Build & Run Containers
Write-Host "[3/3] Building and starting Datara containers..." -ForegroundColor Cyan
docker compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "  Datara is now READY & RUNNING in Docker!          " -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "  * Frontend UI:     http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  * FastAPI Backend: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  * Health Check:    http://localhost:8000/api/v1/health" -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "Use 'docker compose logs -f' to view real-time logs."
    Write-Host "Use 'docker compose down' to stop the containers."
} else {
    Write-Host "[ERROR] Failed to start Docker Compose services." -ForegroundColor Red
}
