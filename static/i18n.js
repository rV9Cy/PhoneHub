const I18N = {
  fa: {
    tagline: "گوشی‌هات، یه ترمینال، یه جا", nav_devices: "دستگاه‌ها", nav_term: "ترمینال", nav_guide: "آموزش ADB",
    devices_title: "دستگاه‌های شما", devices_sub: "گوشی‌های اضافه‌شده و همین دستگاه",
    add_phone: "افزودن گوشی", this_device: "این دستگاه", open_local: "ترمینال این دستگاه", full_access: "دسترسی کامل",
    ssh_term: "ترمینال SSH", usb_term: "ترمینال USB", edit: "ویرایش", del: "حذف", refresh_ip: "IP جدید",
    prev_ips: "IPهای قبلی", no_ip: "IP نامشخص", no_user: "یوزرنیم تنظیم نشده",
    stat_devices: "دستگاه", stat_online: "آنلاین", stat_usb: "USB",
    targets: "اتصال‌ها", term_empty: "از لیست کناری یه دستگاه انتخاب کن تا ترمینال باز بشه",
    rtl_title: "نمایش راست‌چین متن فارسی", copy: "کپی انتخاب‌شده", paste: "چسباندن", clear: "پاک‌کردن صفحه", reconnect: "اتصال دوباره", fullscreen: "تمام‌صفحه",
    quick_sys: "سیستم", quick_net: "شبکه", quick_termux: "ترموکس",
    tab_net: "هات‌اسپات / وای‌فای", tab_manual: "دستی", modal_add: "افزودن گوشی", modal_edit: "ویرایش گوشی",
    usb_hint: "گوشی رو با کابل وصل کن و <b>USB debugging</b> رو روشن کن (آموزشش تو تب «آموزش ADB» هست). IP و یوزرنیم Termux خودکار پیدا می‌شه.",
    net_hint: "هات‌اسپات گوشی رو روشن کن و سیستم رو بهش وصل کن (یا برعکس)، بعد اسکن بزن. فقط گوشی‌هایی که <b>sshd</b> روشن دارن (پورت ۸۰۲۲ یا ۲۲) پیدا می‌شن.",
    search_again: "↻ جستجوی دوباره", push_setup: "⇪ ارسال اسکریپت راه‌اندازی به گوشی", scan: "🔍 اسکن شبکه", scanning: "در حال اسکن…",
    scan_nets: "شبکه‌ها", scan_none_net: "شبکه محلی پیدا نشد؛ به وای‌فای/هات‌اسپات وصل شو.", scan_none: "چیزی پیدا نشد. sshd روی گوشی روشنه؟",
    f_name: "اسم", f_port: "پورت", f_user: "یوزرنیم", f_pass: "پسورد", f_pass_note: "(اختیاری؛ فقط روی همین سیستم ذخیره می‌شه)", f_pass_saved: "ذخیره شده (برای تغییر بنویس)",
    save: "ذخیره", saved: "ذخیره شد", add: "افزودن", connect: "اتصال", cancel: "لغو", pw_title: "پسورد SSH", pw_hint: "اگه با کلید وصل می‌شی خالی بذار.",
    no_adb: "adb روی این سیستم پیدا نشد. نصبش کن (تب آموزش) و دوباره بزن.", no_phone: "گوشی‌ای وصل نیست. کابل رو چک کن و USB debugging رو روشن کن.",
    allow_phone: "روی گوشی Allow بزن", searching: "در حال جستجو…", default_name: "گوشی من", added: "اضافه شد", added_noip: "اضافه شد (IP پیدا نشد؛ وای‌فای گوشی رو روشن کن)",
    pushed: "فرستاده شد. توی Termux بزن:", err: "خطا", copied: "کپی شد", confirm_del: "حذف بشه؟", new_ip: "IP جدید", no_phone_conn: "گوشی وصل نیست",
    adb_ok: "وصل", adb_missing: "adb نیست", closed: "اتصال بسته شد", guide_copy: "کپی", local_ips: "IP محلی",
    termux: "ترموکس", localOnWin: "برای ترمینال ویندوز: pip install pywinpty"
  },
  en: {
    tagline: "All your phones. One terminal.", nav_devices: "Devices", nav_term: "Terminal", nav_guide: "ADB Guide",
    devices_title: "Your devices", devices_sub: "Added phones and this device",
    add_phone: "Add phone", this_device: "This device", open_local: "Open this device's terminal", full_access: "Full access",
    ssh_term: "SSH terminal", usb_term: "USB terminal", edit: "Edit", del: "Delete", refresh_ip: "New IP",
    prev_ips: "Previous IPs", no_ip: "Unknown IP", no_user: "No username set",
    stat_devices: "devices", stat_online: "online", stat_usb: "USB",
    targets: "Connections", term_empty: "Pick a device from the list to open a terminal",
    rtl_title: "Right-to-left Persian text", copy: "Copy selection", paste: "Paste", clear: "Clear screen", reconnect: "Reconnect", fullscreen: "Fullscreen",
    quick_sys: "System", quick_net: "Network", quick_termux: "Termux",
    tab_net: "Hotspot / Wi-Fi", tab_manual: "Manual", modal_add: "Add phone", modal_edit: "Edit phone",
    usb_hint: "Plug the phone in and turn on <b>USB debugging</b> (see the “ADB Guide” tab). The IP and Termux username are detected automatically.",
    net_hint: "Turn on the phone's hotspot and join it from this computer (or the other way round), then scan. Only phones running <b>sshd</b> (port 8022 or 22) are found.",
    search_again: "↻ Search again", push_setup: "⇪ Send setup script to phone", scan: "🔍 Scan network", scanning: "Scanning…",
    scan_nets: "Networks", scan_none_net: "No local network found; join a Wi-Fi/hotspot first.", scan_none: "Nothing found. Is sshd running on the phone?",
    f_name: "Name", f_port: "Port", f_user: "Username", f_pass: "Password", f_pass_note: "(optional; stored on this machine only)", f_pass_saved: "Saved (type to change)",
    save: "Save", saved: "Saved", add: "Add", connect: "Connect", cancel: "Cancel", pw_title: "SSH password", pw_hint: "Leave empty if you use a key.",
    no_adb: "adb was not found on this machine. Install it (see the guide tab) and retry.", no_phone: "No phone connected. Check the cable and enable USB debugging.",
    allow_phone: "Tap Allow on the phone", searching: "Searching…", default_name: "My phone", added: "Added", added_noip: "Added (no IP found; turn on the phone's Wi-Fi)",
    pushed: "Sent. In Termux run:", err: "Error", copied: "Copied", confirm_del: "Delete?", new_ip: "New IP", no_phone_conn: "No phone connected",
    adb_ok: "connected", adb_missing: "no adb", closed: "connection closed", guide_copy: "Copy", local_ips: "Local IP",
    termux: "Termux", localOnWin: "For a Windows terminal: pip install pywinpty"
  }
};

const GUIDE = {
  fa: {
    title: "فعال‌کردن ADB روی گوشی", sub: "یک‌بار انجام می‌دی، بعدش گوشی با USB یا وای‌فای قابل‌اتصاله.",
    steps: [
      { t: "۱. روشن‌کردن Developer options", b: "<b>Settings ← About phone</b> برو و روی <b>Build number</b> هفت بار پشت‌سرهم بزن تا پیام «You are now a developer» بیاد. (شیائومی: روی <b>MIUI/HyperOS version</b> بزن.)" },
      { t: "۲. روشن‌کردن USB debugging", b: "<b>Settings ← System ← Developer options</b> و <b>USB debugging</b> رو روشن کن.<br>شیائومی/پوکو هم <b>Install via USB</b> و <b>USB debugging (Security settings)</b> رو روشن کن. سامسونگ و بقیه معمولاً همین یه گزینه کافیه." },
      { t: "۳. نصب adb روی سیستم", b: "فقط برای حالت USB لازمه (روی خود گوشی/Termux لازم نیست).", code: "# Windows\nwinget install Google.PlatformTools\n\n# Ubuntu / Debian\nsudo apt install adb\n\n# Arch\nsudo pacman -S android-tools\n\n# macOS\nbrew install android-platform-tools" },
      { t: "۴. وصل‌کردن و تأیید", b: "کابل رو بزن، حالت USB رو روی <b>File transfer</b> بذار. روی گوشی پیام «Allow USB debugging?» میاد؛ <b>Always allow</b> رو تیک بزن و Allow کن. بعد بررسی کن:", code: "adb devices\n# باید بنویسه:  XXXXXXXX    device" },
      { t: "۵. اگه کار نکرد", b: "<b>unauthorized</b>: توی Developer options گزینه <b>Revoke USB debugging authorizations</b> رو بزن و دوباره وصل کن.<br><b>offline / چیزی نمیاد</b>: کابل یا پورت رو عوض کن و این دستور رو بزن:", code: "adb kill-server && adb start-server" },
      { t: "۶. بدون کابل (Wireless debugging، اندروید ۱۱+)", b: "<b>Developer options ← Wireless debugging</b> رو روشن کن و <b>Pair device with pairing code</b> رو بزن. بعد:", code: "adb pair IP:PORT      # کد جفت‌سازی رو بنویس\nadb connect IP:PORT   # IP:PORT صفحه اصلی Wireless debugging" },
      { t: "۷. فعال‌کردن SSH روی Termux (برای ترمینال SSH)", b: "Termux رو از F-Droid یا GitHub نصب کن (نسخه Play Store قدیمیه). از تب دستگاه‌ها «ارسال اسکریپت راه‌اندازی» رو بزن، یا دستی:", code: "pkg install -y openssh\npasswd          # یه پسورد بذار\nsshd            # پورت ۸۰۲۲\nwhoami          # یوزرنیم، مثلاً u0_a123" }
    ]
  },
  en: {
    title: "Enable ADB on your phone", sub: "Do it once, then the phone is reachable over USB or Wi-Fi.",
    steps: [
      { t: "1. Turn on Developer options", b: "Go to <b>Settings → About phone</b> and tap <b>Build number</b> seven times until you see “You are now a developer”. (Xiaomi: tap <b>MIUI/HyperOS version</b>.)" },
      { t: "2. Turn on USB debugging", b: "Open <b>Settings → System → Developer options</b> and enable <b>USB debugging</b>.<br>On Xiaomi/Poco also enable <b>Install via USB</b> and <b>USB debugging (Security settings)</b>. Samsung and most others only need the one switch." },
      { t: "3. Install adb on your computer", b: "Only needed for USB mode (not on the phone/Termux itself).", code: "# Windows\nwinget install Google.PlatformTools\n\n# Ubuntu / Debian\nsudo apt install adb\n\n# Arch\nsudo pacman -S android-tools\n\n# macOS\nbrew install android-platform-tools" },
      { t: "4. Connect and authorize", b: "Plug in the cable and set USB mode to <b>File transfer</b>. Tap <b>Allow</b> on the “Allow USB debugging?” prompt (tick <b>Always allow</b>). Then check:", code: "adb devices\n# should print:  XXXXXXXX    device" },
      { t: "5. If it doesn't work", b: "<b>unauthorized</b>: in Developer options tap <b>Revoke USB debugging authorizations</b> and reconnect.<br><b>offline / nothing listed</b>: try another cable or port and run:", code: "adb kill-server && adb start-server" },
      { t: "6. No cable (Wireless debugging, Android 11+)", b: "Enable <b>Developer options → Wireless debugging</b> and tap <b>Pair device with pairing code</b>. Then:", code: "adb pair IP:PORT      # enter the pairing code\nadb connect IP:PORT   # the IP:PORT on the main Wireless debugging screen" },
      { t: "7. Enable SSH in Termux (for the SSH terminal)", b: "Install Termux from F-Droid or GitHub (the Play Store build is outdated). Use “Send setup script” in the Devices tab, or do it by hand:", code: "pkg install -y openssh\npasswd          # set a password\nsshd            # port 8022\nwhoami          # your username, e.g. u0_a123" }
    ]
  }
};
