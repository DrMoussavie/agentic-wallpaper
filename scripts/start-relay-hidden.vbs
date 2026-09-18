' Runs start-relay.ps1 with no console window at all (a scheduled powershell.exe always flashes one).
' Usage: wscript.exe start-relay-hidden.vbs "<node.exe path>"
Dim shell, script, node, command
Set shell = CreateObject("WScript.Shell")
script = Replace(WScript.ScriptFullName, "start-relay-hidden.vbs", "start-relay.ps1")
node = "node.exe"
If WScript.Arguments.Count > 0 Then node = WScript.Arguments(0)
command = "powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & script & """ -NodePath """ & node & """"
shell.Run command, 0, False
