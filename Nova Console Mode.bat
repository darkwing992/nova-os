@echo off
rem Runs Nova OS full screen like a real console. Press F1 for Home, use the power menu to exit.
cd /d "%~dp0"
if not exist "node_modules\electron" call npm install --no-audit --no-fund
start "" "node_modules\electron\dist\electron.exe" . --console
