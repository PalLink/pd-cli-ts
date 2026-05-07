@echo off
SET NOTES=%~1

IF "%NOTES%"=="" (
    echo ❌ Error: No release notes provided.
    echo Usage: upload-release.bat "Your notes here"
    exit /b 1
)

:: Use a temporary file to get the version from jq
for /f "tokens=*" %%a in ('jq -r .version package.json') do set VERSION=v%%a
set TITLE=PalDefender CLI %VERSION%

echo 🚀 Starting Release Process for %VERSION%...
call build-bins.bat

echo 📌 Syncing tags...
git tag %VERSION% 2>nul
git push origin %VERSION%

echo ☁️  Uploading to GitHub...
gh release create %VERSION% ./build/pd-cli ./build/pd-cli.exe ./build/pd-cli-macos-arm64 ./build/pd-cli-macos-x64 --title "%TITLE%" --notes "%NOTES%" --generate-notes 

echo ✅ Release %VERSION% published!