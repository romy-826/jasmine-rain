$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    Write-Host 'Node.js is required. Install Node.js 20 or newer from https://nodejs.org/ and try again.'
    exit 1
}
& $nodeCommand.Source (Join-Path $PSScriptRoot 'launch.cjs') --open
