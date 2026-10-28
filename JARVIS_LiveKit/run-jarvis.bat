@echo off
setlocal
cd /d "%~dp0"
if not exist "Jarvis_code\.venv\Scripts\python.exe" (
  echo JARVIS is not installed yet. Run install.bat first.
  pause
  exit /b 1
)
cd /d "%~dp0agent-starter-react"
pnpm dev
