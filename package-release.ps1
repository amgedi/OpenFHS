$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot=$PSScriptRoot
Push-Location $projectRoot
try {
 $version=(Get-Content package.json -Raw | ConvertFrom-Json).version
 if($version -notmatch '^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$'){throw 'Invalid version'}
 $releaseDir=Join-Path $projectRoot "dist/release-$version"
 if(Test-Path -LiteralPath $releaseDir){throw 'Immutable release already exists; choose a new version.'}
 $sourceManifest=& node scripts/release-inventory.cjs
 if($LASTEXITCODE -ne 0){throw 'Release inventory check failed'}
 $source=$sourceManifest | ConvertFrom-Json
 $sourceCommit=(& git rev-parse HEAD)
 if($LASTEXITCODE -ne 0){throw 'A source commit is required before packaging'}
 if((& git status --porcelain --untracked-files=normal)){throw 'Commit the reviewed source before packaging'}
 & node build-public.cjs | Out-Null
 if($LASTEXITCODE -ne 0){throw 'Static build failed'}
 & ./desktop/build-windows.ps1
 New-Item -ItemType Directory -Path $releaseDir | Out-Null
 $zip=[IO.Compression.ZipFile]::Open((Join-Path $releaseDir "OpenFHS-Source-$version.zip"),[IO.Compression.ZipArchiveMode]::Create)
 try {foreach($file in $source.inventory){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $projectRoot $file.name),$file.name) | Out-Null}} finally {$zip.Dispose()}
 Compress-Archive -Path (Join-Path $projectRoot 'dist/public-tester-alpha/*') -DestinationPath (Join-Path $releaseDir "OpenFHS-Tester-Alpha-$version.zip")
 Copy-Item -LiteralPath (Join-Path $projectRoot "dist/OpenFHS-Offline-$version.exe") -Destination $releaseDir
 Copy-Item -LiteralPath docs/release-notes.md -Destination (Join-Path $releaseDir 'RELEASE-NOTES.md')
 Copy-Item -LiteralPath docs/tester-alpha.md -Destination (Join-Path $releaseDir 'START-HERE.md')
 Copy-Item -LiteralPath docs/feedback-template.txt -Destination $releaseDir
 Copy-Item -LiteralPath LICENSE -Destination (Join-Path $releaseDir 'LICENSE.txt')
 Copy-Item -LiteralPath NOTICE.md -Destination $releaseDir
 @{version=$version;license='AGPL-3.0-only';sourceCommit=$sourceCommit;source=$source.inventory;static=(Get-Content dist/public-tester-alpha/release-manifest.json -Raw | ConvertFrom-Json);node=(& node --version);windowsSigned=$false} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $releaseDir 'PROVENANCE.json') -Encoding utf8
 Get-ChildItem -LiteralPath $releaseDir -File | ForEach-Object {$hash=Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256;"$($hash.Hash.ToLower())  $($_.Name)"} | Set-Content (Join-Path $releaseDir 'SHA256SUMS.txt') -Encoding utf8
 & ./scripts/verify-release.ps1
 Write-Output "Prepared and verified release artifacts: $releaseDir"
} finally {Pop-Location}
