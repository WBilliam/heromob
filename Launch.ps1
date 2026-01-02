$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$port = 5173
$goCmd = Get-Command go -ErrorAction SilentlyContinue
if (-not $goCmd) {
  Write-Host "Go is required to launch the game. Install Go and retry."
  exit 1
}

$serverPath = Join-Path $root "server\server.go"
if (-not (Test-Path $serverPath)) {
  Write-Host "server\\server.go was not found in $root"
  exit 1
}

$exePath = Join-Path $root "server\server.exe"
Write-Host "Building server..."
& $goCmd.Source build -o $exePath $serverPath

Start-Process "http://localhost:$port/public/"
Write-Host "Serving on http://localhost:$port/public/. Press Ctrl+C to stop."
& $exePath -port $port -root $root
