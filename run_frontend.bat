@echo off
setlocal enabledelayedexpansion

title JanSamadhan - Vite React Frontend Server (Port 5173)
echo ======================================================================
echo    JanSamadhan - National Public Grievance Redressal System
echo    Frontend Development Server Launcher (Vite)
echo ======================================================================
echo.

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] Frontend directory or package.json not found at:
    echo         %FRONTEND_DIR%
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js / npm is not installed or not in system PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [NOTICE] node_modules not found. Running npm install...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [OK] Frontend Path: %FRONTEND_DIR%
echo.
echo Starting Vite development server on http://localhost:5173 ...
echo Proxying API requests to http://127.0.0.1:8000
echo Press CTRL+C to stop the frontend server.
echo ======================================================================
echo.

cd /d "%FRONTEND_DIR%"
npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend server stopped with error code %errorlevel%.
    pause
)

