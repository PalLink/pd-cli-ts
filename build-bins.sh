#!/bin/bash

# --- Configuration ---
NODE_VERSION="v24.14.1"
SENTINEL="NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"

echo "🚀 Starting PalDefender CLI Build Process..."

# 1. Clean up old build artifacts to ensure no 'dirty' files remain
echo "🧹 Cleaning workspace..."
rm -rf dist sea-prep.blob pd-cli pd-cli.exe node-linux.tar.xz node-win.exe node-v*-linux-x64

# 2. Build and Bundle JS (CJS format to avoid ESM issues in SEA)
echo "📦 Building and Bundling JS..."
npm run build
npx esbuild dist/cli.js --bundle --minify --platform=node --format=cjs --external:node:* --outfile=dist/bundle.js

# 3. Generate the SEA Blob
echo "🧬 Generating SEA Blob..."
node --experimental-sea-config sea-config.json

# 4. Build Linux Binary
echo "🐧 Building Linux Binary..."
wget -q "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" -O node-linux.tar.xz
tar -xJf node-linux.tar.xz
cp "node-$NODE_VERSION-linux-x64/bin/node" pd-cli
npx postject pd-cli NODE_SEA_BLOB sea-prep.blob --sentinel-fuse "$SENTINEL"
chmod +x pd-cli

# 5. Build Windows Binary
echo "🪟 Building Windows Binary..."
wget -q "https://nodejs.org/dist/$NODE_VERSION/win-x64/node.exe" -O pd-cli.exe
npx postject pd-cli.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse "$SENTINEL"

# 6. Final Cleanup
echo "🧹 Final Cleanup..."
rm -rf node-linux.tar.xz node-v*-linux-x64 node-linux.tar.xz

echo "✅ Done! Binaries created: pd-cli (Linux) and pd-cli.exe (Windows)"