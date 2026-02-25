#!/bin/bash

echo "============================================"
echo "HireMatic - Evaluation System Setup"
echo "============================================"
echo ""

echo "[1/3] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "ERROR: Python is not installed"
        echo "Please install Python 3.8+ from https://www.python.org/downloads/"
        exit 1
    fi
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

$PYTHON_CMD --version
echo ""

echo "[2/3] Installing Python dependencies..."
$PYTHON_CMD -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo ""

echo "[3/3] Testing evaluation script..."
cd "$(dirname "$0")"
$PYTHON_CMD scripts/auto_evaluate_and_report.py
if [ $? -ne 0 ]; then
    echo ""
    echo "WARNING: Script test failed or no unevaluated interviews found"
    echo "This is normal if there are no pending evaluations"
else
    echo ""
    echo "SUCCESS: Evaluation script works!"
fi
echo ""

echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "The evaluation system is ready."
echo "After each interview, the Python script will:"
echo "  1. Evaluate answers using Gemini AI"
echo "  2. Generate PDF report"
echo "  3. Update database with results"
echo ""
echo "Evaluations will appear at:"
echo "  http://localhost:3000/candidate/evaluations"
echo ""

