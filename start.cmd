@echo off
cd /d "%~dp0"
echo Opening Jasmine Rain in your browser...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
pause
