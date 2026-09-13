$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pythonCommand = Get-Command python.exe -ErrorAction SilentlyContinue
if (-not $pythonCommand) { throw 'Python 3.11 ou plus récent est nécessaire. Installe Python, puis relance ce fichier.' }
$venvPath = Join-Path $PSScriptRoot '.local/audio-venv'
& $pythonCommand.Source -m venv --system-site-packages $venvPath
if ($LASTEXITCODE -ne 0) { throw 'Impossible de créer l’environnement audio.' }
$venvPython = Join-Path $venvPath 'Scripts/python.exe'
& $venvPython -m pip install -r (Join-Path $PSScriptRoot 'bridge/audio-requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Installation des dépendances audio incomplète.' }
Write-Host 'Analyse audio installée. Relance le relais Agent Transit pour la prendre en compte.'
