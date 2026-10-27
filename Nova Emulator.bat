@echo off
title Nova OS Emulator
cd /d "%~dp0"
if not exist "node_modules\electron" (
  echo First run: downloading the Nova runtime. This only happens once...
  call npm install --no-audit --no-fund
)
start "" "node_modules\electron\dist\electron.exe" . --emulator
