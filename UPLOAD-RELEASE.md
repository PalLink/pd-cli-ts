
# Release Management Guide

This project uses a set of platform-specific scripts to automate building binaries, syncing git tags, and uploading releases to GitHub.

## 📋 Prerequisites

Before running any release script, ensure you have:
1. **GitHub CLI (`gh`)**: Installed and authenticated (`gh auth login`).
2. **jq**: Installed (required to read the version from `package.json`).
3. **Git**: Configured with permissions to push tags to the repository.

---

## 🚀 How to Create a Release

Each platform has its own script to handle environment-specific logic. Always provide your release notes as a **single quoted string** in the first argument.

#### Disclaimer:
- I have not tested MacOS or Windows build/upload scripts since I'm primary to Linux.

### 🐧 Linux & 🍎 macOS
Use the Bash script. Ensure you have given it execution permissions once: `chmod +x upload-release.sh`.

```bash
./upload-release.sh "Added v0.1.6 features: standardized ItemID casing and added hybrid input logic."
```

### 🪟 Windows (PowerShell - Recommended)
PowerShell is the preferred method for Windows developers as it handles the GitHub CLI integration more reliably than CMD.

```powershell
.\upload-release.ps1 -Notes "Added v0.1.6 features: standardized ItemID casing and added hybrid input logic."
```

### 🪟 Windows (Command Prompt)
Use the legacy batch script if you are not using PowerShell.

```batch
upload-release.bat "Added v0.1.6 features: standardized ItemID casing and added hybrid input logic."
```

---

## 🛠 What the Scripts Do

When you run an upload script, the following sequence occurs:

1. **Validation**: Checks if a "Notes" string was provided.
2. **Version Sync**: Automatically pulls the version number from `package.json`.
3. **Build**: Calls the platform-specific build script (e.g., `build-bins.sh` or `build-bins.bat`) to generate fresh binaries for all 4 targets.
4. **Tagging**: Creates a local git tag (e.g., `v0.1.6`) and pushes it to the `origin` remote.
5. **Deployment**: Uses the GitHub CLI to create a new release, upload the 4 binary files, and set the Title and Notes.

---

## ⚠️ Troubleshooting

- **Tag already exists**: If the script fails because a tag exists on GitHub but not locally, run `git fetch --tags`.
- **Permission Denied (Mac/Linux)**: Ensure you ran `chmod +x` on both `upload-release.sh` and `build-bins.sh`.
- **Binary not found**: Ensure your build scripts are outputting files to the `./build` directory as expected.

---

## 🛠 Troubleshooting Windows Security Errors

If you see an error stating "running scripts is disabled on this system" when trying to run `.ps1` files, follow these steps:

1. **Temporary Bypass**:
   Run this command in your current PowerShell window:
   `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process`

2. **Permanent Solution**:
   Open PowerShell as **Administrator** and run:
   `Set-ExecutionPolicy RemoteSigned -Scope LocalMachine`