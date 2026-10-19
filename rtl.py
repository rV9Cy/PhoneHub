"""تبدیل متن فارسی خروجی ترمینال به ترتیب بصری (اتصال حروف + راست‌به‌چپ)."""
import re
try:
    import arabic_reshaper
    _reshape = arabic_reshaper.ArabicReshaper({"support_ligatures": False, "delete_harakat": False}).reshape
except Exception:  # بدون arabic-reshaper خروجی دست‌نخورده می‌ره
    _reshape = None

RTL = re.compile("[\u0600-\u06FF\u0750-\u077F]")
LETTER = re.compile("[A-Za-z\u0600-\u06FF\u0750-\u077F]")
DIG = re.compile("([0-9\u06F0-\u06F9\u0660-\u0669]+)")
ANSI = re.compile(r"(\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[()][A-Za-z0-9])")
MIRROR = str.maketrans("()[]{}<>", ")(][}{><")


def _word(w):
    parts = [p for p in DIG.split(_reshape(w)) if p]
    parts = [p if DIG.fullmatch(p) else p[::-1].translate(MIRROR) for p in parts]
    return "".join(parts[::-1])


def _segment(s):
    """یک تکه متن ساده (بدون escape) → (متن بصری، آیا پاراگراف راست‌چینه)"""
    if not RTL.search(s): return s, False
    words = s.split(" ")
    kind = ["r" if RTL.search(w) else ("l" if LETTER.search(w) else "n") for w in words]
    base = next((k for k in kind if k != "n"), "l")
    for i, k in enumerate(kind):
        if k == "n":
            prev = next((kind[j] for j in range(i - 1, -1, -1) if kind[j] != "n"), base)
            nxt = next((kind[j] for j in range(i + 1, len(kind)) if kind[j] != "n"), base)
            kind[i] = prev if prev == nxt else base
    runs = []
    for w, k in zip(words, kind):
        if runs and runs[-1][0] == k: runs[-1][1].append(w)
        else: runs.append((k, [w]))
    out = [" ".join(_word(w) for w in reversed(ws)) if k == "r" else " ".join(ws) for k, ws in runs]
    if base == "r": out.reverse()
    return " ".join(out), base == "r"


def transform(text, mid=False):
    """text: خروجی خام. mid=True یعنی اولین خط ادامه‌ی خطِ چانک قبلیه."""
    if _reshape is None or not RTL.search(text): return text
    lines = text.split("\n"); res = []
    for i, ln in enumerate(lines):
        cr = ln.endswith("\r"); body = ln[:-1] if cr else ln
        parts = ANSI.split(body)
        for k in range(0, len(parts), 2): parts[k] = _segment(parts[k])[0]
        res.append("".join(parts) + ("\r" if cr else ""))
    return "\n".join(res)
