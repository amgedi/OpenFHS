@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% equ 0 (
  start "OpenFHS preview" /min node server.cjs
) else (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    start "OpenFHS preview" /min "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.cjs
  ) else (
    start "" "%~dp0prototype\index.html"
    exit /b
  )
)
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4317"
