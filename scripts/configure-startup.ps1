param([switch]$Remove)
# Registers a per-user scheduled task: at logon and every 5 minutes, start-relay.ps1 starts the relay only when
# Agentic Wallpaper is selected in Wallpaper Engine (the relay itself exits after 10 idle minutes). No admin rights.
$ErrorActionPreference = 'Stop'
$taskName = 'Agentic Wallpaper relay'
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'Agent Transit - relais.lnk'
$shellObject = New-Object -ComObject WScript.Shell
function Remove-LegacyShortcut {
    if (Test-Path -LiteralPath $shortcutPath) {
        $existing = $shellObject.CreateShortcut($shortcutPath)
        if ($existing.Description -eq 'Agent Transit local relay - managed startup') { Remove-Item -LiteralPath $shortcutPath }
    }
}
if ($Remove) {
    Remove-LegacyShortcut
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false }
    Write-Output 'Démarrage automatique du relais désactivé. Wallpaper Engine est inchangé.'
    exit 0
}
$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
# wscript launches PowerShell fully hidden: a scheduled powershell.exe would flash a terminal window every run.
$launcher = Join-Path $PSScriptRoot 'start-relay-hidden.vbs'
$arguments = '"{0}" "{1}"' -f $launcher, $nodeExe
$action = New-ScheduledTaskAction -Execute (Join-Path $env:SystemRoot 'System32\wscript.exe') -Argument $arguments -WorkingDirectory (Split-Path -Parent $PSScriptRoot)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$logon.Delay = 'PT20S'
$repeat = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -Hidden -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Remove-LegacyShortcut
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false }
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($logon, $repeat) -Settings $settings -Description 'Starts the Agentic Wallpaper relay while the wallpaper is selected in Wallpaper Engine.' | Out-Null
Write-Output ('Démarrage automatique installé : tâche planifiée "{0}" (à l''ouverture de session, puis toutes les 5 minutes, seulement si le fond est sélectionné).' -f $taskName)
