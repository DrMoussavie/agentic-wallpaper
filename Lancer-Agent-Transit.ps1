$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:49157/health' -TimeoutSec 1
    if ($health.service -ne 'agent-transit') { throw 'Le port est occupé par une autre application.' }
} catch {
    if (Get-NetTCPConnection -LocalPort 49157 -State Listen -ErrorAction SilentlyContinue) { throw 'Le port 49157 est occupé. Vérifier le service avant de relancer.' }
    New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot 'artifacts') -Force | Out-Null
    Start-Process -FilePath $nodePath -ArgumentList 'bridge/server.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'artifacts/server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'artifacts/server-error.log')
}
Start-Process 'http://127.0.0.1:49157/'
