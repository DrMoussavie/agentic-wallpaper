# Shared helpers: where Wallpaper Engine lives and whether Agentic Wallpaper is the wallpaper of some monitor.
function Get-WallpaperEnginePath {
    $candidates = @()
    foreach ($key in 'HKCU:\Software\Valve\Steam', 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam', 'HKLM:\SOFTWARE\Valve\Steam') {
        try {
            $steam = (Get-ItemProperty -Path $key -ErrorAction Stop).SteamPath
            if (-not $steam) { $steam = (Get-ItemProperty -Path $key -ErrorAction Stop).InstallPath }
            if ($steam) { $candidates += (Join-Path $steam 'steamapps\common\wallpaper_engine') }
        } catch {}
    }
    $candidates += 'C:\Program Files (x86)\Steam\steamapps\common\wallpaper_engine'
    # Other Steam libraries are listed in libraryfolders.vdf.
    foreach ($base in @($candidates | ForEach-Object { Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $_)) } | Select-Object -Unique)) {
        $vdf = Join-Path $base 'steamapps\libraryfolders.vdf'
        if (Test-Path -LiteralPath $vdf) {
            foreach ($line in Get-Content -LiteralPath $vdf) {
                if ($line -match '"path"\s+"([^"]+)"') { $candidates += (Join-Path ($Matches[1] -replace '\\\\', '\') 'steamapps\common\wallpaper_engine') }
            }
        }
    }
    foreach ($candidate in $candidates | Select-Object -Unique) {
        if (Test-Path -LiteralPath (Join-Path $candidate 'wallpaper64.exe')) { return $candidate }
    }
    return $null
}

function Get-AgenticWallpaperProjectPath {
    $we = Get-WallpaperEnginePath
    if (-not $we) { return $null }
    return Join-Path $we 'projects\myprojects\agent-transit'
}

function Get-AgenticWallpaperSelection {
    # Installed: Wallpaper Engine exists. Selected: a monitor shows our wallpaper.html in its config.
    $we = Get-WallpaperEnginePath
    if (-not $we) { return [pscustomobject]@{ Installed = $false; Selected = $false; Monitors = @() } }
    $configPath = Join-Path $we 'config.json'
    $monitors = @()
    if (Test-Path -LiteralPath $configPath) {
        try {
            $config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($user in $config.PSObject.Properties) {
                $selected = $user.Value.general.wallpaperconfig.selectedwallpapers
                if (-not $selected) { continue }
                foreach ($monitor in $selected.PSObject.Properties) {
                    $file = [string]$monitor.Value.file
                    if ($file -match 'agent-transit[\\/](wallpaper\.html|project\.json)$') { $monitors += $monitor.Name }
                }
            }
        } catch {}
    }
    return [pscustomobject]@{ Installed = $true; Selected = ($monitors.Count -gt 0); Monitors = $monitors }
}
