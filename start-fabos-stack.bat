@echo off
setlocal
cd /d "%~dp0"

title Customer Website + FabOS API

echo.
echo ========================================
echo       CUSTOMER WEBSITE + FABOS API
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on this computer.
  echo Install Node.js LTS, then run this launcher again.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo Installing website dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

set "FABOS_DIR=%FABOS_DIR%"
if not defined FABOS_DIR if exist "%~dp0..\FabOS\fabos_api\server.py" set "FABOS_DIR=%~dp0..\FabOS"
if not defined FABOS_DIR if exist "%~dp0..\FabOS\fabos_api\server.py" set "FABOS_DIR=%~dp0..\FabOS"

if defined FABOS_DIR (
  echo Starting FabOS API from:
  echo %FABOS_DIR%
  start "FabOS API" /b cmd /c "cd /d "%FABOS_DIR%" && python -m fabos_api.server"
) else (
  echo FabOS backend folder was not found automatically.
  echo.
  echo Set FABOS_DIR to your FabOS folder before running this launcher.
  echo Example: set FABOS_DIR=C:\FabOS
  echo.
  echo The website will still start with its local preview catalog.
)

echo Starting customer website...
start "Customer Website" /b cmd /c "npm run dev"

echo.
echo Waiting for the website...
for /l %%N in (1,1,30) do (
  powershell -NoProfile -Command "$r=try { Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173/' -TimeoutSec 1 } catch { $null }; if($r -and $r.StatusCode -eq 200){ exit 0 } else { exit 1 }" >nul 2>nul
  if not errorlevel 1 goto READY
  timeout /t 1 /nobreak >nul
)

echo The website did not respond within 30 seconds.
echo Open http://localhost:5173/ manually if Vite is still starting.
goto DONE

:READY
echo.
echo ========================================
echo Website ready: http://localhost:5173/
echo API health:    http://127.0.0.1:8000/api/v1/health
echo ========================================
echo.
start "Customer Website Browser" http://localhost:5173/

:DONE
echo.
echo Press any key to close this launcher. Background servers may remain running.
pause >nul
endlocal
