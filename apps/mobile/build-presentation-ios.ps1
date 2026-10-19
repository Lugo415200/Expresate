$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

Write-Host ''
Write-Host 'Building standalone Exprésate presentation app for iPhone...' -ForegroundColor Cyan
Write-Host 'This is an internal/ad hoc build. Metro and Expo Go will not be required after installation.'
Write-Host ''

& "$PSScriptRoot\eas.ps1" build --platform ios --profile preview
exit $LASTEXITCODE
