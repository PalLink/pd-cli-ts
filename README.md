# PalDefender CLI (`pd-cli`)

[![version](https://img.shields.io/badge/version-0.0.1-cyan)](https://www.npmjs.com/package/pd-cli)
[![license](https://img.shields.io/badge/license-MIT-green)](https://github.com/GlitchApotamus/pd-cli/blob/main/LICENSE)
[![status](https://img.shields.io/badge/status-active-blue)](#)

A high-performance, type-safe Command Line Interface for managing PalDefender REST API servers. `pd-cli` features dynamic method discovery, allowing it to stay perfectly in sync with the core library automatically.

---

## 📦 Installation

Install the CLI globally via NPM to access the `pd-cli` command from anywhere on your system:

```bash
npm install -g pd-cli
```

---

## ⚙️ Configuration

The CLI needs to know how to connect to your PalDefender server (Token, Host, and Port). 

### Interactive Setup (Recommended)
Run the following command to securely save your credentials to a local config store. This eliminates the need for environment variables.

```bash
pd-cli configure
```
*The CLI will prompt you for your details and store them at:* `~/.config/pd-cli-nodejs/config.json` (Linux/macOS) or `%APPDATA%\pd-cli-nodejs` (Windows).

### Manual Setup (Environment Variables)
If you prefer not to use the config store, you can set the following variables:

**Linux / macOS**
```bash
export PD_TOKEN="your_password"
export PD_HOST="127.0.0.1"
export PD_PORT="17993"
```

**Windows (PowerShell)**
```powershell
$env:PD_TOKEN = "your_password"
$env:PD_HOST = "127.0.0.1"
$env:PD_PORT = "17993"
```

---

## 🛠 Usage

`pd-cli` uses **Parameter Reflection** to map library functions directly to the terminal.

### Search for Players
Find a player's Unique ID using their display name:
```bash
# Assume a player name is "Player-1"
# Partial search (case-insensitive)
pd-cli findPlayersByPartialName "player"
# Returns: {"players": [ { Player-1 } ]}
# Exact match (case-sensitive)
pd-cli findPlayerByName "Player-1"
# Returns: { Player-1 } 
```

### Managing Items
Commands requiring arrays (like `givePals`) accept JSON strings. **Wrap JSON in single quotes (`'`)** to ensure the shell passes the data correctly.

```bash
# Give a level 50 Anubis
pd-cli givePals "76561198000000000" '[{"PalName": "Anubis", "Level": 50}]'

# Give a Large Dark Egg
pd-cli givePalEggs "76561198000000000" '[{"EggID": "PalEgg_Dark_05", "PalName": "Nyafia", "Level": 1}]'
```

---

## ❓ Discovery & Help

To see every command available in the current version of the library:
```bash
pd-cli --help
```

To see the specific parameters required for a command:
```bash
pd-cli givePals --help
```

---

## 🚀 Key Features

- **Dynamic Discovery**: New methods added to the `PalDefenderClient` appear in the CLI automatically without manual updates.
- **Visual Feedback**: Real-time progress spinners for network requests.
- **Auto-Parsing**: Automatically detects and parses JSON strings into JavaScript objects.
- **Cross-Platform**: Tested on a Ubuntu server. ***Testing Requested on other machines***.