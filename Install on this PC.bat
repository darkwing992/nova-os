@echo off
rem Adds Nova OS Emulator to your Desktop and Start menu.
cd /d "%~dp0"
if not exist "node_modules\electron" (
  echo Downloading the Nova runtime...
  call npm install --no-audit --no-fund
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s = New-Object -ComObject WScript.Shell;" ^
  "foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {" ^
  "  $l = $s.CreateShortcut((Join-Path $dir 'Nova OS.lnk'));" ^
  "  $l.TargetPath = (Resolve-Path 'node_modules\electron\dist\electron.exe').Path;" ^
  "  $l.Arguments = '. --emulator';" ^
  "  $l.WorkingDirectory = (Get-Location).Path;" ^
  "  $l.Description = 'Nova OS Emulator';" ^
  "  $l.Save() }"
echo.
echo Nova OS is installed. Open it from the "Nova OS" shortcut on your Desktop or Start menu.
pause
