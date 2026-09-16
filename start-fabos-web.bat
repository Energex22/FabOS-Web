@echo off
setlocal
cd /d "%~dp0"

title FabOS Web

echo.
echo ========================================
echo           FABOS WEB STARTER
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on this computer.
  echo.
  echo Install Node.js LTS from:
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo First run detected. Installing dependencies...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
  echo.
)

echo Starting the customer site...
echo.
echo The site will open automatically at http://localhost:5173/
echo Keep this window open while using the site.
echo Close this window to stop the site.
echo.

start "FabOS Web Browser" http://localhost:5173/
npm run dev

endlocal
