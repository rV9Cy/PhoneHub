#!/usr/bin/env python3
"""Phone Hub — مدیریت گوشی‌ها + ترمینال وب (SSH / ADB). فقط روی localhost اجرا می‌شه."""
import codecs, getpass, hmac, json, os, platform, re, secrets, shutil, socket, subprocess, sys, threading, time, uuid, webbrowser
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import paramiko
from rtl import transform as rtl_transform
from flask import Flask, jsonify, request, send_from_directory, abort, redirect
from flask_sock import Sock

BASE = Path(__file__).parent
DATA = BASE / "data"; DATA.mkdir(exist_ok=True)
DB = DATA / "devices.json"
HOST, PORT = "127.0.0.1", int(os.environ.get("PORT", 5000))
ALLOWED_HOSTS = {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}
WIN = os.name == "nt"
NOWIN = {"creationflags": 0x08000000} if WIN else {}

app = Flask(__name__, static_folder="static", static_url_path="/static")
sock = Sock(app)
lock = threading.Lock()


# ---------- امنیت: localhost + توکن شخصی (چون ترمینال لوکال دسترسی کامل می‌ده) ----------
def get_token():
    f = DATA / ".token"
    if f.exists(): return f.read_text().strip()
    t = secrets.token_urlsafe(18); f.write_text(t)
    try: os.chmod(f, 0o600)
    except Exception: pass
    return t

TOKEN = get_token()
authed = lambda: hmac.compare_digest(request.cookies.get("ph", ""), TOKEN)

@app.before_request
def guard():
    if request.headers.get("Host", "") not in ALLOWED_HOSTS:
        abort(403)
    origin = request.headers.get("Origin")
    if origin and origin.split("://", 1)[-1] not in ALLOWED_HOSTS:
        abort(403)
    if request.method in ("POST", "PATCH", "DELETE") and not request.is_json and request.content_length:
        abort(415)
    if request.path.startswith(("/api", "/ws")) and not authed():
        abort(401)


# ---------- ذخیره‌سازی ----------
def load():
    try:
        return json.loads(DB.read_text("utf-8"))
    except Exception:
        return []

def save(devs):
    DB.write_text(json.dumps(devs, ensure_ascii=False, indent=1), "utf-8")
    try: os.chmod(DB, 0o600)
    except Exception: pass

def find(devs, did):
    return next((d for d in devs if d["id"] == did), None)

def public(d):
    d = dict(d); ssh = dict(d.get("ssh") or {})
    ssh["has_password"] = bool(ssh.pop("password", ""))
    d["ssh"] = ssh
    return d

def note_ip(d, ip):
    if not ip: return
    h = d.setdefault("ip_history", [])
    if not h or h[-1]["ip"] != ip:
        h.append({"ip": ip, "ts": int(time.time())})
        del h[:-8]
    d["ip"] = ip


# ---------- ADB ----------
def adb_bin():
    return shutil.which("adb")

def adb(*args, timeout=15):
    p = subprocess.run([adb_bin(), *args], capture_output=True, text=True, timeout=timeout, **NOWIN)
    return (p.stdout or "") + (p.stderr or "")

def adb_devices():
    if not adb_bin(): return None
    out = adb("devices", "-l")
    res = []
    for ln in out.splitlines()[1:]:
        m = re.match(r"(\S+)\s+(device|unauthorized|offline)\b(.*)", ln)
        if m:
            model = re.search(r"model:(\S+)", m.group(3))
            res.append({"serial": m.group(1), "state": m.group(2), "model": model.group(1) if model else ""})
    return res

def adb_ip(serial):
    out = adb("-s", serial, "shell", "ip", "-4", "-o", "addr", "show")
    ips = [(m.group(1), m.group(2)) for m in re.finditer(r"\d+:\s+(\S+)\s+inet\s+(\d+\.\d+\.\d+\.\d+)", out)]
    ips = [(i, a) for i, a in ips if i != "lo"]
    for pref in (r"^wlan0$", r"^(swlan|ap|wlan)", r"^(rndis|usb|eth)"):
        for i, a in ips:
            if re.match(pref, i): return a
    return ips[0][1] if ips else ""

def termux_user(serial):
    out = adb("-s", serial, "shell", "pm", "list", "packages", "-U", "com.termux")
    m = re.search(r"uid:(\d+)", out)
    return f"u0_a{int(m.group(1)) - 10000}" if m else ""


# ---------- اسکن شبکه (هات‌اسپات / وای‌فای / USB tethering) ----------
def local_ips():
    ips = set()
    cmds = [["ip", "-4", "-o", "addr"], ["ifconfig"], ["ipconfig"]]
    for c in cmds:
        if not shutil.which(c[0]): continue
        try:
            out = subprocess.run(c, capture_output=True, text=True, timeout=5, **NOWIN).stdout
            ips |= set(re.findall(r"\b(\d{1,3}(?:\.\d{1,3}){3})\b", out))
        except Exception: pass
    try: ips |= {i[4][0] for i in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)}
    except Exception: pass
    try:
        u = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); u.connect(("10.255.255.255", 1)); ips.add(u.getsockname()[0]); u.close()
    except Exception: pass
    def private(ip):
        a = [int(x) for x in ip.split(".")]
        return a[0] == 10 or (a[0] == 192 and a[1] == 168) or (a[0] == 172 and 16 <= a[1] <= 31)
    return sorted(i for i in ips if private(i) and not i.endswith((".0", ".255")))

def probe(ip, port):
    try:
        with socket.create_connection((ip, port), timeout=0.5) as s:
            s.settimeout(0.8)
            try: banner = s.recv(64).decode("utf-8", "ignore").strip()
            except Exception: banner = ""
            return {"ip": ip, "port": port, "banner": banner} if banner.startswith("SSH-") else None
    except Exception:
        return None

def scan():
    mine = local_ips()
    nets = sorted({".".join(i.split(".")[:3]) for i in mine})
    targets = [(f"{n}.{h}", p) for n in nets for h in range(1, 255) for p in (8022, 22) if f"{n}.{h}" not in mine]
    with ThreadPoolExecutor(250) as ex:
        found = [r for r in ex.map(lambda t: probe(*t), targets) if r]
    return {"nets": [n + ".0/24" for n in nets], "found": found}


# ---------- API ----------
@app.get("/")
def index():
    claim = DATA / ".claimed"
    k = request.args.get("k", "")
    ok_link = bool(k) and hmac.compare_digest(k, TOKEN)
    # اولین بازدیدِ لوکال خودکار وارد می‌شه؛ بعدش فقط مرورگری که کوکی داره (یا با توکن)
    first = not claim.exists() and request.remote_addr in ("127.0.0.1", "::1")
    if ok_link or (first and not authed()):
        if first: claim.write_text("1")
        r = redirect("/")
        r.set_cookie("ph", TOKEN, httponly=True, samesite="Strict", max_age=86400 * 365)
        return r
    if not authed():
        return send_from_directory(BASE / "static", "locked.html"), 401
    return send_from_directory(BASE / "static", "index.html")

@app.get("/api/local")
def local_info():
    return jsonify(host=socket.gethostname(), user=getpass.getuser(), os=platform.system(), release=platform.release(),
                   termux=bool(os.environ.get("TERMUX_VERSION")) or "com.termux" in str(Path.home()),
                   shell=os.path.basename(os.environ.get("SHELL") or os.environ.get("COMSPEC") or "sh"),
                   ips=local_ips(), pty=local_pty_ok())

@app.get("/api/devices")
def devices():
    return jsonify([public(d) for d in load()])

@app.post("/api/devices")
def add_device():
    b = request.get_json(force=True)
    d = {"id": uuid.uuid4().hex[:8], "name": (b.get("name") or "گوشی من").strip(), "serial": b.get("serial", ""),
         "ip": "", "ip_history": [], "created": int(time.time()),
         "ssh": {"host": "", "port": 8022, "user": "", "password": ""}}
    d["ssh"].update({k: b.get("ssh", {}).get(k, d["ssh"][k]) for k in d["ssh"]})
    note_ip(d, d["ssh"]["host"])
    with lock:
        devs = load(); devs.append(d); save(devs)
    return jsonify(public(d))

@app.patch("/api/devices/<did>")
def edit_device(did):
    b = request.get_json(force=True)
    with lock:
        devs = load(); d = find(devs, did) or abort(404)
        if "name" in b: d["name"] = b["name"].strip() or d["name"]
        if "ssh" in b:
            s = b["ssh"]
            for k in ("host", "port", "user"):
                if k in s: d["ssh"][k] = int(s[k]) if k == "port" else s[k].strip()
            if s.get("password"): d["ssh"]["password"] = s["password"]
            if s.get("forget_password"): d["ssh"]["password"] = ""
            note_ip(d, d["ssh"]["host"])
        save(devs)
    return jsonify(public(d))

@app.delete("/api/devices/<did>")
def del_device(did):
    with lock:
        devs = [d for d in load() if d["id"] != did]; save(devs)
    return jsonify(ok=True)

@app.get("/api/adb")
def api_adb():
    devs = adb_devices()
    return jsonify(available=devs is not None, devices=devs or [])

@app.post("/api/adb/add")
def adb_add():
    b = request.get_json(force=True); serial = b["serial"]
    ip, user = adb_ip(serial), termux_user(serial)
    d = {"id": uuid.uuid4().hex[:8], "name": b.get("name") or "گوشی USB", "serial": serial, "ip": "", "ip_history": [],
         "created": int(time.time()), "ssh": {"host": ip, "port": 8022, "user": user, "password": ""}}
    note_ip(d, ip)
    with lock:
        devs = load(); devs.append(d); save(devs)
    return jsonify(public(d))

@app.post("/api/devices/<did>/refresh-ip")
def refresh_ip(did):
    with lock:
        devs = load(); d = find(devs, did) or abort(404)
        if not d.get("serial") or not adb_bin(): return jsonify(error="برای به‌روزرسانی IP گوشی باید با USB وصل باشه"), 400
        ip = adb_ip(d["serial"])
        if not ip: return jsonify(error="IP پیدا نشد؛ وای‌فای/هات‌اسپات گوشی روشنه؟"), 400
        note_ip(d, ip); d["ssh"]["host"] = ip
        if not d["ssh"]["user"]: d["ssh"]["user"] = termux_user(d["serial"])
        save(devs)
    return jsonify(public(d))

@app.post("/api/adb/push-setup")
def push_setup():
    serial = request.get_json(force=True)["serial"]
    out = adb("-s", serial, "push", str(BASE / "phone" / "phone-ssh.sh"), "/sdcard/Download/phone-ssh.sh")
    return jsonify(ok="pushed" in out or "1 file" in out, out=out.strip())

@app.get("/api/status")
def status():
    devs, adbs = load(), adb_devices() or []
    online = {a["serial"] for a in adbs if a["state"] == "device"}
    def chk(d):
        s = d["ssh"]; up = False
        if s.get("host"):
            try: socket.create_connection((s["host"], int(s["port"])), timeout=0.8).close(); up = True
            except Exception: pass
        return d["id"], {"ssh": up, "adb": d.get("serial") in online}
    with ThreadPoolExecutor(16) as ex:
        return jsonify(dict(ex.map(chk, devs)))

@app.post("/api/scan")
def api_scan():
    return jsonify(scan())


# ---------- ترمینال وب (WebSocket) ----------
def local_pty_ok():
    if not WIN: return True
    try: import winpty; return True
    except Exception: return False

def spawn_local(cols, rows):
    """شل خود همین دستگاه (Termux / لینوکس / مک / ویندوز)"""
    if WIN:
        from winpty import PtyProcess
        cmd = ["powershell.exe", "-NoLogo"] if shutil.which("powershell.exe") else ["cmd.exe"]
        p = PtyProcess.spawn(cmd, dimensions=(rows, cols))
        return dict(read=lambda: p.read(4096).encode("utf-8", "replace"), write=lambda x: p.write(x),
                    resize=lambda c, r: p.setwinsize(r, c), close=p.terminate)
    import fcntl, pty, signal, struct, termios
    m, sl = pty.openpty()
    size = lambda c, r: fcntl.ioctl(m, termios.TIOCSWINSZ, struct.pack("HHHH", r, c, 0, 0))
    size(cols, rows)
    shell = os.environ.get("SHELL") or shutil.which("bash") or shutil.which("sh") or "/bin/sh"
    def pre():
        os.setsid(); fcntl.ioctl(0, termios.TIOCSCTTY, 0)
    p = subprocess.Popen([shell], stdin=sl, stdout=sl, stderr=sl, preexec_fn=pre, close_fds=True, cwd=str(Path.home()),
                         env={**os.environ, "TERM": "xterm-256color", "COLORTERM": "truecolor"})
    os.close(sl)
    def read():
        try: return os.read(m, 4096)
        except OSError: return b""
    def close():
        try: os.killpg(os.getpgid(p.pid), signal.SIGHUP)
        except Exception: pass
        try: os.close(m)
        except Exception: pass
    return dict(read=read, write=lambda x: os.write(m, x.encode()), resize=size, close=close)

def pump(ws, read, ctx):
    dec = codecs.getincrementaldecoder("utf-8")("replace")
    try:
        while True:
            data = read()
            if not data: break
            text = dec.decode(data)
            if ctx["rtl"]: text = rtl_transform(text)
            ws.send(text)
    except Exception:
        pass
    try: ws.close()
    except Exception: pass

@sock.route("/ws/term/<did>/<mode>")
def term(ws, did, mode):
    start = json.loads(ws.receive() or "{}")
    cols, rows = start.get("cols", 80), start.get("rows", 24)
    ctx = {"rtl": bool(start.get("rtl", True))}
    d = find(load(), did)
    if mode != "local" and not d: return ws.send("\r\n[device not found]\r\n")

    try:
        if mode == "local":
            io = spawn_local(cols, rows)
        elif mode == "adb":
            if not adb_bin(): return ws.send("\r\n[adb is not installed]\r\n")
            p = subprocess.Popen([adb_bin(), "-s", d["serial"], "shell", "-tt"], stdin=subprocess.PIPE,
                                 stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=0, **NOWIN)
            io = dict(read=lambda: p.stdout.read(4096), write=lambda x: (p.stdin.write(x.encode()), p.stdin.flush()),
                      resize=lambda c, r: None, close=p.kill)
            io["write"](f"stty rows {rows} cols {cols}; clear\n")
        else:
            s = d["ssh"]; pw = start.get("password") or s.get("password") or None
            cli = paramiko.SSHClient(); cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ws.send(f"\x1b[90m→ {s['user']}@{s['host']}:{s['port']} ...\x1b[0m\r\n")
            cli.connect(s["host"], int(s["port"]), s["user"], pw, timeout=8, banner_timeout=8,
                        look_for_keys=True, allow_agent=False)
            ch = cli.invoke_shell("xterm-256color", cols, rows)
            io = dict(read=lambda: ch.recv(4096), write=lambda x: ch.send(x.encode()),
                      resize=lambda c, r: ch.resize_pty(c, r), close=cli.close)
    except Exception as e:
        hint = " (pip install pywinpty)" if mode == "local" and WIN else ""
        return ws.send(f"\r\n\x1b[31m[connection failed] {e}{hint}\x1b[0m\r\n")

    threading.Thread(target=pump, args=(ws, io["read"], ctx), daemon=True).start()
    try:
        while True:
            raw = ws.receive()
            if raw is None: break
            m = json.loads(raw)
            if m["type"] == "in": io["write"](m["data"])
            elif m["type"] == "resize": io["resize"](m["cols"], m["rows"])
            elif m["type"] == "rtl": ctx["rtl"] = bool(m["on"])
    except Exception:
        pass
    finally:
        try: io["close"]()
        except Exception: pass


def open_browser(url):
    time.sleep(1)
    try:
        if shutil.which("termux-open-url"): subprocess.Popen(["termux-open-url", url])
        else: webbrowser.open(url)
    except Exception: pass

if __name__ == "__main__":
    url = f"http://{HOST}:{PORT}/?k={TOKEN}"
    print(f"\n  Phone Hub\n  Open this link (first time only):\n\n  {url}\n")
    if not os.environ.get("NO_BROWSER"): threading.Thread(target=open_browser, args=(url,), daemon=True).start()
    app.run(HOST, PORT, threaded=True)
