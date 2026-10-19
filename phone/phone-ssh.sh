#!/data/data/com.termux/files/usr/bin/bash
# phone-ssh — گرفتن IP گوشی و راه‌اندازی SSH در Termux
PORT=8022
CONF="$HOME/.phone-ssh.conf"

c_ok="\033[32m"; c_err="\033[31m"; c_dim="\033[90m"; c_off="\033[0m"
ok(){ echo -e "${c_ok}✔${c_off} $*"; }
err(){ echo -e "${c_err}✘${c_off} $*"; }

local_ip(){
  local ip=""
  ip=$(ip -4 addr show wlan0 2>/dev/null | awk '/inet /{print $2}' | cut -d/ -f1)
  [ -z "$ip" ] && ip=$(ifconfig 2>/dev/null | awk '/inet /&&!/127.0.0.1/{print $2; exit}')
  [ -z "$ip" ] && command -v termux-wifi-connectioninfo >/dev/null && \
    ip=$(termux-wifi-connectioninfo 2>/dev/null | grep '"ip"' | cut -d'"' -f4)
  [ -z "$ip" ] && command -v python >/dev/null && \
    ip=$(python -c "import socket;s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);s.connect(('8.8.8.8',80));print(s.getsockname()[0])" 2>/dev/null)
  echo "$ip"
}

public_ip(){
  for u in https://api.ipify.org https://ifconfig.me https://ipinfo.io/ip https://icanhazip.com; do
    r=$(curl -s --max-time 5 "$u" | tr -d '[:space:]')
    [[ "$r" =~ ^[0-9.]+$ ]] && { echo "$r"; return; }
  done
}

setup(){
  pkg update -y && pkg install -y openssh curl iproute2 net-tools python || return 1
  termux-setup-storage 2>/dev/null
  mkdir -p ~/.ssh && chmod 700 ~/.ssh
  touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
  echo "یه پسورد برای SSH بذار:"; passwd
  ok "نصب تموم شد. حالا: ./phone-ssh.sh start"
}

start(){
  command -v sshd >/dev/null || { err "اول setup بزن"; exit 1; }
  pkill sshd 2>/dev/null; sshd -p $PORT && ok "sshd روشن شد (پورت $PORT)"
  command -v termux-wake-lock >/dev/null && termux-wake-lock
  status
}

stop(){ pkill sshd && ok "خاموش شد"; command -v termux-wake-unlock >/dev/null && termux-wake-unlock; }

status(){
  local u lip pip
  u=$(whoami); lip=$(local_ip); pip=$(public_ip)
  pgrep sshd >/dev/null && ok "sshd در حال اجراست" || err "sshd خاموشه"
  echo
  [ -n "$lip" ] && echo -e "شبکه محلی (همون وای‌فای):\n  ssh -p $PORT $u@$lip"
  [ -n "$pip" ] && echo -e "\nآی‌پی عمومی: $pip ${c_dim}(پشت NAT/CGNAT معمولاً مستقیم باز نمی‌شه، از tunnel استفاده کن)${c_off}"
  echo
}

addkey(){
  [ -z "$1" ] && { echo "استفاده: ./phone-ssh.sh addkey \"ssh-ed25519 AAAA...\""; exit 1; }
  echo "$1" >> ~/.ssh/authorized_keys && ok "کلید اضافه شد"
}

nopass(){
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' $PREFIX/etc/ssh/sshd_config
  grep -q '^PasswordAuthentication' $PREFIX/etc/ssh/sshd_config || echo "PasswordAuthentication no" >> $PREFIX/etc/ssh/sshd_config
  ok "ورود با پسورد غیرفعال شد (فقط کلید). sshd رو دوباره start کن"
}

# tunnel معکوس: گوشی به یه VPS وصل می‌شه، از بیرون با پورت VPS میای تو گوشی
tunnel(){
  [ -z "$1" ] && { echo "استفاده: ./phone-ssh.sh tunnel user@vps-ip [remote_port=2222]"; exit 1; }
  local rp=${2:-2222}
  command -v autossh >/dev/null || pkg install -y autossh
  ok "تونل باز شد. از هرجا: ssh -p $rp $(whoami)@<vps-ip> (روی VPS باید GatewayPorts/ssh -p $rp localhost بزنی)"
  autossh -M 0 -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R $rp:localhost:$PORT "$1"
}

case "$1" in
  setup) setup;; start) start;; stop) stop;; status) status;;
  addkey) addkey "$2";; nopass) nopass;; tunnel) tunnel "$2" "$3";;
  *) echo "setup | start | stop | status | addkey \"<کلید>\" | nopass | tunnel user@vps [port]";;
esac
