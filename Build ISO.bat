@echo off
title Build Nova OS ISO
cd /d "%~dp0"
rem Builds dist\nova-os-amd64.iso using Debian inside WSL.

wsl -l -q 2>nul | findstr /i "Debian" >nul
if errorlevel 1 (
  echo.
  echo  Building the ISO needs Linux (Debian) inside Windows, which isn't set up yet.
  echo.
  echo  One-time setup:
  echo    1. Right-click Start, choose "Terminal (Admin)"
  echo    2. Type:  wsl --install -d Debian
  echo    3. Restart your PC, then finish the Debian setup window ^(pick any username/password^)
  echo    4. Double-click this file again
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\adm-zip" call npm install --no-audit --no-fund

echo Building Nova OS ISO. This downloads about 1 GB and takes 20-60 minutes...
for /f "delims=" %%p in ('wsl -d Debian wslpath -a "%CD%"') do set WSLDIR=%%p
wsl -d Debian -u root -- bash "%WSLDIR%/iso/build-iso.sh"
if errorlevel 1 (
  echo.
  echo Build failed. See dist\build.log
  pause
  exit /b 1
)
echo.
echo Your ISO is ready: %CD%\dist\nova-os-amd64.iso
echo Write it to a USB stick with Rufus or balenaEtcher, then boot your PC from the USB.
explorer dist
pause
