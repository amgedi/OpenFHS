@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo OpenFHS source preview requires Node.js 22 or newer.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

start "OpenFHS preview" /min node server.cjs
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4317"
