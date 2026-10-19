<div align="center">

<img src="docs/poster.png" alt="Phone Hub" width="520">

# Phone Hub

**All your phones. One terminal.**

Manage Android phones and get a full terminal in your browser, over USB, hotspot or SSH. It runs on your own machine and nothing leaves it.

[🇮🇷 فارسی](README.md) · 🇬🇧 **ENG**

</div>

## ✨ Features

- **Full terminal in the browser**: tabs, themes, font size, quick commands and a mobile key bar (Esc, Ctrl, Tab, arrows)
- **This device's own terminal** with full access, on Android (Termux), Windows, Linux and macOS
- **Phone list** with current IP, **previous IPs** and online status (SSH / USB)
- **Add by USB** (adb): IP and Termux username are detected automatically
- **Add by hotspot / Wi-Fi**: network scan finds phones running SSH
- **USB terminal** straight through `adb shell` (no Termux needed)
- **Persian text, right-to-left and joined**, inside the terminal (`RTL` button on the terminal bar)
- **Persian and English UI** (`EN / فا` button) plus an in-app **ADB setup guide**

## 🚀 Install & run

### 📱 Mobile (Termux)

Install [Termux](https://f-droid.org/packages/com.termux/) from F-Droid or GitHub (the Play Store build is outdated).

```bash
pkg install -y unzip
termux-setup-storage
cp ~/storage/downloads/phone-hub.zip ~ && unzip phone-hub.zip && cd phone-hub
bash termux-install.sh
python app.py
```

The printed link opens automatically (or copy it into the phone's browser).

> ⚠️ Never run `pip install cryptography` on Termux; it breaks with newer Python. `termux-install.sh` installs the right build from `pkg`.
> USB/adb mode can't work on the phone itself; use “Manual” or “Scan”.

### 🪟 Windows

1. Install [Python 3.10+](https://www.python.org/downloads/) (tick **Add Python to PATH**).
2. Extract the zip and double-click **`run.bat`**.
3. For USB mode: `winget install Google.PlatformTools`

### 🐧 Linux / 🍎 macOS

```bash
sudo apt install python3 python3-venv adb   # macOS: brew install python android-platform-tools
unzip phone-hub.zip && cd phone-hub
./run.sh
```

Dependencies install automatically on first run. Another port: `PORT=5001 ./run.sh`

## 🔐 First login

The app prints a personal link:

```
http://127.0.0.1:5000/?k=XXXXXXXX
```

The first time you open `http://127.0.0.1:5000` you are **signed in automatically** and the browser remembers it. For another browser, or after clearing cookies, open the link above or enter the token (`cat data/.token`) on the lock page. The local terminal gives full access, so other browsers can't get in without it.

## 📱 Adding a phone

| Method | Steps |
|---|---|
| **USB** | Plug in, enable USB debugging, “Add phone → USB” |
| **Hotspot** | Turn on the hotspot, join it from this machine, “Add phone → Scan” |
| **Manual** | IP, port (default 8022), username and password |

A step-by-step ADB guide (wireless too) lives in the app's **ADB Guide** tab.

To enable SSH on the phone, run in Termux (or use “Send setup script” in the app):

```bash
pkg install -y openssh && passwd && sshd
```

## 🛡️ Security

- The site listens on `127.0.0.1` only and checks Host/Origin.
- Access is protected by a personal token (`data/.token`).
- A password is stored only if you type it in the form (`data/devices.json`). Leave it empty to be asked each time, or use an SSH key.
- Never expose the port to the internet.

## 🧰 Troubleshooting

| Problem | Fix |
|---|---|
| `adb` not found | Install `adb` (see the guide tab) and reopen the terminal |
| Phone shows `unauthorized` | Tap Allow on the phone, or Revoke USB debugging authorizations and reconnect |
| `PyLong_Type` error in Termux | `pip uninstall -y cryptography pynacl`, then `bash termux-install.sh` |
| Windows terminal won't open | `pip install pywinpty` |
| Port 5000 is busy | `PORT=5001` |

## 🗂️ Layout

```
app.py          Flask backend (API, scan, web terminal)
rtl.py          Right-to-left Persian handling for terminal output
static/         UI (FA/EN, xterm.js, fonts)
phone/          SSH setup script for Termux
termux-install.sh · run.sh · run.bat
```

## ❤️ Author

Made by **Rvn** · [MIT](LICENSE) licensed
