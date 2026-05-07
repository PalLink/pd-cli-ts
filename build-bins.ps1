$NodeVersion = "v24.14.1"
$Sentinel = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"
$Package = Get-Content -Raw package.json | ConvertFrom-Json
$Version = $Package.version
$BuildDir = "./build"

Write-Host "🚀 Starting PalDefender CLI Build Process for v$Version..." -ForegroundColor Cyan

Write-Host "🧹 Preparing build directory..."
if (Test-Path $BuildDir) { Remove-Item -Recurse -Force $BuildDir }
New-Item -Path $BuildDir -ItemType Directory -Force | Out-Null

Write-Host "📦 Building and Bundling..."
npm run build
npx esbuild dist/cli.js --bundle --minify --platform=node --format=cjs `
    --target=es2020 `
    --external:node:* `
    --define:APP_VERSION="\"$Version\"" `
    --outfile="$BuildDir/bundle.js"

npx javascript-obfuscator "$BuildDir/bundle.js" --output "$BuildDir/bundle.js" `
    --compact true --self-defending true --target node --rename-globals false `
    --string-array true --string-array-encoding 'base64' --string-array-threshold 1 `
    --transform-object-keys false --rename-properties false

Write-Host "🧬 Generating SEA Blob..."
$seaConfig = @{ main = "$BuildDir/bundle.js"; output = "$BuildDir/sea-prep.blob" } | ConvertTo-Json
$seaConfig | Out-File -FilePath "$BuildDir/sea-config.json" -Encoding utf8
node --experimental-sea-config "$BuildDir/sea-config.json"

# Note: Windows doesn't have wget/tar by default in older versions, 
# but modern Win10/11 has 'tar.exe' and PowerShell has 'Invoke-WebRequest'

Write-Host "🪟 Building Windows Binary..."
Invoke-WebRequest -Uri "https://nodejs.org/dist/$NodeVersion/win-x64/node.exe" -OutFile "$BuildDir/pd-cli.exe"
npx postject "$BuildDir/pd-cli.exe" NODE_SEA_BLOB "$BuildDir/sea-prep.blob" --sentinel-fuse "$Sentinel"

Write-Host "🐧 Building Linux Binary..."
Invoke-WebRequest -Uri "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-linux-x64.tar.xz" -OutFile "$BuildDir/node-linux.tar.xz"
tar -xJf "$BuildDir/node-linux.tar.xz" -C $BuildDir
Copy-Item "$BuildDir/node-$NodeVersion-linux-x64/bin/node" "$BuildDir/pd-cli"
npx postject "$BuildDir/pd-cli" NODE_SEA_BLOB "$BuildDir/sea-prep.blob" --sentinel-fuse "$Sentinel"

Write-Host "🍎 Building macOS Binaries..."
# macOS Silicon
Invoke-WebRequest -Uri "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-darwin-arm64.tar.gz" -OutFile "$BuildDir/node-mac-arm.tar.gz"
tar -xzf "$BuildDir/node-mac-arm.tar.gz" -C $BuildDir
Copy-Item "$BuildDir/node-$NodeVersion-darwin-arm64/bin/node" "$BuildDir/pd-cli-macos-arm64"
npx postject "$BuildDir/pd-cli-macos-arm64" NODE_SEA_BLOB "$BuildDir/sea-prep.blob" --sentinel-fuse "$Sentinel" --macho-segment-name NODE_SEA

Write-Host "🧹 Final Cleanup..."
Remove-Item "$BuildDir/node-v*", "$BuildDir/*.tar.xz", "$BuildDir/*.tar.gz", "$BuildDir/sea-config.json", "$BuildDir/sea-prep.blob" -Recurse -ErrorAction SilentlyContinue

Write-Host "✅ Done! Binaries are in $BuildDir" -ForegroundColor Green