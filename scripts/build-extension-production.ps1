param(
  [Parameter(Mandatory = $true)]
  [string]$ApiBaseUrl,

  [string]$OutputZip = "dist/corretor-ptbr-extension.zip"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $root $OutputZip
$outputDir = Split-Path -Parent $outputPath

if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$env:VITE_DEFAULT_API_BASE_URL = $ApiBaseUrl

npm --workspace @corretor/extension run build
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao buildar a extensao"
}

if (Test-Path $outputPath) {
  Remove-Item $outputPath -Force
}

Compress-Archive -Path (Join-Path $root "apps/extension/dist/*") -DestinationPath $outputPath -Force

Write-Host "Extensao gerada em: $outputPath"
