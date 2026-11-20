@echo off
setlocal enabledelayedexpansion

title JanSamadhan - FastAPI Backend Server (Port 8000)
echo ======================================================================
echo    JanSamadhan - National Public Grievance Redressal System
echo    FastAPI Backend Server Launcher (from backend/)
echo ======================================================================
echo.

set "BACKEND_DIR=%~dp0"
set "ROOT_DIR=%BACKEND_DIR%..\"
set "VENV_PYTHON=%ROOT_DIR%.venv\Scripts\python.exe"

if not exist "%VENV_PYTHON%" (
    if exist "%BACKEND_DIR%venv\Scripts\python.exe" (
        set "VENV_PYTHON=%BACKEND_DIR%venv\Scripts\python.exe"
    ) else (
        echo [ERROR] Virtual environment not found at:
        echo         %ROOT_DIR%.venv
        echo Please ensure the root virtual environment exists.
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Using Python: %VENV_PYTHON%
echo [OK] Backend Path: %BACKEND_DIR%
echo [OK] Root Env:     %ROOT_DIR%.env
echo.

REM Automatically release port 8000 if an old/stale process is still bound to it
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /r ":8000\>"') do (
    if not "%%a"=="" if not "%%a"=="0" (
        echo [INFO] Freeing port 8000 from stale process PID %%a ...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo Starting Uvicorn server on http://127.0.0.1:8000 ...
echo Press CTRL+C to stop the server.
echo ======================================================================
echo.

cd /d "%BACKEND_DIR%"
"%VENV_PYTHON%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

if errorlevel 1 (
    echo.
    echo [ERROR] Backend server stopped unexpectedly with error code %errorlevel%.
    pause
)
