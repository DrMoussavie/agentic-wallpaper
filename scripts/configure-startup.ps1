param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'Agent Transit - relais.lnk'
$shellObject = New-Object -ComObject WScript.Shell
if ($Remove) {
    if (Test-Path -LiteralPath $shortcutPath) {
        $existing = $shellObject.CreateShortcut($shortcutPath)
        if ($existing.Description -ne 'Agent Transit local relay - managed startup') { throw 'Ce raccourci appartient à une autre installation.' }
        Remove-Item -LiteralPath $shortcutPath
    }
    Write-Output 'Démarrage automatique du relais désactivé. Wallpaper Engine est inchangé.'
    exit 0
}
if (Test-Path -LiteralPath $shortcutPath) {
    $existing = $shellObject.CreateShortcut($shortcutPath)
    if ($existing.Description -ne 'Agent Transit local relay - managed startup') { throw 'Un autre raccourci utilise déjà ce nom.' }
}
$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
$scriptPath = Join-Path $PSScriptRoot 'start-relay.ps1'
$shortcut = $shellObject.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $PSHOME 'powershell.exe'
$shortcut.Arguments = '-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -NodePath "{1}"' -f $scriptPath, $nodeExe
$shortcut.WorkingDirectory = Split-Path -Parent $PSScriptRoot
$shortcut.Description = 'Agent Transit local relay - managed startup'
$shortcut.WindowStyle = 7
$shortcut.Save()
Write-Output ('Démarrage automatique installé : ' + $shortcutPath)
