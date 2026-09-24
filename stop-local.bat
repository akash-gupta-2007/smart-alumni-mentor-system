@echo off
REM MentorSetu - stop local API + UI servers
taskkill /FI "WINDOWTITLE eq MentorSetu-API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq MentorSetu-UI*" /F >nul 2>&1
echo MentorSetu servers stopped.
pause
