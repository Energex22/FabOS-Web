@echo off
setlocal EnableExtensions

REM ============================================================
REM FABVEX ADMIN LAUNCHER CONFIGURATION
REM Uncomment and edit these paths for a fixed machine setup.
REM Otherwise the launcher auto-detects or prompts for FabOS.
REM ============================================================
REM set "FABOS_DIR=C:\FabOS"
REM set "FABOS_WEB_DIR=C:\FabOS-Web"

if not defined FABOS_WEB_DIR set "FABOS_WEB_DIR=%~dp0"
for %%I in ("%FABOS_WEB_DIR%") do set "FABOS_WEB_DIR=%%~fI"
if not defined FABOS_DIR if exist "%FABOS_WEB_DIR%..\FabOS\fabos_api\server.py" set "FABOS_DIR=%FABOS_WEB_DIR%..\FabOS"
if defined FABOS_DIR for %%I in ("%FABOS_DIR%") do set "FABOS_DIR=%%~fI"

if not exist "%FABOS_WEB_DIR%\package.json" (
  echo ERROR: FabVex Web folder not found: %FABOS_WEB_DIR%
  echo Edit FABOS_WEB_DIR at the top of this BAT file.
  pause
  exit /b 1
)
if not defined FABOS_DIR (
  echo FabOS backend folder was not found automatically.
  echo.
  set /p "FABOS_DIR=Enter the full path to your FabOS folder: "
  if not defined FABOS_DIR (
    echo No FabOS directory was supplied.
    pause
    exit /b 1
  )
  for %%I in ("%FABOS_DIR%") do set "FABOS_DIR=%%~fI"
)
if not exist "%FABOS_DIR%\fabos_api\server.py" (
  echo ERROR: %FABOS_DIR% is not a FabOS checkout.
  echo Expected: fabos_api\server.py
  pause
  exit /b 1
)

cd /d "%FABOS_WEB_DIR%"

title Fabvex Development Stack

echo.
echo ========================================
echo        FABVEX DEVELOPMENT STACK
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
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

if defined FABOS_DIR (
  echo Starting FabOS API from:
  echo %FABOS_DIR%
  start "FabOS API" /b cmd /c "cd /d "%FABOS_DIR%" && python -m fabos_api.server"
 )

echo Starting customer website...
start "Fabvex Web Server" /b cmd /c "cd /d "%FABOS_WEB_DIR%" && npm run dev"

echo.
echo Waiting for the website...
for /l %%N in (1,1,30) do (
  powershell -NoProfile -Command "$r=try { Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173/' -TimeoutSec 1 } catch { $null }; if($r -and $r.StatusCode -eq 200){ exit 0 } else { exit 1 }" >nul 2>nul
  if not errorlevel 1 goto READY
  timeout /t 1 /nobreak >nul
)

echo.
echo The website did not respond within 30 seconds.
echo Open http://localhost:5173/ manually if Vite is still starting.
goto SHUTDOWN_PROMPT

:READY
echo.
echo ========================================
echo Website ready: http://localhost:5173/
echo API health:    http://127.0.0.1:8000/api/v1/health
echo ========================================
echo.
start "Fabvex Browser" http://localhost:5173/

echo The Fabvex website and local API are running.
echo Keep this window open while developing.
echo.

:SHUTDOWN_PROMPT
echo.
echo ========================================
echo             STOP SERVERS?
echo ========================================
echo.
choice /C YN /N /M "Shut down the Fabvex website and FabOS API now? [Y/N] "
if errorlevel 2 goto EXIT

echo.
echo Stopping Fabvex development servers...
call :STOP_SERVER_BY_PORT 5173 "Fabvex Web Server"
call :STOP_SERVER_BY_PORT 8000 "FabOS API"
echo.
echo Development servers stopped.
goto EXIT

:STOP_SERVER_BY_PORT
set "PORT=%~1"
set "LABEL=%~2"
for /f "tokens=5" %%P in ('netstat -ano -p tcp ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  if not "%%P"=="0" (
    echo Stopping %LABEL% process %%P on port %PORT%...
    taskkill /PID %%P /T /F >nul 2>nul
  )
)
exit /b 0

:EXIT
echo.
echo Launcher closed.
echo.
endlocal
