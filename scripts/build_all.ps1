$ErrorActionPreference = 'Stop'

Write-Host "Building agent (placeholder)"

Write-Host "Building desktop (vite)"
Push-Location "$PSScriptRoot\..\apps\desktop"
npm run build
Pop-Location

Write-Host "Tauri bundling (placeholder)"

