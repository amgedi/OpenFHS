$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$compilerPath = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compilerPath)) { throw 'The Windows .NET Framework C# compiler is required to build this launcher.' }
$outputDirectory = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$outputFile = Join-Path $outputDirectory 'OpenFHS-Offline-0.5.8-alpha.11.exe'
$iconPath = Join-Path $outputDirectory 'OpenFHS.ico'
& (Join-Path $PSScriptRoot 'create-icon.ps1') -OutputPath $iconPath
$buildArguments = @('/nologo', '/target:winexe', '/platform:anycpu', '/optimize+', "/out:$outputFile", '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll')
$buildArguments += "/win32icon:$iconPath"
$buildArguments += "/resource:$iconPath,OpenFHS.icon"
$assetNames = @('avatars.js', 'privacy.js', 'backup.js', 'languages.js', 'logo.svg', 'index.html', 'styles.css', 'core.js', 'features.js', 'media.js', 'experience.js', 'app.js')
foreach ($assetName in $assetNames) {
    $assetPath = Join-Path (Join-Path $projectRoot 'prototype') $assetName
    if (-not (Test-Path -LiteralPath $assetPath)) { throw "Missing application asset: $assetName" }
    $buildArguments += "/resource:$assetPath,OpenFHS.$assetName"
}
$buildArguments += Join-Path $PSScriptRoot 'OpenFHS.cs'
& $compilerPath @buildArguments
if ($LASTEXITCODE -ne 0) { throw 'Windows executable build failed.' }
$checksum = Get-FileHash -LiteralPath $outputFile -Algorithm SHA256
@{ license = 'AGPL-3.0-only'; version = '0.5.8-alpha.11'; file = 'OpenFHS-Offline-0.5.8-alpha.11.exe'; sha256 = $checksum.Hash; signed = $false; purpose = 'Offline fictional-data diary; no AI training' } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $outputDirectory 'release.json') -Encoding UTF8
Write-Output "Built $outputFile"
