$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=Split-Path -Parent $PSScriptRoot
$version=(Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
$release=Join-Path $root "dist/release-$version"
$provenance=Get-Content (Join-Path $release 'PROVENANCE.json') -Raw | ConvertFrom-Json
if($provenance.version -ne $version -or $provenance.static.version -ne $version){throw 'Provenance version mismatch'}
if($provenance.license -ne 'AGPL-3.0-only' -or $provenance.static.license -ne 'AGPL-3.0-only'){throw 'Release license mismatch'}
if($provenance.sourceCommit -ne (& git rev-parse HEAD)){throw 'Release source commit mismatch'}
if((Get-FileHash (Join-Path $release 'LICENSE.txt')).Hash -ne (Get-FileHash (Join-Path $root 'LICENSE')).Hash){throw 'Release license text mismatch'}
function StreamHash($stream){$hash=[Security.Cryptography.SHA256]::Create();try{return [BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-','').ToLower()}finally{$hash.Dispose()}}
$zip=[IO.Compression.ZipFile]::OpenRead((Join-Path $release "OpenFHS-Source-$version.zip"))
try {if($zip.Entries.Count -ne $provenance.source.Count){throw 'Source entry count mismatch'};foreach($file in $provenance.source){$entry=$zip.GetEntry($file.name);if(-not $entry){throw "Missing source: $($file.name)"};$stream=$entry.Open();try{$hash=StreamHash $stream}finally{$stream.Dispose()};if($hash -ne $file.sha256 -or $hash -ne (Get-FileHash (Join-Path $root $file.name)).Hash.ToLower()){throw "Source mismatch: $($file.name)"}}}finally{$zip.Dispose()}
$assembly=[Reflection.Assembly]::LoadFile((Join-Path $release "OpenFHS-Offline-$version.exe"))
$assets=0
foreach($name in $assembly.GetManifestResourceNames()){if($name -eq 'OpenFHS.icon'){continue};$stream=$assembly.GetManifestResourceStream($name);try{$hash=StreamHash $stream}finally{$stream.Dispose()};$file=Join-Path $root ('prototype/'+$name.Substring('OpenFHS.'.Length));if($hash -ne (Get-FileHash $file).Hash.ToLower()){throw "EXE asset mismatch: $name"};$assets++}
if($assets -ne 12){throw 'Unexpected embedded asset inventory'}
$zip=[IO.Compression.ZipFile]::OpenRead((Join-Path $release "OpenFHS-Tester-Alpha-$version.zip"))
try{if($zip.Entries.Count -ne ($provenance.static.files.Count+1)){throw 'Unexpected static archive entry count'};if(-not $zip.GetEntry('release-manifest.json')){throw 'Missing static manifest'};foreach($file in $provenance.static.files){$entry=$zip.GetEntry($file.name);if(-not $entry){throw "Missing static asset: $($file.name)"};$stream=$entry.Open();try{$hash=StreamHash $stream}finally{$stream.Dispose()};if($hash -ne $file.sha256){throw "Static asset mismatch: $($file.name)"}}}finally{$zip.Dispose()}
foreach($line in Get-Content (Join-Path $release 'SHA256SUMS.txt')){if($line -match '^([a-f0-9]{64})  (.+)$'){if((Get-FileHash (Join-Path $release $Matches[2])).Hash.ToLower() -ne $Matches[1]){throw 'Release checksum mismatch'}}else{throw 'Malformed checksum entry'}}
Write-Output "Verified $($provenance.source.Count) source files, $assets EXE assets, static assets and release checksums."
