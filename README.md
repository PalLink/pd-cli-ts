# PalDefender CLI (`pd-cli`)

[![version](https://img.shields.io/npm/v/paldefender-cli?color=cyan)](https://www.npmjs.com/package/paldefender-cli)
[![license](https://img.shields.io/badge/license-MIT-green)](https://github.com/PalLink/pd-cli-ts/blob/main/LICENSE)
[![status](https://img.shields.io/badge/status-beta-orange)](#)

A high-performance, type-safe Command Line Interface for managing PalDefender REST API servers. `pd-cli` features dynamic method discovery, allowing it to stay perfectly in sync with the core library automatically.

---

## 📦 Installation

### Option 1: NPM (Recommended for Developers)
Install the CLI globally to access the `pd-cli` command from anywhere:

```bash
npm install -g paldefender-cli
```

### Option 2: Standalone Binaries (GitHub Releases)
If you don't have Node.js installed, download the pre-compiled binary for your OS from the [Releases](https://github.com/PalLink/pd-cli-ts/releases) page:
- **Windows**: `pd-cli.exe`
- **Linux**: `pd-cli`
- **MacOS (Silicon)**: `pd-cli-macos-arm64`
- **MacOS (Intel)**: `pd-cli-macos-x64`

---

## ⚙️ Configuration

The CLI needs to connect to your PalDefender server. 

### Interactive Setup
Run this first to securely save your credentials. This avoids needing to set environment variables every session.

```bash
pd-cli configure
```

### Connection Testing
Verify your Host, Port, and Token are working correctly without fetching massive data:
```bash
pd-cli test-connection
```

### Security
To wipe all stored credentials from your machine:
```bash
pd-cli clear-config
```

---

## 🛠 Usage

`pd-cli` uses **Parameter Reflection** to map library functions directly to the terminal.

### Search for Players
Find a player's Unique ID using their display name:
```bash
# Partial search (case-insensitive)
pd-cli findPlayersByPartialName "player"

# Exact match (case-sensitive)
pd-cli findPlayerByName "GlitchApotamus"
```

### Managing Items & Pals
Commands requiring arrays (like `giveItems` or `givePals`) accept JSON strings. **Wrap JSON in single quotes (`'`)** to ensure the shell passes the data correctly.

```bash
# Give items (Accepts GiveItem[])
pd-cli giveItems "steam_76561198..." 'CopperIngot'
pd-cli giveItems "steam_76561198..." '[{"ItemID": "CopperIngot", "Count": 15}]'
pd-cli giveItems "steam_76561198..." '[{"ItemID": "CopperIngot", "Count": 15}]'

# Give a level 50 Anubis
pd-cli givePals "steam_76561198..." '[{"PalName": "Anubis", "Level": 50}]'
```

---

## 🚀 Key Features

- **Dynamic Discovery**: New methods added to the `PalDefenderClient` library appear in the CLI automatically.
- **Smart 401 Handling**: Distinguishes between a server being offline and an invalid admin token.
- **Persistent Storage**: Uses `conf` to store server details locally so you don't have to re-enter them.
- **Cross-Platform Binaries**: Native executables available for Windows and Linux (no Node.js required).
- **Visual Feedback**: Real-time progress spinners and formatted result boxes.

---

## ❓ Discovery & Help

To see every command available in the current version:
```bash
pd-cli --help
```

To see the specific parameters required for a dynamic method:
```bash
pd-cli givePalEggs --help
```

---

## 📜 License

MIT © [PalLink](https://github.com/PalLink)