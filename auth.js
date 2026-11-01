// Verifies email links (token_hash) and handles password reset. Publishable key: public by design.
const API = "https://fbokbmmjnibscduiqmme.supabase.co/auth/v1";
const KEY = "sb_publishable_LSAe176MdAOo7H0N7LrZjg_ttAZKr3s";
const MODE = document.body.dataset.mode; // "confirm" | "reset"
const $ = (id) => document.getElementById(id);
const I = {
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3 2"/></svg>',
  bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  wait: '<div class="spin"></div>'
};
function show(kind, title, body, html = "") {
  $("icon").className = "icon " + kind; $("icon").innerHTML = I[kind];
  $("t").textContent = title; $("m").textContent = body; $("x").innerHTML = html;
  document.title = title + " · thatsaid";
}
const openBtn = '<a class="btn" href="thatsaid://auth-callback?confirmed=1">Open thatsaid</a>';
const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.slice(1));
const token_hash = q.get("token_hash");
const type = q.get("type") || (MODE === "reset" ? "recovery" : "signup");
history.replaceState(null, "", location.pathname); // keep the token out of history and screenshots
const expired = () => show("warn", "This link has expired", "Links work once and expire after a while. Request a new email from the thatsaid app.", openBtn);
const invalid = () => show("bad", "This link isn't valid", "It may be incomplete or already used. Request a new email from the thatsaid app.", openBtn);
async function call(path, method, body, token) {
  const r = await fetch(API + path, { method, headers: { apikey: KEY, Authorization: "Bearer " + (token || KEY), "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch {}
  return { ok: r.ok, j };
}
function resetForm(token) {
  show("ok", "Choose a new password", "Use at least 12 characters with upper- and lowercase letters and a number.",
    '<form id="f" novalidate><label for="p">New password</label><input id="p" type="password" autocomplete="new-password" required>' +
    '<label for="p2">Confirm password</label><input id="p2" type="password" autocomplete="new-password" required>' +
    '<ul class="rules"><li id="r1">12+ characters</li><li id="r2">Upper- and lowercase letters</li><li id="r3">A number</li></ul>' +
    '<button class="btn" id="b">Save password</button><div class="err" id="e"></div></form>');
  $("icon").innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/></svg>';
  const p = $("p"), rules = () => { const v = p.value;
    $("r1").classList.toggle("on", v.length >= 12); $("r2").classList.toggle("on", /[a-z]/.test(v) && /[A-Z]/.test(v)); $("r3").classList.toggle("on", /\d/.test(v)); };
  p.addEventListener("input", rules);
  $("f").onsubmit = async (e) => { e.preventDefault(); const v = p.value; $("e").textContent = "";
    if (v.length < 12 || !/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v)) return ($("e").textContent = "Your password doesn't meet the rules yet.");
    if (v !== $("p2").value) return ($("e").textContent = "The passwords don't match.");
    $("b").disabled = true; $("b").textContent = "Saving…";
    const r = await call("/user", "PUT", { password: v }, token);
    if (!r.ok) { $("b").disabled = false; $("b").textContent = "Save password";
      return ($("e").textContent = /session|jwt|expired/i.test(r.j.msg || r.j.code || "") ? "This reset session expired. Request a new email from the thatsaid app." : (r.j.code === "same_password" ? "Choose a password you haven't used before." : "Couldn't save your password. Please try again.")); }
    call("/logout", "POST", {}, token).catch(() => {});
    show("ok", "Password updated", "Open thatsaid and sign in with your new password.", openBtn);
  };
}
(async () => {
  if (q.get("error_code") === "otp_expired" || h.get("error_code") === "otp_expired") return expired();
  if (q.get("error") || h.get("error") || !token_hash) return invalid();
  const r = await call("/verify", "POST", { type, token_hash });
  if (!r.ok) return (r.j.code === "otp_expired" || /expired/i.test(r.j.msg || "")) ? expired() : invalid();
  if (MODE === "reset") return resetForm(r.j.access_token);
  const t = { email_change: ["Email updated", "Your new email address is confirmed."], invite: ["Welcome to thatsaid", "Your invite is accepted and your email is verified."] }[type]
    || ["You're verified", "Your email is confirmed. Open thatsaid to finish setting up two-factor sign-in."];
  show("ok", t[0], t[1], openBtn + '<div class="sub">On another device? Just open thatsaid there and sign in.</div>');
})();
