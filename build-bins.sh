#!/bin/bash

NODE_VERSION="v24.14.1"
SENTINEL="NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"
VERSION=$(jq -r '.version' package.json)
BUILD_DIR="./build"

echo "🚀 Starting PalDefender CLI Build Process for v$VERSION..."

echo "🧹 Preparing build directory..."
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

echo "📦 Building and Bundling..."
npm run build
npx esbuild dist/cli.js --bundle --minify --platform=node --format=cjs \
    --target=es2020 \
    --external:node:* \
    --define:APP_VERSION="\"$VERSION\"" \
    --outfile=$BUILD_DIR/bundle.js

npx javascript-obfuscator $BUILD_DIR/bundle.js --output $BUILD_DIR/bundle.js \
    --compact true \
    --self-defending true \
    --target node \
    --rename-globals false \
    --string-array true \
    --string-array-encoding 'base64' \
    --string-array-threshold 1 \
    --transform-object-keys false \
    --rename-properties false > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Obfuscation successful."
else
    echo "❌ Obfuscation failed."
    exit 1
fi

echo "🧬 Generating SEA Blob..."
echo "{\"main\": \"$BUILD_DIR/bundle.js\", \"output\": \"$BUILD_DIR/sea-prep.blob\"}" > $BUILD_DIR/sea-config.json
node --experimental-sea-config $BUILD_DIR/sea-config.json

echo "🐧 Building Linux Binary..."
wget -q "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" -P $BUILD_DIR
tar -xJf $BUILD_DIR/node-$NODE_VERSION-linux-x64.tar.xz -C $BUILD_DIR
cp "$BUILD_DIR/node-$NODE_VERSION-linux-x64/bin/node" $BUILD_DIR/pd-cli
npx postject $BUILD_DIR/pd-cli NODE_SEA_BLOB $BUILD_DIR/sea-prep.blob --sentinel-fuse "$SENTINEL"
chmod +x $BUILD_DIR/pd-cli

echo "🪟 Building Windows Binary..."
wget -q "https://nodejs.org/dist/$NODE_VERSION/win-x64/node.exe" -O $BUILD_DIR/pd-cli.exe
npx postject $BUILD_DIR/pd-cli.exe NODE_SEA_BLOB $BUILD_DIR/sea-prep.blob --sentinel-fuse "$SENTINEL"

echo "🍎 Building macOS Binaries..."

wget -q "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-arm64.tar.gz" -P $BUILD_DIR
tar -xzf "$BUILD_DIR/node-$NODE_VERSION-darwin-arm64.tar.gz" -C $BUILD_DIR
cp "$BUILD_DIR/node-$NODE_VERSION-darwin-arm64/bin/node" $BUILD_DIR/pd-cli-macos-arm64
npx postject $BUILD_DIR/pd-cli-macos-arm64 NODE_SEA_BLOB $BUILD_DIR/sea-prep.blob --sentinel-fuse "$SENTINEL" --macho-segment-name NODE_SEA

wget -q "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-x64.tar.gz" -P $BUILD_DIR
tar -xzf "$BUILD_DIR/node-$NODE_VERSION-darwin-x64.tar.gz" -C $BUILD_DIR
cp "$BUILD_DIR/node-$NODE_VERSION-darwin-x64/bin/node" $BUILD_DIR/pd-cli-macos-x64
npx postject $BUILD_DIR/pd-cli-macos-x64 NODE_SEA_BLOB $BUILD_DIR/sea-prep.blob --sentinel-fuse "$SENTINEL" --macho-segment-name NODE_SEA

echo "🧹 Final Cleanup..."
rm -rf $BUILD_DIR/node-v* $BUILD_DIR/*.tar.xz $BUILD_DIR/*.tar.gz $BUILD_DIR/sea-config.json $BUILD_DIR/sea-prep.blob

echo "✅ Done! Binaries are located in the $BUILD_DIR folder."