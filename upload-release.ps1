param (
    [Parameter(Mandatory=$true)]
    [string]$Notes
)

# Get version from package.json using PowerShell's native JSON parser
$package = Get-Content -Raw package.json | ConvertFrom-Json
$version = "v$($package.version)"
$title = "PalDefender CLI $version"

Write-Host "🚀 Starting Release Process for $version..." -ForegroundColor Cyan

# Run the build script
./build-bins.sh

Write-Host "📌 Syncing tags..." -ForegroundColor Yellow
git tag $version 2>$null
git push origin $version

Write-Host "☁️  Uploading to GitHub..." -ForegroundColor Magenta
gh release create $version ./build/pd-cli ./build/pd-cli.exe ./build/pd-cli-macos-arm64 ./build/pd-cli-macos-x64 --title $title --notes $Notes --generate-notes 

Write-Host "✅ Release $version published!" -ForegroundColor Green