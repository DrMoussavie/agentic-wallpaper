param([switch]$SkipHooks, [switch]$SkipAutostart, [switch]$NoAnimation)
# One-shot local installer: Node check, dependencies, hooks, conditional autostart, Wallpaper Engine copy.
# A tiny robot walks across the console while each step runs; use -NoAnimation for plain output.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
. (Join-Path $PSScriptRoot 'scripts\wallpaper-engine.ps1')
$animate = -not $NoAnimation -and -not [Console]::IsOutputRedirected -and $Host.Name -eq 'ConsoleHost'
$frames = @(
    @('  [o_o]  ', '  /|_|\  ', '   / \   '),
    @('  [o_o]  ', '  \|_|/  ', '   /|    '),
    @('  [^_^]  ', '  /|_|\  ', '    |\   '),
    @('  [o_o]  ', '  \|_|/  ', '   / \   ')
)
$results = @()

function Invoke-Step {
    param([string]$Label, [scriptblock]$Script)
    Write-Host ''
    Write-Host ("  > " + $Label) -ForegroundColor Cyan
    if (-not $animate) {
        try { & $Script $PSScriptRoot; Write-Host '    done' -ForegroundColor Green; return $true }
        catch { Write-Host ('    failed: ' + $_.Exception.Message) -ForegroundColor Red; return $false }
    }
    $job = Start-Job -ScriptBlock $Script -ArgumentList $PSScriptRoot
    $top = [Console]::CursorTop; $width = [Math]::Max(30, [Console]::WindowWidth - 14); $tick = 0
    Write-Host ''; Write-Host ''; Write-Host ''
    try {
        while ($job.State -eq 'Running') {
            $frame = $frames[$tick % $frames.Count]; $pos = ($tick * 2) % $width
            for ($line = 0; $line -lt 3; $line++) {
                [Console]::SetCursorPosition(0, $top + $line)
                Write-Host ((' ' * $pos) + $frame[$line]).PadRight($width + 12) -NoNewline -ForegroundColor Yellow
            }
            [Console]::SetCursorPosition(0, $top + 3)
            Start-Sleep -Milliseconds 140; $tick++
        }
        $output = Receive-Job $job -ErrorAction SilentlyContinue
        $failed = $job.State -eq 'Failed'
        $reason = if ($failed) { ($job.ChildJobs[0].JobStateInfo.Reason.Message) } else { '' }
        if (-not $failed -and $job.ChildJobs[0].Error.Count) { $failed = $true; $reason = [string]$job.ChildJobs[0].Error[0] }
    } finally { Remove-Job $job -Force -ErrorAction SilentlyContinue }
    for ($line = 0; $line -lt 3; $line++) { [Console]::SetCursorPosition(0, $top + $line); Write-Host (' ' * ($width + 12)) -NoNewline }
    [Console]::SetCursorPosition(0, $top)
    if ($failed) { Write-Host ('  [x_x]  failed: ' + $reason) -ForegroundColor Red; Write-Host ''; Write-Host ''; return $false }
    Write-Host '  [^_^]  done' -ForegroundColor Green; Write-Host ''; Write-Host ''
    return $true
}

Write-Host ''
Write-Host '  [o_o]  Agentic Wallpaper - install' -ForegroundColor Cyan
Write-Host '  A live pixel-art garden for your Claude Code and Codex sessions. Everything stays on this PC.'

# 1. Node.js
$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host ''
    Write-Host '  Node.js 20 or newer is required. Install it, then run this file again:' -ForegroundColor Yellow
    Write-Host '    winget install OpenJS.NodeJS.LTS'
    exit 1
}
$version = [int]((& node -v).TrimStart('v').Split('.')[0])
if ($version -lt 20) { Write-Host ("  Node.js " + (& node -v) + " is too old (20 or newer needed)."); exit 1 }
Write-Host ('  Node.js ' + (& node -v) + ' found.')

# 2. Dependencies
$ok = Invoke-Step 'Installing dependencies (npm install)' { param($root) Set-Location -LiteralPath $root; & npm install --no-audit --no-fund 2>&1 | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'npm install failed' } }
if (-not $ok) { exit 1 }

# 3. Hooks
if (-not $SkipHooks) {
    $ok = Invoke-Step 'Connecting Claude Code and Codex (hooks)' { param($root) Set-Location -LiteralPath $root; & node scripts/install-hooks.mjs install 2>&1 | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'hooks:install failed' } }
    $results += if ($ok) { 'Hooks installed (backups in .local\backups).' } else { 'Hooks NOT installed: run "npm run hooks:install" later.' }
}

# 4. Wallpaper Engine copy
$project = Get-AgenticWallpaperProjectPath
$ok = Invoke-Step 'Building the wallpaper (npm run export)' { param($root) Set-Location -LiteralPath $root; & node scripts/export.mjs 2>&1 | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'export failed' } }
if ($ok -and $project) {
    New-Item -ItemType Directory -Path $project -Force | Out-Null
    Copy-Item -Path (Join-Path $PSScriptRoot 'dist\wallpaper\*') -Destination $project -Recurse -Force
    $results += ('Wallpaper copied to ' + $project)
} elseif ($ok) { $results += 'Wallpaper Engine not found: dist\wallpaper is ready to copy into projects\myprojects\agent-transit yourself.' }

# 5. Autostart, conditional on the wallpaper being selected
if (-not $SkipAutostart) {
    $ok = Invoke-Step 'Registering the relay autostart (only while the wallpaper is selected)' { param($root) & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'scripts\configure-startup.ps1') 2>&1 | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'configure-startup failed' } }
    $results += if ($ok) { 'Relay autostart: scheduled task at logon + every 5 min, active only while the wallpaper is selected; the relay exits after 10 idle minutes.' } else { 'Autostart NOT registered.' }
}

# 6. Start the relay now so the first selection works immediately.
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'scripts\start-relay.ps1') -Force | Out-Null
$results += 'Relay started (http://127.0.0.1:49157).'

Write-Host ''
Write-Host '  Summary' -ForegroundColor Cyan
foreach ($line in $results) { Write-Host ('  - ' + $line) }
Write-Host ''
Write-Host '  Two clicks left for you:' -ForegroundColor Yellow
Write-Host '  1. Wallpaper Engine -> Installed -> select "Agentic Wallpaper" on the monitor you want.'
Write-Host '  2. Codex app only: Settings -> Hooks -> From configuration -> Approve each Agentic Wallpaper entry (Claude Code needs nothing).'
Write-Host '  To remove everything later: powershell -ExecutionPolicy Bypass -File Uninstall.ps1'
Write-Host ''
