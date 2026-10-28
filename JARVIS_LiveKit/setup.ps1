$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot 'Jarvis_code'
$frontendDir = Join-Path $projectRoot 'agent-starter-react'
$pythonVenv = Join-Path $backendDir '.venv\Scripts\python.exe'

Write-Host 'JARVIS setup — no administrator rights are required.' -ForegroundColor Cyan
if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
  throw 'Python launcher (py) was not found. Install Python 3.11 or newer, then run install.bat again.'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js was not found. Install Node.js 20 or newer, then run install.bat again.'
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw 'pnpm was not found. In a normal PowerShell window run: npm install -g pnpm'
}

if (-not (Test-Path $pythonVenv)) {
  $installedPython = (& py -0p 2>$null | Out-String)
  $pythonVersion = @('3.12', '3.11', '3.13') | Where-Object { $installedPython -match [regex]::Escape($_) } | Select-Object -First 1
  if (-not $pythonVersion) {
    throw 'Install Python 3.11, 3.12, or 3.13, then run install.bat again.'
  }
  Push-Location $backendDir
  try { & py "-$pythonVersion" -m venv .venv } finally { Pop-Location }
}
& $pythonVenv -m pip install --upgrade pip
& $pythonVenv -m pip install -r (Join-Path $backendDir 'requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Python packages could not be installed.' }

Push-Location $frontendDir
try { pnpm install } finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { throw 'Frontend packages could not be installed.' }

Write-Host ''
Write-Host 'Install finished. Start the app with run-jarvis.bat.' -ForegroundColor Green
Write-Host 'The first launch opens the local setup page at http://localhost:3000/setup.' -ForegroundColor Green
