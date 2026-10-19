#!/data/data/com.termux/files/usr/bin/bash
# نصب وابستگی‌ها روی Termux (از pip برای cryptography استفاده نکن، با Python جدید خراب می‌شه)
set -e
pkg update -y
pkg install -y python python-cryptography libsodium clang make binutils
SODIUM_INSTALL=system pip install --no-deps pynacl
pip install flask flask-sock arabic-reshaper
pip install paramiko || { pkg install -y rust && pip install paramiko; }
echo; echo "OK ✔  →  python app.py"
