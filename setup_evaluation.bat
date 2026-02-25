@echo off
echo ============================================
echo HireMatic - Evaluation System Setup
echo ============================================
echo.

echo [1/3] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)
python --version
echo.

echo [2/3] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/3] Testing evaluation script...
cd /d "%~dp0"
python scripts\auto_evaluate_and_report.py
if errorlevel 1 (
    echo.
    echo WARNING: Script test failed or no unevaluated interviews found
    echo This is normal if there are no pending evaluations
) else (
    echo.
    echo SUCCESS: Evaluation script works!
)
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo The evaluation system is ready.
echo After each interview, the Python script will:
echo   1. Evaluate answers using Gemini AI
echo   2. Generate PDF report
echo   3. Update database with results
echo.
echo Evaluations will appear at:
echo   http://localhost:3000/candidate/evaluations
echo.
pause

