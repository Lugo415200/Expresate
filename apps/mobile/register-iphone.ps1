$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

Write-Host ''
Write-Host 'Exprésate — iPhone registration' -ForegroundColor Cyan
Write-Host '1. Sign in to Expo if prompted.'
Write-Host '2. Sign in to Apple when EAS asks.'
Write-Host '3. Choose the website/URL registration method.'
Write-Host '4. Open the generated link on the iPhone you want to use.'
Write-Host ''

& "$PSScriptRoot\eas.ps1" device:create
exit $LASTEXITCODE
