param(
  [int]$Port = 5175
)

$ErrorActionPreference = 'Stop'

Write-Host "Starting agent on port $Port..."
$agent = Start-Process -PassThru -NoNewWindow powershell -ArgumentList "-NoProfile","-Command","python","agent/run_agent.py" -WorkingDirectory "$PSScriptRoot\.."

Start-Sleep -Seconds 1
Write-Host "Starting UI dev server..."
Push-Location "$PSScriptRoot\..\apps\desktop"
npm run dev
Pop-Location

if ($agent -ne $null) { try { Stop-Process -Id $agent.Id -Force } catch {} }

