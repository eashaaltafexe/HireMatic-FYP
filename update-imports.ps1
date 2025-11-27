# PowerShell script to update imports across all API routes
$rootPath = "d:\HireMatic\hireMatic 30%\src\app\api"

# Find all route.ts files
$routeFiles = Get-ChildItem -Path $rootPath -Recurse -Filter "route.ts"

foreach ($file in $routeFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Skip if file is empty or already updated
    if ([string]::IsNullOrWhiteSpace($content) -or $content -match "@/data-access|@/business-logic|@/application") {
        Write-Host "  Skipping (already updated or empty)"
        continue
    }
    
    # Replace imports
    $content = $content -replace "import dbConnect from '@/lib/db';", "import { dbConnect } from '@/data-access';"
    $content = $content -replace "import User from '@/models/User';", ""
    $content = $content -replace "import Job from '@/models/Job';", ""
    $content = $content -replace "import Application from '@/models/Application';", ""
    $content = $content -replace "import Interview from '@/models/Interview';", ""
    
    # Add data-access imports at the beginning after NextResponse import
    if ($content -match "import.*NextResponse.*") {
        $modelsNeeded = @()
        if ($content -match "\bUser\b" -and $content -notmatch "userId|userName") { $modelsNeeded += "User" }
        if ($content -match "\bJob\b") { $modelsNeeded += "Job" }
        if ($content -match "\bApplication\b") { $modelsNeeded += "Application" }
        if ($content -match "\bInterview\b") { $modelsNeeded += "Interview" }
        
        if ($modelsNeeded.Count -gt 0) {
            $importLine = "import { dbConnect, $($modelsNeeded -join ', ') } from '@/data-access';"
            $content = $content -replace "(import.*NextResponse.*\n)", "$1$importLine`n"
        } elseif ($content -match "dbConnect") {
            $content = $content -replace "(import.*NextResponse.*\n)", "$1import { dbConnect } from '@/data-access';`n"
        }
    }
    
    # Replace service imports
    $content = $content -replace "import.*from '@/services/auth';", "import * as AuthService from '@/application';"
    $content = $content -replace "import.*from '@/services/resumeParser';", "import * as ResumeService from '@/business-logic';"
    $content = $content -replace "import.*from '@/services/aiScreening';", "import * as AIService from '@/business-logic';"
    $content = $content -replace "import.*from '@/services/interviewScheduler';", "import * as SchedulerService from '@/application';"
    $content = $content -replace "import.*from '@/services/notificationService';", "import * as NotificationService from '@/application';"
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "  Updated successfully"
}

Write-Host "Script completed!"