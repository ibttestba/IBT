@echo off
echo Stopping Gaming Workshop Server...
taskkill /f /im python.exe 2>nul
echo Server stopped.
pause