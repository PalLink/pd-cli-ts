#!/bin/bash
NOTES=$1

if [ -z "$NOTES" ]; then
    echo "❌ Error: No release notes provided."
    echo "Usage: ./upload-release.sh \"Your notes here\""
    exit 1
fi

VERSION="v$(jq -r '.version' package.json)"
TITLE="PalDefender CLI $VERSION"

echo "🚀 Starting Release Process for $VERSION..."
./build-bins.sh

echo "📌 Syncing tags..."
git tag "$VERSION" 2>/dev/null
git push origin "$VERSION"

echo "☁️  Uploading to GitHub..."
gh release create "$VERSION" ./build/pd-cli ./build/pd-cli.exe ./build/pd-cli-macos-arm64 ./build/pd-cli-macos-x64 --title "$TITLE" --notes "$NOTES" --generate-notes 

echo "✅ Release $VERSION published!"