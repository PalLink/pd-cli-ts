#!/bin/bash

VERSION="v$(jq -r '.version' package.json)"
TITLE="PalDefender CLI $VERSION"
NOTES="Includes obfuscated integrity protection."
BUILD_DIR="./build"

echo "🚀 Starting Release Process for $VERSION..."

# Ensure we have fresh binaries in the build folder
./build-bins.sh

# Safety check
if [ ! -f "$BUILD_DIR/pd-cli" ]; then
    echo "❌ Error: Binaries not found in $BUILD_DIR. Build may have failed."
    exit 1
fi

if ! [ -x "$(command -v gh)" ]; then
  echo '❌ Error: GitHub CLI (gh) is not installed.' >&2
  exit 1
fi

gh auth status || { echo "❌ Please run 'gh auth login' first."; exit 1; }

echo "☁️  Uploading to GitHub Releases..."

gh release create "$VERSION" \
    $BUILD_DIR/pd-cli \
    $BUILD_DIR/pd-cli.exe \
    $BUILD_DIR/pd-cli-macos-arm64 \
    $BUILD_DIR/pd-cli-macos-x64 \
    --title "$TITLE" \
    --notes "$NOTES" \
    --generate-notes 

echo "✅ Release $VERSION published successfully!"
echo "🔗 View it at: $(gh browse --releases --url)"