param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$EasArgs
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$taskPnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
$taskPnpm = if ($taskPnpmCommand) { $taskPnpmCommand.Source } else {
  Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
}
if (-not (Test-Path -LiteralPath $taskPnpm)) {
  throw 'Could not find pnpm. Install Node.js/pnpm or use the Codex bundled runtime.'
}

& $taskPnpm dlx eas-cli@latest @EasArgs
exit $LASTEXITCODE
