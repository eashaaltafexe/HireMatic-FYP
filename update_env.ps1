# PowerShell script to update .env.local with new Gemini API key

$envFile = ".env.local"
$newApiKey = "AIzaSyDn5mxb-JB-PEFePtxqWmOhRzVIAmvKP8Q"

Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host "UPDATING .env.local WITH NEW GEMINI API KEY"
Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host ""

if (Test-Path $envFile) {
    Write-Host "✓ Found $envFile"
    
    # Read the file
    $content = Get-Content $envFile -Raw
    
    # Check if GEMINI_API_KEY exists
    if ($content -match "GEMINI_API_KEY=") {
        Write-Host "✓ Found existing GEMINI_API_KEY, updating..."
        $content = $content -replace "GEMINI_API_KEY=.*", "GEMINI_API_KEY=$newApiKey"
    } else {
        Write-Host "✓ Adding new GEMINI_API_KEY..."
        $content += "`nGEMINI_API_KEY=$newApiKey"
    }
    
    # Write back to file
    Set-Content -Path $envFile -Value $content -NoNewline
    Write-Host "✅ Updated $envFile successfully!"
    
} else {
    Write-Host "⚠ $envFile not found. Creating new file..."
    
    $template = @"
# MongoDB Connection
MONGODB_URI=mongodb+srv://hirematice_admin:DXVAd5aXWLuTeCR9@cluster0.6hifgaj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret
JWT_SECRET=72bb8c5361530fa31d69bbe0840cc09d178b7f57a2135368b507b151ac243156

# Gemini AI API Key
GEMINI_API_KEY=$newApiKey

# Agora Configuration
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
"@
    
    Set-Content -Path $envFile -Value $template
    Write-Host "✅ Created $envFile with new API key!"
}

Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host "NEXT STEPS:"
Write-Host "1. Restart your server: npm run dev"
Write-Host "2. Test evaluation: python scripts\auto_evaluate_and_report.py"
Write-Host "=" -NoNewline; Write-Host ("=" * 79)


