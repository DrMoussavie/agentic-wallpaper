param([string]$NodePath = 'node.exe', [switch]$Force)
$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $projectPath '.local'
. (Join-Path $PSScriptRoot 'wallpaper-engine.ps1')
$mutex = New-Object System.Threading.Mutex($false, 'Local\AgentTransitRelayStartup')
$locked = $false
try {
    $locked = $mutex.WaitOne(15000)
    if (-not $locked) { throw 'Un démarrage du relais est déjà en cours.' }
    try { $health = Invoke-RestMethod 'http://127.0.0.1:49157/health' -TimeoutSec 2 } catch { $health = $null }
    if ($health.service -eq 'agent-transit') { exit 0 }
    # Automatic starts only serve a wallpaper that is actually selected in Wallpaper Engine.
    if (-not $Force) {
        $selection = Get-AgenticWallpaperSelection
        if ($selection.Installed -and -not $selection.Selected) { exit 0 }
    }
    if (Get-NetTCPConnection -LocalPort 49157 -State Listen -ErrorAction SilentlyContinue) { throw 'Le port 49157 est occupé par un autre service.' }
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
    $nodeExe = (Get-Command $NodePath -ErrorAction Stop).Source
    $arguments = 'bridge/server.mjs --auto'
    $relay = Start-Process -FilePath $nodeExe -ArgumentList $arguments -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath 'autostart-relay.log') -RedirectStandardError (Join-Path $logPath 'autostart-relay-error.log') -PassThru
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 500
        try { $health = Invoke-RestMethod 'http://127.0.0.1:49157/health' -TimeoutSec 1 } catch { $health = $null }
        if ($health.service -eq 'agent-transit') { exit 0 }
        if ($relay.HasExited) { throw 'Le relais est arrêté au démarrage. Voir autostart-relay-error.log.' }
    }
    throw 'Le relais ne répond pas encore. Voir autostart-relay-error.log.'
} catch {
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
    ('{0:u} {1}' -f (Get-Date), $_.Exception.Message) | Set-Content -LiteralPath (Join-Path $logPath 'autostart-error.log') -Encoding UTF8
    exit 1
} finally {
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
