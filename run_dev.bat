@echo off
setlocal enabledelayedexpansion

title JanSamadhan - Full Stack Development Server Launcher
echo ======================================================================
echo    JanSamadhan - National Public Grievance Redressal System
echo    Full-Stack Development Server Launcher
echo ======================================================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "VENV_PYTHON=%ROOT_DIR%.venv\Scripts\python.exe"

if not exist "%VENV_PYTHON%" (
    if exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
        set "VENV_PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe"
    ) else (
        echo [ERROR] Virtual environment not found at:
        echo         %ROOT_DIR%.venv
        echo Please ensure the root virtual environment exists.
        pause
        exit /b 1
    )
)

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "JanSamadhan Backend (Port 8000)" cmd /c "cd /d "%ROOT_DIR%" && call run_backend.bat"

echo [2/2] Starting Vite React Frontend on http://localhost:5173 ...
start "JanSamadhan Frontend (Port 5173)" cmd /c "cd /d "%ROOT_DIR%" && call run_frontend.bat"

echo.
echo ======================================================================
echo  JanSamadhan Services are launching in separate windows:
echo    * Backend API  : http://127.0.0.1:8000
echo    * API Docs     : http://127.0.0.1:8000/docs
echo    * Frontend App : http://localhost:5173
echo ======================================================================
echo.
echo You may close this window. Backend and Frontend will remain running.
pause
