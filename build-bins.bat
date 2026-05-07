@echo off
set NODE_VERSION=v24.14.1
set SENTINEL=NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
for /f "tokens=*" %%a in ('jq -r .version package.json') do set VERSION=%%a
set BUILD_DIR=.\build

echo 🚀 Building PalDefender CLI v%VERSION%...

if exist %BUILD_DIR% rd /s /q %BUILD_DIR%
mkdir %BUILD_DIR%

call npm run build
call npx esbuild dist/cli.js --bundle --minify --platform=node --format=cjs --target=es2020 --external:node:* --define:APP_VERSION="\"%VERSION%\"" --outfile=%BUILD_DIR%\bundle.js

call npx javascript-obfuscator %BUILD_DIR%\bundle.js --output %BUILD_DIR%\bundle.js --compact true --self-defending true --target node --string-array true

echo {"main": "build/bundle.js", "output": "build/sea-prep.blob"} > %BUILD_DIR%\sea-config.json
node --experimental-sea-config %BUILD_DIR%\sea-config.json

echo 🪟 Building Windows Binary...
curl -sL "https://nodejs.org/dist/%NODE_VERSION%/win-x64/node.exe" -o %BUILD_DIR%\pd-cli.exe
call npx postject %BUILD_DIR%\pd-cli.exe NODE_SEA_BLOB %BUILD_DIR%\sea-prep.blob --sentinel-fuse "%SENTINEL%"

echo 🐧 Building Linux Binary...
curl -sL "https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION-linux-x64.tar.xz" -o %BUILD_DIR%\linux.tar.xz
tar -xJf %BUILD_DIR%\linux.tar.xz -C %BUILD_DIR%
copy %BUILD_DIR%\node-%NODE_VERSION%-linux-x64\bin\node %BUILD_DIR%\pd-cli
call npx postject %BUILD_DIR%\pd-cli NODE_SEA_BLOB %BUILD_DIR%\sea-prep.blob --sentinel-fuse "%SENTINEL%"

:: ... Repeat similar curl/tar logic for macOS ...

echo ✅ Done!