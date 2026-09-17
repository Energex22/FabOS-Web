@echo off
setlocal
cd /d "%~dp0"

title Fabvex Web

echo.
echo ========================================
echo             FABVEX WEB STARTER
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
echo Waiting for the local server before opening the browser...
echo.

start "Fabvex Web Server" /b cmd /c "npm run dev"

set "READY="
for /l %%N in (1,1,30) do (
  if not defined READY (
    powershell -NoProfile -Command "$r=try { Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173/' -TimeoutSec 1 } catch { $null }; if($r -and $r.StatusCode -eq 200){ exit 0 } else { exit 1 }" >nul 2>nul
    if not errorlevel 1 set "READY=1"
    if not defined READY timeout /t 1 /nobreak >nul
  )
)

if defined READY (
  echo Site is ready. Opening http://localhost:5173/
  echo.
  echo Checking the FabOS customer API at http://localhost:8000/api/v1/health ...
  powershell -NoProfile -Command "$r=try { Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8000/api/v1/health' -TimeoutSec 2 } catch { $null }; if($r -and $r.StatusCode -eq 200){ exit 0 } else { exit 1 }" >nul 2>nul
  if errorlevel 1 (
    echo WARNING: The FabOS customer API is not responding.
    echo The Shop page cannot load published products until the FabOS backend is running.
    echo Start FabOS on port 8000, then refresh the Fabvex Shop page.
    echo.
  ) else (
    echo FabOS customer API is online.
    echo.
  )
  start "Fabvex Web Browser" http://localhost:5173/
) else (
  echo.
  echo The server did not respond within 30 seconds.
  echo Open http://localhost:5173/ manually if the server is still starting.
)

echo.
echo The server is running in the background.
echo Close this window to finish the launcher; the server may remain running.
echo.
pause
endlocal
