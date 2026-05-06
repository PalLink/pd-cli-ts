#!/bin/bash

VERSION="v$(jq -r '.version' package.json)"
TITLE="PalDefender CLI $VERSION"
NOTES="Refactor program commands."
BUILD_DIR="./build"

echo "🚀 Starting Release Process for $VERSION..."

# 1. Ensure we have fresh binaries in the build folder
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

# 2. CRITICAL: Ensure the tag exists locally and push it to GitHub
# This solves the "tag exists locally but has not been pushed" error
echo "📌 Syncing tags with GitHub..."
git tag "$VERSION" 2>/dev/null || echo "Tag $VERSION already exists locally."
git push origin "$VERSION"

echo "☁️  Uploading to GitHub Releases..."

# 3. Create the release (now that the tag is definitely on GitHub)
gh release create "$VERSION" \
    $BUILD_DIR/pd-cli \
    $BUILD_DIR/pd-cli.exe \
    $BUILD_DIR/pd-cli-macos-arm64 \
    $BUILD_DIR/pd-cli-macos-x64 \
    --title "$TITLE" \
    --notes "$NOTES" \
    --generate-notes 

echo "✅ Release $VERSION published successfully!"