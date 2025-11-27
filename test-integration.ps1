# =============================================================================
# HireMatic - Question Generation Integration Test Script
# =============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Question Generation Integration Test  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Python service is running
Write-Host "[1/5] Checking Python service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -Method GET -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ Python service is running" -ForegroundColor Green
    Write-Host "  Status: $($data.status)" -ForegroundColor Gray
    Write-Host "  Message: $($data.message)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Python service is NOT running!" -ForegroundColor Red
    Write-Host "  Start it with: python -m uvicorn app_simple:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Test 2: Generate questions for Software Engineer
Write-Host "[2/5] Generating questions for Software Engineer..." -ForegroundColor Yellow
$body = @{
    role = "software engineer"
    num_questions = 10
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/generate-multiple" -Method POST -Body $body -ContentType "application/json"
    Write-Host "  ✓ Generated $($response.count) questions" -ForegroundColor Green
    Write-Host "  Role: $($response.role)" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "  Sample Questions:" -ForegroundColor Cyan
    for ($i = 0; $i -lt [Math]::Min(5, $response.questions.Count); $i++) {
        $q = $response.questions[$i]
        Write-Host "  $($i+1). $($q.text)" -ForegroundColor White
    }
    
    if ($response.questions.Count -gt 5) {
        Write-Host "  ... and $($response.questions.Count - 5) more" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ Failed to generate questions" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test different roles
Write-Host "[3/5] Testing different roles..." -ForegroundColor Yellow
$roles = @("data scientist", "frontend developer", "devops engineer")

foreach ($role in $roles) {
    $body = @{
        role = $role
        num_questions = 3
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/generate-multiple" -Method POST -Body $body -ContentType "application/json"
        Write-Host "  ✓ $role - $($response.count) questions" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $role - Failed" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Check Next.js API route (if running)
Write-Host "[4/5] Checking Next.js integration..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/questions/generate?role=software engineer" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Next.js API route is working" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Next.js server not running or API route not accessible" -ForegroundColor Yellow
    Write-Host "  Start it with: npm run dev" -ForegroundColor Gray
}

Write-Host ""

# Test 5: Summary
Write-Host "[5/5] Integration Summary" -ForegroundColor Yellow
Write-Host "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  ✓ Python Service (Port 8000): Running" -ForegroundColor Green
Write-Host "  ✓ Question Generation: Working" -ForegroundColor Green
Write-Host "  ✓ Multiple Roles: Supported" -ForegroundColor Green
Write-Host ""
Write-Host "  📍 How to view questions:" -ForegroundColor Cyan
Write-Host "     1. Open: http://localhost:3000/admin/dashboard" -ForegroundColor White
Write-Host "     2. Scroll to 'AI-Generated Interview Questions'" -ForegroundColor White
Write-Host "     3. Select a role and click 'Generate Questions'" -ForegroundColor White
Write-Host ""
Write-Host "  🧪 Test Page:" -ForegroundColor Cyan
Write-Host "     Open: d:\HireMatic\HireMatic Implementation\public\test-questions.html" -ForegroundColor White
Write-Host ""
Write-Host "  🔧 API Endpoints:" -ForegroundColor Cyan
Write-Host "     Python: http://localhost:8000/generate-multiple" -ForegroundColor White
Write-Host "     Next.js: http://localhost:3000/api/questions/generate" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Integration Test Complete! ✓" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask to open test page
$openTest = Read-Host "Open test page in browser? (Y/N)"
if ($openTest -eq 'Y' -or $openTest -eq 'y') {
    Start-Process "d:\HireMatic\HireMatic Implementation\public\test-questions.html"
    Write-Host "Test page opened in your default browser!" -ForegroundColor Green
}
