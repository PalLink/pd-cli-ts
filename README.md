# PalDefender CLI (`pd-cli`)

[![version](https://img.shields.io/npm/v/paldefender-cli?color=cyan)](https://www.npmjs.com/package/paldefender-cli)
[![license](https://img.shields.io/badge/license-MIT-green)](https://github.com/PalLink/pd-cli-ts/blob/main/LICENSE)
[![status](https://img.shields.io/badge/status-beta-orange)](#)

A high-performance, type-safe Command Line Interface for managing PalDefender REST API servers. `pd-cli` features a "Hybrid" input system, allowing you to use simple space-separated lists or complex JSON for administrative actions.

---

## 📦 Installation

### Option 1: NPM (Recommended)
```bash
npm install -g paldefender-cli
```

### Option 2: Standalone Binaries (GitHub Releases)
Download pre-compiled binaries for [Windows, Linux, or MacOS](https://github.com/PalLink/pd-cli-ts/releases).
> **Note for Unix (Linux/Mac):** You must run `chmod +x pd-cli` before executing.

### Option 3: Compile Binaries yourself
Clone this repo and prep (You must have `git, node, and npm` installed on your machine)
```bash
git clone https://github.com/PalLink/pd-cli-ts.git
cd pd-cli-ts
npm install
# build
# Linux:
./build-bins.sh
# Windows (Powershell):
.\build-bins.ps1
# Windows (CMD):
build-bins.bat
```
You now have a "build" directory with the bins inside. Open it and run the correct one for your system.

---

## ⚙️ Configuration

1. **Interactive Setup**: Run `pd-cli configure` to save your host and admin token.
2. **Connectivity Check**: Run `pd-cli test-connection` to verify your credentials and server status.
3. **Reset**: Run `pd-cli clear-config` to wipe stored credentials.

---

## 🛠 Usage

### 🔍 Discovery & Lookup
| Command | Description | Example |
| :--- | :--- | :--- |
| `getPlayers` | List all players | `pd-cli getPlayers` |
| `getGuilds` | List all guilds | `pd-cli getGuilds` |
| `getPlayer` | Detailed player profile | `pd-cli getPlayer "ID"` |
| `getPals` | List a player's Pals | `pd-cli getPals "ID"` |
| `getItems` | View player inventory | `pd-cli getItems "ID"` |
| `findPlayerByName` | Search by exact name | `pd-cli findPlayerByName "Glitch"` |

### 🛠 Administrative "Give" Actions
These commands support **Hybrid Logic**: pass a list of names for quantity 1, or a JSON string for specific counts.

#### Items
```bash
# List format (Quantity 1 each)
pd-cli giveItems "ID" Stone Wood

# JSON format (Specific counts) - Requires "ItemID"
pd-cli giveItems "ID" '[{"ItemID": "Stone", "Count": 100}]'
```

#### Pals
```bash
# List format (Level 1)
pd-cli givePals "ID" Anubis Lamball

# JSON format (Specific Level)
pd-cli givePals "ID" '{"PalName": "Anubis", "Level": 50}'
```

#### Eggs
```bash
# You must supply EggID AND either PalID or PalTemplate 
# List format
pd-cli givePalEggs "ID" PalEgg_Dark_01 PalEgg_Fire_05

# JSON format
pd-cli givePalEggs "ID" '["PalEgg_Dark_05"]'
```

### 📈 Progression & Tech
| Command | Example |
| :--- | :--- |
| `giveProgression` | `pd-cli giveProgression "ID" '{"EXP": 5000, "Lifmunks": 10, "AncientTechnologyPoints": 2, "TechnologyPoints": 4}'` |
| `giveRecipeMaterials` | `pd-cli giveRecipeMaterials "ID" PalSphere 5` |
| `learnTech` | `pd-cli learnTech "ID" Unlock_Sphere_Tier_01` |
| `forgetTech` | `pd-cli forgetTech "ID" All` (Resets tree) |

---

## 💡 Important: Windows CMD vs PowerShell/Linux

Windows **CMD** does not support single quotes (`'`) for JSON. You must use double quotes and escape the internal quotes with a backslash (`\"`).

**CMD Usage:**
```cmd
pd-cli.exe giveItems "ID" "[{\"ItemID\": \"Stone\", \"Count\": 10}]"
```

**PowerShell / Linux / MacOS Usage:**
```bash
pd-cli giveItems "ID" '[{"ItemID": "Stone", "Count": 10}]'
```

---

## 🚀 Key Features

- **Hybrid Input**: Choose between simple string lists or structured JSON.
- **Auto-Discovery**: CLI stays in sync with the `paldefender-rest-client` library.
- **Formatted Output**: Results are displayed in clean, readable boxes with status spinners.
- **No-Node Binaries**: Use the standalone executables if you don't want to install Node.js.

---

## 📜 License
MIT © [PalLink](https://github.com/PalLink)