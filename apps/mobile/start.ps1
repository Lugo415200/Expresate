param([int]$Port = 8081)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$taskNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$taskNode = if ($taskNodeCommand) { $taskNodeCommand.Source } else {
  Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $taskNode)) { throw 'Install Node.js 22 LTS or newer, then reopen PowerShell.' }
$env:PATH = "$(Split-Path -Parent $taskNode);$env:PATH"
if (-not (Test-Path -LiteralPath 'node_modules/expo/bin/cli')) {
  $taskPnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
  $taskPnpm = if ($taskPnpmCommand) { $taskPnpmCommand.Source } else {
    Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
  }
  if (-not (Test-Path -LiteralPath $taskPnpm)) { throw 'Install pnpm with: npm install --global pnpm@11. Then run this script again.' }
  & $taskPnpm install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
& $taskNode node_modules/expo/bin/cli start --lan --port $Port
exit $LASTEXITCODE
