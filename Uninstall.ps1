param([switch]$KeepWallpaper, [switch]$KeepHooks)
# Undoes everything the installer set up on this PC: relay autostart, hooks, running relay, and the wallpaper copy.
# The project folder itself is left in place; delete it by hand if you want it gone.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
. (Join-Path $PSScriptRoot 'scripts\wallpaper-engine.ps1')
$steps = @()

Write-Host ''
Write-Host '  [o_o]  Agentic Wallpaper - uninstall' -ForegroundColor Cyan
Write-Host ''

# 1. Autostart (scheduled task + legacy shortcut)
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'scripts\configure-startup.ps1') -Remove | Out-Null
$steps += 'Autostart removed (scheduled task and startup shortcut).'

# 2. Running relay
$relays = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like '*bridge/server.mjs*' -or $_.CommandLine -like '*bridge\server.mjs*' }
foreach ($relay in $relays) { Stop-Process -Id $relay.ProcessId -Force -ErrorAction SilentlyContinue }
$steps += if ($relays) { 'Relay stopped.' } else { 'No relay was running.' }

# 3. Hooks in Claude Code and Codex configurations
if (-not $KeepHooks) {
    if (Get-Command node.exe -ErrorAction SilentlyContinue) {
        & node (Join-Path $PSScriptRoot 'scripts\install-hooks.mjs') remove | Out-Null
        $steps += 'Hooks removed from Claude Code and Codex (backups stay in .local\backups).'
    } else { $steps += 'Node.js not found: hooks left as they are (run "npm run hooks:remove" later).' }
} else { $steps += 'Hooks kept (-KeepHooks).' }

# 4. Wallpaper copy inside Wallpaper Engine
$project = Get-AgenticWallpaperProjectPath
if (-not $KeepWallpaper -and $project -and (Test-Path -LiteralPath $project)) {
    $selection = Get-AgenticWallpaperSelection
    if ($selection.Selected) {
        $steps += 'The wallpaper is still selected in Wallpaper Engine: pick another wallpaper there, then run this script again to delete the copy.'
    } else {
        Remove-Item -LiteralPath $project -Recurse -Force
        $steps += ('Wallpaper copy deleted: ' + $project)
    }
} elseif ($KeepWallpaper) { $steps += 'Wallpaper copy kept (-KeepWallpaper).' }
else { $steps += 'No wallpaper copy found in Wallpaper Engine.' }

foreach ($step in $steps) { Write-Host ('  - ' + $step) }
Write-Host ''
Write-Host '  Done. Nothing else was changed on this PC.' -ForegroundColor Green
