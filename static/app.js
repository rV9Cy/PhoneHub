const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const api = async (url, method = "GET", body) => {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || t("err") + " " + r.status);
  return j;
};

/* ---------- زبان ---------- */
let lang = localStorage.getItem("ph_lang") || "fa";
const t = k => I18N[lang][k] ?? I18N.fa[k] ?? k;
let toastT;
const toast = m => { const e = $("#toast"); e.textContent = m; e.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => e.classList.add("hidden"), 2600); };
const copy = x => navigator.clipboard.writeText(x).then(() => toast(t("copied") + ": " + (x.length > 40 ? x.slice(0, 40) + "…" : x)));
const ago = ts => { const m = Math.round((Date.now() / 1000 - ts) / 60); return m < 1 ? "now" : m < 60 ? m + "m" : m < 1440 ? Math.round(m / 60) + "h" : Math.round(m / 1440) + "d"; };

function applyLang() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(e => e.textContent = t(e.dataset.i18n));
  $$("[data-i18n-html]").forEach(e => e.innerHTML = t(e.dataset.i18nHtml));
  $$("[data-i18n-title]").forEach(e => e.title = t(e.dataset.i18nTitle));
  $("#langBtn").textContent = lang === "fa" ? "EN" : "فا";
  $("#scanBtn").textContent = t("scan");
  $("#form").elements.name.placeholder = t("default_name");
  renderAll();
}
$("#langBtn").onclick = () => { lang = lang === "fa" ? "en" : "fa"; localStorage.setItem("ph_lang", lang); applyLang(); };

/* ---------- نمایش‌ها ---------- */
let view = "devices";
function showView(v) {
  view = v;
  $$("#mainTabs button").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  $$(".view").forEach(s => s.classList.toggle("hidden", s.id !== "v-" + v));
  if (v === "term") requestAnimationFrame(() => fitCur());
}
$("#mainTabs").onclick = e => { const b = e.target.closest("[data-view]"); if (b) showView(b.dataset.view); };

/* ---------- داده ---------- */
let devices = [], liveStatus = {}, local = null, adbInfo = null, editId = null, prefill = null;
const stOf = d => liveStatus[d.id] || {};

function renderAll() { renderDevices(); renderTargets(); renderGuide(); renderSessTabs(); renderQuick(); renderAdbBadge(); }

function renderAdbBadge() {
  const b = $("#adbBadge"); if (!adbInfo) return;
  b.textContent = adbInfo.available ? `adb ✓ · ${adbInfo.devices.filter(d => d.state === "device").length}` : t("adb_missing");
  b.className = "badge " + (adbInfo.available ? "ok" : "bad");
}

function renderDevices() {
  const on = devices.filter(d => stOf(d).ssh || stOf(d).adb).length, usb = devices.filter(d => stOf(d).adb).length;
  $("#stats").innerHTML = [[devices.length, "stat_devices"], [on, "stat_online"], [usb, "stat_usb"]].map(([n, k]) => `<div class="stat"><b>${n}</b><span>${t(k)}</span></div>`).join("");
  const me = local ? `<div class="card me">
    <div class="card-h"><h3><span class="ico">${local.termux ? "📱" : "💻"}</span>${esc(local.host)}</h3><span class="badge acc">${t("this_device")}</span></div>
    <div class="meta"><span class="badge">${esc(local.os)} ${esc(local.release.split("-")[0])}</span><span class="badge">${esc(local.user)}</span><span class="badge">${esc(local.shell)}</span>${local.termux ? '<span class="badge">Termux</span>' : ""}<span class="badge ok">${t("full_access")}</span></div>
    <div class="hist">${t("local_ips")}: ${local.ips.length ? local.ips.map(i => `<span class="chip" data-copy="${esc(i)}">${esc(i)}</span>`).join("") : "—"}</div>
    <div class="acts"><button class="btn primary" data-a="local" ${local.pty ? "" : "disabled"}>›_ ${t("open_local")}</button></div>
    ${local.pty ? "" : `<div class="hint">${t("localOnWin")}</div>`}</div>` : "";
  $("#grid").innerHTML = me + devices.map(d => {
    const s = stOf(d), ssh = d.ssh || {}, hist = (d.ip_history || []).slice(0, -1).reverse(), canSsh = ssh.host && ssh.user;
    return `<div class="card" data-id="${d.id}">
      <div class="card-h"><h3><span class="ico">📱</span>${esc(d.name)}</h3>
        <div class="st"><span><i class="dot ${s.ssh ? "on" : ""}"></i>SSH</span>${d.serial ? `<span><i class="dot ${s.adb ? "on" : ""}"></i>USB</span>` : ""}</div></div>
      <div class="ip" data-copy="${esc(ssh.host)}"><span>${esc(ssh.host || t("no_ip"))}</span><small>${ssh.user ? esc(ssh.user + ":" + ssh.port) : t("no_user")}</small></div>
      ${hist.length ? `<div class="hist">${t("prev_ips")}: ${hist.map(h => `<span class="chip" title="${ago(h.ts)}" data-copy="${esc(h.ip)}">${esc(h.ip)}</span>`).join("")}</div>` : ""}
      <div class="acts">
        <button class="btn primary" data-a="ssh" ${canSsh ? "" : "disabled"}>${t("ssh_term")}</button>
        ${d.serial ? `<button class="btn" data-a="adb" ${s.adb ? "" : "disabled"}>${t("usb_term")}</button><button class="btn" data-a="ip" ${s.adb ? "" : "disabled"}>↻ IP</button>` : ""}
        <button class="btn" data-a="edit">${t("edit")}</button><button class="btn danger" data-a="del">${t("del")}</button>
      </div></div>`;
  }).join("");
}

function renderTargets() {
  const me = `<button class="tg" data-k="local"><span class="ico">${local && local.termux ? "📱" : "💻"}</span><span><b>${t("this_device")}</b><small>${t("full_access")}</small></span></button>`;
  const rows = devices.flatMap(d => {
    const s = stOf(d), ssh = d.ssh || {}, o = [];
    if (ssh.host && ssh.user) o.push(`<button class="tg ${s.ssh ? "" : "off"}" data-k="ssh" data-id="${d.id}"><span class="ico">📱</span><span><b>${esc(d.name)}</b><small>SSH · ${esc(ssh.host)}:${ssh.port}</small></span></button>`);
    if (d.serial) o.push(`<button class="tg ${s.adb ? "" : "off"}" data-k="adb" data-id="${d.id}"><span class="ico">🔌</span><span><b>${esc(d.name)}</b><small>USB · adb shell</small></span></button>`);
    return o;
  });
  $("#targetList").innerHTML = me + rows.join("");
}
$("#targetList").onclick = e => {
  const b = e.target.closest(".tg"); if (!b) return;
  openTarget(b.dataset.k, devices.find(d => d.id === b.dataset.id));
};

async function loadDevices() { devices = await api("/api/devices"); renderAll(); }
async function pollStatus() { try { liveStatus = await api("/api/status"); renderDevices(); renderTargets(); } catch { } }

$("#grid").addEventListener("click", async e => {
  const c = e.target.closest("[data-copy]"); if (c && c.dataset.copy) return copy(c.dataset.copy);
  const b = e.target.closest("[data-a]"); if (!b) return;
  if (b.dataset.a === "local") return openTarget("local");
  const d = devices.find(x => x.id === b.closest(".card").dataset.id), a = b.dataset.a;
  if (a === "ssh" || a === "adb") openTarget(a, d);
  else if (a === "edit") openModal(d);
  else if (a === "del") { if (confirm(`«${d.name}» — ${t("confirm_del")}`)) { await api("/api/devices/" + d.id, "DELETE"); await loadDevices(); } }
  else if (a === "ip") { try { const r = await api(`/api/devices/${d.id}/refresh-ip`, "POST", {}); toast(t("new_ip") + ": " + r.ssh.host); await loadDevices(); pollStatus(); } catch (err) { toast(err.message); } }
});

/* ---------- آموزش ---------- */
function renderGuide() {
  const g = GUIDE[lang];
  $("#guide").innerHTML = `<div class="guide-h"><h2>${g.title}</h2><p>${g.sub}</p></div><div class="steps">${g.steps.map(s => `<div class="step"><h4>${s.t}</h4><p>${s.b}</p>${s.code ? `<div class="codebox"><button data-code="${esc(s.code)}">${t("guide_copy")}</button>${esc(s.code)}</div>` : ""}</div>`).join("")}</div>`;
}
$("#guide").onclick = e => { const b = e.target.closest("[data-code]"); if (b) copy(b.dataset.code); };

/* ---------- مودال افزودن ---------- */
function showTab(k) {
  $$("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === k));
  $$("[data-pane]").forEach(p => p.classList.toggle("hidden", p.dataset.pane !== k));
  if (k === "usb") loadUsb();
}
function openModal(dev) {
  editId = dev ? dev.id : null;
  $("#mTitle").textContent = t(dev ? "modal_edit" : "modal_add");
  $("#tabs").classList.toggle("hidden", !!dev);
  const f = $("#form"); f.reset();
  const v = dev ? { name: dev.name, ...dev.ssh } : (prefill || { port: 8022 });
  for (const k of ["name", "host", "port", "user"]) f.elements[k].value = v[k] ?? "";
  f.elements.password.placeholder = dev && dev.ssh.has_password ? t("f_pass_saved") : "";
  $("#modal").classList.remove("hidden");
  showTab(dev || prefill ? "manual" : "usb"); prefill = null;
}
const closeAll = () => $$(".overlay").forEach(o => o.classList.add("hidden"));
document.addEventListener("click", e => { if (e.target.matches("[data-close]") || e.target.classList.contains("overlay")) closeAll(); });
$("#addBtn").onclick = () => openModal();
$("#tabs").onclick = e => e.target.dataset.tab && showTab(e.target.dataset.tab);
$("#form").onsubmit = async e => {
  e.preventDefault(); const f = e.target.elements;
  const body = { name: f.name.value, ssh: { host: f.host.value.trim(), port: +f.port.value || 8022, user: f.user.value, password: f.password.value } };
  try { await api(editId ? "/api/devices/" + editId : "/api/devices", editId ? "PATCH" : "POST", body); closeAll(); await loadDevices(); pollStatus(); toast(t("saved")); }
  catch (err) { toast(err.message); }
};

async function loadUsb() {
  const box = $("#usbList"); box.innerHTML = `<p class="hint">${t("searching")}</p>`;
  const r = adbInfo = await api("/api/adb"); renderAdbBadge();
  if (!r.available) { box.innerHTML = `<p class="hint">${t("no_adb")}</p>`; return; }
  if (!r.devices.length) { box.innerHTML = `<p class="hint">${t("no_phone")}</p>`; return; }
  box.innerHTML = r.devices.map(d => `<div class="item"><span>${esc(d.model || "Android")}<small>${esc(d.serial)} · ${esc(d.state)}</small></span>
    <button class="btn primary" data-serial="${esc(d.serial)}" data-model="${esc(d.model)}" ${d.state === "device" ? "" : "disabled"}>${d.state === "device" ? t("add") : t("allow_phone")}</button></div>`).join("");
}
$("#usbList").onclick = async e => {
  const b = e.target.closest("[data-serial]"); if (!b) return; b.disabled = true; b.textContent = "…";
  try {
    const d = await api("/api/adb/add", "POST", { serial: b.dataset.serial, name: b.dataset.model || t("default_name") });
    closeAll(); await loadDevices(); pollStatus(); toast(d.ssh.host ? t("added") + ": " + d.ssh.host : t("added_noip"));
  } catch (err) { toast(err.message); b.disabled = false; }
};
$("#usbRefresh").onclick = loadUsb;
$("#pushSetup").onclick = async () => {
  const first = (await api("/api/adb")).devices.find(d => d.state === "device");
  if (!first) return toast(t("no_phone_conn"));
  const r = await api("/api/adb/push-setup", "POST", { serial: first.serial });
  const h = $("#pushHelp"); h.classList.remove("hidden");
  h.textContent = r.ok ? t("pushed") + "\n\ntermux-setup-storage\ncp ~/storage/downloads/phone-ssh.sh ~ && bash phone-ssh.sh setup && bash phone-ssh.sh start" : t("err") + ":\n" + r.out;
};
$("#scanBtn").onclick = async e => {
  const b = e.target; b.disabled = true; b.textContent = t("scanning"); $("#scanList").innerHTML = "";
  try {
    const r = await api("/api/scan", "POST", {});
    $("#scanInfo").textContent = r.nets.length ? t("scan_nets") + ": " + r.nets.join(", ") : t("scan_none_net");
    $("#scanList").innerHTML = r.found.length ? r.found.map(x => `<div class="item"><span>${esc(x.ip)}:${x.port}<small>${esc(x.banner)}</small></span><button class="btn primary" data-ip="${esc(x.ip)}" data-port="${x.port}">${t("add")}</button></div>`).join("") : `<p class="hint">${t("scan_none")}</p>`;
  } catch (err) { toast(err.message); }
  b.disabled = false; b.textContent = t("scan");
};
$("#scanList").onclick = e => { const b = e.target.closest("[data-ip]"); if (b) { prefill = { host: b.dataset.ip, port: b.dataset.port }; openModal(); } };

/* ---------- ترمینال ---------- */
const P = (bg, fg, cur, sel, p) => ({ bg, fg, cur, sel, p });
const THEMES = {
  Aurora: P("#060a14", "#dbe4f5", "#5eead4", "#5eead43d", ["#1b2238", "#f87171", "#34d399", "#fbbf24", "#60a5fa", "#c084fc", "#22d3ee", "#cbd5e1", "#475569", "#fca5a5", "#6ee7b7", "#fde68a", "#93c5fd", "#d8b4fe", "#67e8f9", "#f8fafc"]),
  Dracula: P("#1e1f29", "#f8f8f2", "#ff79c6", "#44475a", ["#21222c", "#ff5555", "#50fa7b", "#f1fa8c", "#bd93f9", "#ff79c6", "#8be9fd", "#f8f8f2", "#6272a4", "#ff6e6e", "#69ff94", "#ffffa5", "#d6acff", "#ff92df", "#a4ffff", "#ffffff"]),
  Nord: P("#2e3440", "#d8dee9", "#88c0d0", "#434c5e", ["#3b4252", "#bf616a", "#a3be8c", "#ebcb8b", "#81a1c1", "#b48ead", "#88c0d0", "#e5e9f0", "#4c566a", "#bf616a", "#a3be8c", "#ebcb8b", "#81a1c1", "#b48ead", "#8fbcbb", "#eceff4"]),
  Light: P("#fafafa", "#383a42", "#526fff", "#d0d8ff", ["#383a42", "#e45649", "#50a14f", "#c18401", "#4078f2", "#a626a4", "#0184bc", "#a0a1a7", "#4f525e", "#e06c75", "#98c379", "#e5c07b", "#61afef", "#c678dd", "#56b6c2", "#ffffff"])
};
const N = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
const xtheme = th => { const o = { background: th.bg, foreground: th.fg, cursor: th.cur, cursorAccent: th.bg, selectionBackground: th.sel }; th.p.forEach((c, i) => o[(i > 7 ? "bright" : "") + (i > 7 ? N[i - 8][0].toUpperCase() + N[i - 8].slice(1) : N[i])] = c); return o; };
let rtlOn = localStorage.getItem("ph_rtl") !== "0";
const PER = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, LAT = /[A-Za-z]/g;
function alignRows(s) {
  s.pane.querySelectorAll(".xterm-rows > div").forEach(r => {
    const x = r.textContent, p = (x.match(PER) || []).length, l = (x.match(LAT) || []).length;
    r.classList.toggle("rtl-row", rtlOn && p > 0 && p >= l);
  });
}
function applyRtl() { $("#tRtl").classList.toggle("on", rtlOn); sessions.forEach(s => { s.pane.classList.toggle("bidi", rtlOn); alignRows(s); if (s.ws && s.ws.readyState === 1) s.ws.send(JSON.stringify({ type: "rtl", on: rtlOn })); }); }
$("#tRtl").onclick = () => { rtlOn = !rtlOn; localStorage.setItem("ph_rtl", rtlOn ? "1" : "0"); applyRtl(); };
let themeName = localStorage.getItem("ph_theme") in THEMES ? localStorage.getItem("ph_theme") : "Aurora";
let fsize = +localStorage.getItem("ph_fs") || 15;
const sessions = []; let cur = null, seq = 0; const mod = { ctrl: false, alt: false };

$("#themeSel").innerHTML = Object.keys(THEMES).map(n => `<option ${n === themeName ? "selected" : ""}>${n}</option>`).join("");
function applyTheme() {
  const th = THEMES[themeName]; $("#win").style.setProperty("--tbg", th.bg); $("#win").classList.toggle("light", themeName === "Light");
  sessions.forEach(s => s.term && (s.term.options.theme = xtheme(th)));
}
$("#themeSel").onchange = e => { themeName = e.target.value; localStorage.setItem("ph_theme", themeName); applyTheme(); };
function setFont(d) { fsize = Math.max(10, Math.min(26, fsize + d)); localStorage.setItem("ph_fs", fsize); sessions.forEach(s => s.term && (s.term.options.fontSize = fsize)); fitCur(); }
$("#fMinus").onclick = () => setFont(-1); $("#fPlus").onclick = () => setFont(1);

const QUICK = [["quick_sys", ["uname -a", "whoami", "uptime", "df -h", "free -h", "top -n 1", "ls -la"]], ["quick_net", ["ip a", "ping -c 3 8.8.8.8", "curl -s ifconfig.me", "ss -tulpn"]], ["quick_termux", ["termux-battery-status", "termux-wifi-connectioninfo", "pkg update && pkg upgrade", "sshd"]]];
function renderQuick() { $("#quickMenu").innerHTML = QUICK.map(([g, cs]) => `<h5>${t(g)}</h5>` + cs.map(c => `<button>${esc(c)}</button>`).join("")).join(""); }
$("#quickBtn").onclick = e => { e.stopPropagation(); $("#quickMenu").classList.toggle("hidden"); };
document.addEventListener("click", () => $("#quickMenu").classList.add("hidden"));
$("#quickMenu").onclick = e => { if (e.target.tagName === "BUTTON" && cur) { send(cur, e.target.textContent + "\r"); cur.term.focus(); } };

const KEYS = [["Esc", "\x1b"], ["Tab", "\t"], ["Ctrl", "ctrl"], ["Alt", "alt"], ["↑", "\x1b[A"], ["↓", "\x1b[B"], ["←", "\x1b[D"], ["→", "\x1b[C"], ["|", "|"], ["/", "/"], ["-", "-"], ["~", "~"], ["Home", "\x1b[H"], ["End", "\x1b[F"], ["PgUp", "\x1b[5~"], ["PgDn", "\x1b[6~"]];
$("#kbar").innerHTML = KEYS.map(([l], i) => `<button data-i="${i}">${l}</button>`).join("");
$("#kbar").onclick = e => {
  const b = e.target.closest("button"); if (!b) return; const v = KEYS[b.dataset.i][1];
  if (v === "ctrl" || v === "alt") { mod[v] = !mod[v]; $$("#kbar button").forEach(x => x.classList.toggle("on", !!mod[KEYS[x.dataset.i][1]])); }
  else if (cur) send(cur, v);
  if (cur) cur.term.focus();
};
if (matchMedia("(pointer:coarse)").matches) $("#kbar").classList.remove("hidden");

function send(s, data, raw) {
  if (!raw) {
    if (mod.ctrl && data.length === 1) { const c = data.toUpperCase().charCodeAt(0); if (c >= 64 && c <= 95) data = String.fromCharCode(c - 64); }
    if (mod.alt) data = "\x1b" + data;
    if (mod.ctrl || mod.alt) { mod.ctrl = mod.alt = false; $$("#kbar button").forEach(x => x.classList.remove("on")); }
  }
  if (s.ws && s.ws.readyState === 1) s.ws.send(JSON.stringify({ type: "in", data }));
}

function openTarget(kind, dev) {
  if (kind === "ssh" && !dev.ssh.has_password) {
    $("#pwInput").value = ""; $("#pw").classList.remove("hidden"); $("#pwInput").focus();
    $("#pwForm").onsubmit = e => { e.preventDefault(); $("#pw").classList.add("hidden"); newSession(kind, dev, $("#pwInput").value); };
  } else newSession(kind, dev, "");
}

async function newSession(kind, dev, password) {
  showView("term");
  const label = kind === "local" ? t("this_device") : dev.name + (kind === "adb" ? " · USB" : " · SSH");
  const pane = document.createElement("div"); pane.className = "tpane"; $("#termHost").appendChild(pane);
  const s = { id: ++seq, kind, dev, password, label, pane, on: false };
  try { await document.fonts.load('15px "JetBrains Mono"'); } catch { }
  sessions.push(s); activate(s);
  s.term = new Terminal({ fontFamily: '"JetBrains Mono", Vazirmatn, ui-monospace, Menlo, Consolas, monospace', fontSize: fsize, lineHeight: 1.25, cursorBlink: true, cursorStyle: "bar", scrollback: 5000, allowTransparency: false, theme: xtheme(THEMES[themeName]) });
  s.fit = new FitAddon.FitAddon(); s.term.loadAddon(s.fit); s.term.open(pane); s.fit.fit();
  s.term.onData(d => send(s, d));
  s.ro = new ResizeObserver(() => { if (cur === s) { try { s.fit.fit(); } catch { } if (s.ws && s.ws.readyState === 1) s.ws.send(JSON.stringify({ type: "resize", cols: s.term.cols, rows: s.term.rows })); } });
  s.ro.observe(pane);
  pane.classList.toggle("bidi", rtlOn); let raf = 0;
  new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; alignRows(s); }); }).observe(pane, { childList: true, subtree: true, characterData: true });
  connect(s); s.term.focus();
}

function connect(s) {
  if (s.ws) try { s.ws.close(); } catch { }
  const proto = location.protocol === "https:" ? "wss" : "ws";
  s.ws = new WebSocket(`${proto}://${location.host}/ws/term/${s.dev ? s.dev.id : "local"}/${s.kind}`);
  s.ws.onopen = () => { s.on = true; renderSessTabs(); s.ws.send(JSON.stringify({ cols: s.term.cols, rows: s.term.rows, password: s.password, rtl: rtlOn })); };
  s.ws.onmessage = e => s.term.write(e.data);
  s.ws.onclose = () => { s.on = false; renderSessTabs(); s.term.write(`\r\n\x1b[90m[${t("closed")}]\x1b[0m\r\n`); };
}

function activate(s) {
  cur = s; sessions.forEach(x => x.pane.style.display = x === s ? "block" : "none");
  $("#termEmpty").classList.toggle("hidden", sessions.length > 0); renderSessTabs(); applyTheme(); fitCur();
}
function fitCur() { if (cur && cur.fit && view === "term") { requestAnimationFrame(() => { try { cur.fit.fit(); } catch { } cur.term.focus(); }); } }
function closeSession(s) {
  try { s.ws.close(); } catch { } try { s.ro.disconnect(); s.term.dispose(); } catch { } s.pane.remove();
  sessions.splice(sessions.indexOf(s), 1);
  if (sessions.length) activate(sessions[sessions.length - 1]); else { cur = null; $("#termEmpty").classList.remove("hidden"); renderSessTabs(); }
}
function renderSessTabs() {
  $("#sessTabs").innerHTML = sessions.map(s => `<div class="sess ${s === cur ? "on" : ""}" data-id="${s.id}"><i class="dot ${s.on ? "on" : ""}"></i>${esc(s.label)}<button class="x" data-x="${s.id}">✕</button></div>`).join("");
  $("#tTitle").textContent = cur ? cur.label : "—"; $("#tState").className = "dot" + (cur && cur.on ? " on" : "");
}
$("#sessTabs").onclick = e => {
  const x = e.target.closest("[data-x]"); if (x) return closeSession(sessions.find(s => s.id == x.dataset.x));
  const tab = e.target.closest(".sess"); if (tab) activate(sessions.find(s => s.id == tab.dataset.id));
};
$("#tCopy").onclick = () => { if (cur && cur.term.hasSelection()) copy(cur.term.getSelection()); };
$("#tPaste").onclick = async () => { if (cur) { try { cur.term.paste(await navigator.clipboard.readText()); cur.term.focus(); } catch { } } };
$("#tClear").onclick = () => { if (cur) { cur.term.clear(); cur.term.focus(); } };
$("#tRe").onclick = () => { if (cur) { cur.term.reset(); connect(cur); cur.term.focus(); } };
$("#tFull").onclick = () => { $("#win").classList.toggle("full"); setTimeout(fitCur, 60); };
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#win").classList.contains("full")) { $("#win").classList.remove("full"); setTimeout(fitCur, 60); } });
window.addEventListener("resize", fitCur);

/* ---------- شروع ---------- */
(async () => {
  applyLang(); $("#tRtl").classList.toggle("on", rtlOn);
  api("/api/local").then(r => { local = r; renderAll(); }).catch(() => { });
  await loadDevices();
  api("/api/adb").then(r => { adbInfo = r; renderAdbBadge(); });
  pollStatus(); setInterval(pollStatus, 8000);
})();
