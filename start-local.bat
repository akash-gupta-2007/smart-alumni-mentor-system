@echo off
REM MentorSetu local hosting - double-click to start API + UI (each in its own VISIBLE window)
title MentorSetu Launcher
cd /d "%~dp0backend"
if not exist .env ( echo [ERROR] backend\.env is missing. Copy backend\.env.example to backend\.env first. & pause & exit /b 1 )
start "MentorSetu-API" node src\server.js
cd /d "%~dp0frontend"
if not exist node_modules ( echo [ERROR] frontend\node_modules missing. Run "npm install" in frontend first. & pause & exit /b 1 )
start "MentorSetu-UI" node node_modules\vite\bin\vite.js
echo.
echo Starting servers... wait ~15 seconds. You should see "API :4000" and "VITE ready" in the two windows.
timeout /t 15 >nul
start http://localhost:5173
echo.
echo Done. Logins (password Password123!): student1@college.edu / alumni1@example.com / coordinator@college.edu
echo Keep the two server windows OPEN while testing. Run stop-local.bat to shut down.
pause
