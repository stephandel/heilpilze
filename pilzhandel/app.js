/* ==========================================================
   Pilz Handel · App-Logik
   Hash-Router, Suche, Merkliste, Vergleich, Wechselwirkungs-Check,
   Textgröße, Hell/Dunkel. Keine Abhängigkeiten.
   ========================================================== */
(function(){
"use strict";
const D = window.PH;
const M = D.MUSHROOMS;
const byId = Object.fromEntries(M.map(m => [m.id, m]));
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const coll = new Intl.Collator("de");
const icon = (id, cls="") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

/* ---------- Speicher ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
let favs = new Set(store.get("ph-favs", []).filter(id => byId[id]));
let cmp = store.get("ph-cmp", []).filter(id => byId[id]).slice(0, 3);
let flags = new Set(store.get("ph-flags", []).filter(k => D.FLAGS[k]));
const saveFavs = () => { store.set("ph-favs", [...favs]); syncBadges(); };
const saveCmp = () => { store.set("ph-cmp", cmp); syncTray(); };

/* ---------- Toast ---------- */
let toastT, toastUndoT;
function toast(msg, opts){
  const t = $("#toast");
  clearTimeout(toastT); clearTimeout(toastUndoT);
  // opacity:0 allein entfernt einen Knopf nicht aus der Tab-Reihenfolge: ohne das hier
  // bliebe "Rückgängig" nach dem Ausblenden unsichtbar, aber per Tastatur weiter erreichbar.
  const clearWhenHidden = () => setTimeout(() => { if(!t.classList.contains("show")) t.innerHTML = ""; }, 260);
  if(opts && opts.onUndo){
    t.innerHTML = `<span>${esc(msg)}</span> <button type="button" class="undo">${esc(opts.undoLabel || "Rückgängig")}</button>`;
    const done = () => { t.classList.remove("show"); clearWhenHidden(); };
    $("button.undo", t).addEventListener("click", () => { done(); opts.onUndo(); });
    t.classList.add("show", "has-action");
    // Fokus auf den Rückgängig-Knopf: alle Aufrufer lösen den Toast über einen Klick aus
    // (Löschen, Auswahl leeren), nie mitten in einer Texteingabe, darum ist das hier sicher.
    // setTimeout statt direktem .focus(): der Browser fokussiert den geklickten Auslöser-Knopf
    // nativ nach dem Event-Handler und würde unseren Fokus sonst sofort wieder überschreiben.
    setTimeout(() => { const u = $("button.undo", t); if(u) u.focus(); }, 0);
    toastUndoT = setTimeout(done, opts.duration || 6000);
  } else {
    t.textContent = msg;
    t.classList.remove("has-action");
    t.classList.add("show");
    toastT = setTimeout(() => { t.classList.remove("show"); clearWhenHidden(); }, 2200);
  }
}

/* ---------- Bilder ---------- */
const COMMONS = "https://commons.wikimedia.org/wiki/";
const fileUrl = (name, w) => `${COMMONS}Special:FilePath/${encodeURIComponent(name.replace(/ /g, "_"))}?width=${w}`;
const filePage = name => `${COMMONS}File:${encodeURIComponent(name.replace(/ /g, "_"))}`;
const issueUrl = (subject, body) => `https://github.com/stephandel/heilpilze/issues/new?labels=inhalt&title=${encodeURIComponent("Fehler bei " + subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;
const HERO = D.HERO || [];
/* Urheber und Lizenz eines Fotos, sofern tools/fetch-image-credits.js sie ermitteln konnte.
   Sonst leerer String: der umgebende Text verweist dann weiter auf die Dateiseite. */
const imgCredit = name => {
  const c = D.IMG_CREDITS && D.IMG_CREDITS[name];
  if(!c) return "";
  const bits = [c.artist, c.license].filter(Boolean);
  return bits.length ? ` (${bits.map(esc).join(", ")})` : "";
};

function art(m, fit="slice"){
  const c = m.color, st = "rgba(40,25,15,.22)";
  const ground = `<path d="M0 132 Q50 122 100 130 T200 128 V150 H0Z" fill="#6E8452" opacity=".55"/>`;
  const spores = `<circle cx="160" cy="30" r="2" fill="${c}" opacity=".35"/><circle cx="172" cy="46" r="1.4" fill="${c}" opacity=".3"/><circle cx="30" cy="36" r="1.6" fill="${c}" opacity=".3"/>`;
  let body = "";
  switch(m.shape){
    case "bracket":
      body = `<rect x="18" y="20" width="26" height="115" rx="6" fill="#8B6F55" opacity=".55"/>
        <path d="M40 48 Q120 36 150 62 Q120 74 40 70Z" fill="${c}" stroke="${st}"/>
        <path d="M40 78 Q135 66 170 94 Q130 106 40 100Z" fill="${c}" stroke="${st}"/>
        <path d="M40 106 Q110 98 135 118 Q105 128 40 124Z" fill="${c}" stroke="${st}" opacity=".9"/>
        <path d="M46 60 Q110 52 138 64 M46 90 Q120 82 156 96" stroke="#fff" stroke-opacity=".25" fill="none"/>`; break;
    case "cluster":
      body = [[70,92,26],[100,80,30],[132,92,26],[86,112,22],[118,112,22],[100,58,20],[62,112,16],[140,114,16]]
        .map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${st}"/>`).join("") +
        `<path d="M70 80 q6 -8 12 0 M96 66 q6 -8 12 0 M124 82 q6 -8 12 0" stroke="#fff" stroke-opacity=".35" fill="none"/>`; break;
    case "club":
      body = [[70,46,11],[92,34,12],[114,42,11],[134,54,10],[82,58,9]]
        .map(([x,y,r]) => `<path d="M${x-3} ${y+r*1.6} L${x-2} 130 L${x+2} 130 L${x+3} ${y+r*1.6}Z" fill="#EADBC4" stroke="${st}"/><ellipse cx="${x}" cy="${y}" rx="${r*0.75}" ry="${r*1.9}" fill="${c}" stroke="${st}"/>`).join(""); break;
    case "ear":
      body = `<path d="M60 110 C40 70 70 34 104 38 C140 42 160 70 146 100 C136 122 108 118 100 104 C92 92 110 82 104 74 C96 64 76 80 78 104 C80 118 70 124 60 110Z" fill="${c}" stroke="${st}"/>
        <path d="M84 60 C100 52 124 58 134 76" stroke="#fff" stroke-opacity=".25" fill="none" stroke-width="2"/>`; break;
    case "sclerotium":
      body = `<path d="M48 110 C36 84 58 58 88 60 C104 44 136 50 146 70 C170 78 168 110 146 120 C120 132 70 132 48 110Z" fill="${c}" stroke="${st}"/>
        <path d="M70 80 q10 -8 20 0 M110 72 q12 -8 22 2" stroke="#fff" stroke-opacity=".25" fill="none"/>`; break;
    default:
      body = `<path d="M90 80 C90 104 87 118 84 130 Q100 136 116 130 C113 118 110 104 110 80Z" fill="#EADBC4" stroke="${st}"/>
        <path d="M52 82 C52 52 74 30 100 30 C126 30 148 52 148 82 C148 88 143 90 138 90 L62 90 C57 90 52 88 52 82Z" fill="${c}" stroke="${st}"/>
        <path d="M62 90 Q100 100 138 90" stroke="rgba(0,0,0,.18)" fill="none" stroke-width="3"/>
        <ellipse cx="80" cy="50" rx="14" ry="6" transform="rotate(-28 80 50)" fill="#fff" opacity=".2"/>`;
  }
  return `<svg class="art" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid ${fit}" aria-hidden="true">${spores}${body}${ground}</svg>`;
}
function pimg(m, w=640, alt=true, fit="slice"){
  const srcs = (m.imgs || []).map(n => fileUrl(n, w));
  const bg = `color-mix(in srgb, ${m.color} 22%, var(--surface-2))`;
  return `<div class="pimg" style="--fb-bg:${bg}">${art(m, fit)}${srcs.length ? `<img loading="lazy" decoding="async" alt="${alt ? esc("Foto: " + m.name) : ""}" src="${srcs[0]}" data-alt-src="${esc(srcs.slice(1).join("|"))}">` : ""}</div>`;
}
/* Bild-Laden global behandeln: bei Fehler nächste Quelle, sonst Illustration stehen lassen */
document.addEventListener("load", e => { if(e.target.tagName === "IMG" && e.target.closest(".pimg,.hero .bg")) e.target.classList.add("ok"); }, true);
document.addEventListener("error", e => {
  const img = e.target; if(img.tagName !== "IMG") return;
  const rest = (img.dataset.altSrc || "").split("|").filter(Boolean);
  if(rest.length){ img.dataset.altSrc = rest.slice(1).join("|"); img.src = rest[0]; }
  else img.remove();
}, true);

/* ---------- Bausteine ---------- */
function meter(score, big=false){
  return `<span class="meter${big ? " big" : ""}" title="Humanevidenz ${score} von 4"><span class="bars">${[0,1,2,3].map(i => `<i class="${i < score ? "on" : ""}"></i>`).join("")}</span>${esc(D.SCORE_LBL[score])}</span>`;
}
const RISK = ["gut verträglich","Hinweise beachten","dokumentierte Risiken","ernste Fallberichte"];
const risk = r => `<span class="riskdot r${r}">${RISK[r]}</span>`;
function favBtn(m, onimg=true){
  const on = favs.has(m.id);
  return `<button class="iconbtn${onimg ? " onimg" : ""}" data-fav="${m.id}" aria-pressed="${on}" aria-label="${on ? "Von Merkliste entfernen" : "Auf die Merkliste"}: ${esc(m.name)}">${icon(on ? "heart-f" : "heart")}</button>`;
}
function cmpBtn(m, onimg=true){
  const on = cmp.includes(m.id);
  return `<button class="iconbtn${onimg ? " onimg" : ""}" data-cmp="${m.id}" aria-pressed="${on}" aria-label="${on ? "Aus Vergleich entfernen" : "Zum Vergleich"}: ${esc(m.name)}">${icon("compare")}</button>`;
}
function card(m, q=""){
  return `<article class="mcard">
    <div class="media">${pimg(m, 640)}
      <div class="acts">${favBtn(m)}${cmpBtn(m)}</div>
      <div class="lvl">${meter(m.score)}</div>
    </div>
    <div class="body">
      <h3><a href="#/pilz/${m.id}">${hl(m.name, q)}</a></h3>
      <div class="latin">${hl(m.latin, q)}</div>
      <p class="sum">${hl(m.summary, q)}</p>
      <div class="foot">${risk(m.risk)}<span class="chips">${m.tags.slice(0,1).map(t => `<span class="chip">${D.TAG_ICONS[t] || ""} ${esc(t)}</span>`).join("")}</span></div>
    </div>
  </article>`;
}
function lrow(m, q=""){
  const top = m.effects.find(e => e.l === "E") || m.effects.find(e => e.l === "F") || m.effects[0];
  return `<article class="lrow">
    <div class="th">${pimg(m, 200, false)}</div>
    <div class="mid"><h3><a href="#/pilz/${m.id}">${hl(m.name, q)}</a></h3><div class="latin">${hl(m.latin, q)}</div>
      <div class="top"><span class="lv ${top.l}">${top.l}</span> ${esc(top.t)}</div></div>
    <div class="right">${meter(m.score)}${risk(m.risk)}</div>
  </article>`;
}
function hl(text, q){
  const t = esc(text); if(!q) return t;
  const terms = q.split(/\s+/).filter(w => w.length > 1).map(w => esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if(!terms.length) return t;
  return t.replace(new RegExp("(" + terms.join("|") + ")", "gi"), "<mark>$1</mark>");
}

/* ---------- Suche ---------- */
const hay = Object.fromEntries(M.map(m => [m.id, {
  head: norm([m.name, m.latin, m.alt].join(" ")),
  all: norm([m.name, m.latin, m.alt, m.summary, m.substances, m.dose, m.tags.join(" "), m.forms.join(" "),
    m.effects.map(e => e.t + " " + e.d).join(" "), m.safety.join(" ")].join(" "))
}]));
function search(q){
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if(!terms.length) return M.slice();
  return M.map(m => {
    const h = hay[m.id]; if(!terms.every(t => h.all.includes(t))) return null;
    let s = 0; for(const t of terms){ if(h.head.includes(t)) s += 10; if(norm(m.name).startsWith(t)) s += 20; s += (h.all.split(t).length - 1); }
    return {m, s};
  }).filter(Boolean).sort((a, b) => b.s - a.s).map(x => x.m);
}

/* ---------- Einstellungen ---------- */
const FS = [0.875, 1, 1.125, 1.25, 1.4];
function setFs(v){
  v = FS.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a, 1);
  document.documentElement.style.fontSize = (v * 100) + "%"; store.set("ph-fs", v);
  $$("#fsSeg button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.v === v)));
  if(typeof fitToolbar === "function") fitToolbar();
}
function curFs(){ return store.get("ph-fs", 1); }
/* Toolbar stufenweise verdichten, bis sie passt */
function fitToolbar(){
  const c = $(".toolbar .container"); if(!c) return;
  const steps = ["c1", "c2", "c3", "c4", "c5", "c6"];
  c.classList.remove(...steps);
  for(const k of steps){ if(c.scrollWidth <= c.clientWidth + 1) break; c.classList.add(k); }
}
window.addEventListener("resize", fitToolbar);
if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitToolbar);
$$(".fontgroup button").forEach(b => b.addEventListener("click", () => {
  const d = +b.dataset.fs, i = FS.indexOf(curFs());
  if(d === 0) setFs(1); else setFs(FS[Math.max(0, Math.min(FS.length - 1, (i < 0 ? 1 : i) + d))]);
  toast("Textgröße " + Math.round(curFs() * 100) + " %");
}));
$$("#fsSeg button").forEach(b => b.addEventListener("click", () => setFs(+b.dataset.v)));

function setTheme(t){
  if(t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
  try{ localStorage.setItem("ph-theme", t); }catch(e){}
  $("#themeBtn use").setAttribute("href", t === "light" ? "#i-sun" : t === "dark" ? "#i-moon" : "#i-auto");
  $("#themeBtn").setAttribute("aria-label", "Farbschema: " + ({light:"Hell", dark:"Dunkel", auto:"Automatisch"}[t]) + ". Klicken zum Wechseln.");
  $$("#themeSeg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === t)));
}
function curTheme(){ try{ const t = localStorage.getItem("ph-theme"); return t === "light" || t === "dark" ? t : "auto"; }catch(e){ return "auto"; } }
$("#themeBtn").addEventListener("click", () => {
  const next = {auto:"light", light:"dark", dark:"auto"}[curTheme()];
  setTheme(next); toast({auto:"Farbschema folgt dem System", light:"Heller Modus", dark:"Dunkler Modus"}[next]);
});
$$("#themeSeg button").forEach(b => b.addEventListener("click", () => setTheme(b.dataset.v)));

const pop = $("#settings");
$("#settingsBtn").addEventListener("click", e => {
  e.stopPropagation(); const open = !pop.classList.contains("show");
  pop.classList.toggle("show", open); $("#settingsBtn").setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", e => {
  if(!pop.contains(e.target) && e.target !== $("#settingsBtn")){ pop.classList.remove("show"); $("#settingsBtn").setAttribute("aria-expanded", "false"); }
  if(!$("#gsearch").contains(e.target) && !e.target.closest("#searchToggle")) closeSuggest();
});

/* ---------- Globale Suche mit Vorschlägen ---------- */
const gq = $("#gq"), sug = $("#suggest");
let sugIdx = -1;
function closeSuggest(){ sug.classList.remove("show"); gq.setAttribute("aria-expanded", "false"); sugIdx = -1; if(innerWidth < 700) $("#gsearch").classList.remove("open"); }
function renderSuggest(){
  const q = gq.value.trim();
  if(!q){ sug.classList.remove("show"); return; }
  const res = search(q).slice(0, 6);
  sug.innerHTML = res.map((m, i) => `<a href="#/pilz/${m.id}" role="option" data-i="${i}"><span class="thumb">${pimg(m, 120, false)}</span><span><span class="t">${hl(m.name, q)}</span><br><span class="s">${esc(m.latin)}</span></span></a>`).join("") +
    `<a class="all" href="#/pilze?q=${encodeURIComponent(q)}" data-i="${res.length}">${res.length ? "Alle Treffer anzeigen" : "Keine direkten Treffer, im Katalog suchen"}</a>`;
  sug.classList.add("show"); gq.setAttribute("aria-expanded", "true"); sugIdx = -1;
}
gq.addEventListener("input", renderSuggest);
gq.addEventListener("focus", () => gq.value && renderSuggest());
gq.addEventListener("keydown", e => {
  const items = $$("a", sug);
  if(e.key === "ArrowDown" || e.key === "ArrowUp"){
    e.preventDefault(); if(!items.length) return;
    sugIdx = (sugIdx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items.forEach((a, i) => a.classList.toggle("active", i === sugIdx));
  } else if(e.key === "Enter"){
    e.preventDefault();
    location.hash = sugIdx >= 0 && items[sugIdx] ? items[sugIdx].getAttribute("href") : "#/pilze?q=" + encodeURIComponent(gq.value.trim());
    closeSuggest(); gq.value = ""; gq.blur();
  } else if(e.key === "Escape"){ closeSuggest(); gq.blur(); }
});
sug.addEventListener("click", () => { closeSuggest(); gq.value = ""; });
$("#searchToggle").addEventListener("click", () => { $("#gsearch").classList.add("open"); gq.focus(); });
document.addEventListener("keydown", e => {
  if(e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){ e.preventDefault(); if(innerWidth < 700) $("#gsearch").classList.add("open"); gq.focus(); }
  if(e.key === "Escape" && pop.classList.contains("show")){
    const inside = pop.contains(document.activeElement);
    pop.classList.remove("show"); $("#settingsBtn").setAttribute("aria-expanded", "false");
    if(inside) $("#settingsBtn").focus();
  }
});

/* ---------- Merkliste & Vergleich (delegiert) ---------- */
document.addEventListener("click", e => {
  const f = e.target.closest("[data-fav]");
  if(f){
    e.preventDefault(); const id = f.dataset.fav, m = byId[id];
    if(favs.has(id)){ favs.delete(id); toast(m.name + " von der Merkliste entfernt"); } else { favs.add(id); toast(m.name + " gemerkt"); }
    saveFavs();
    $$(`[data-fav="${id}"]`).forEach(b => { const on = favs.has(id); b.setAttribute("aria-pressed", on); b.querySelector("use").setAttribute("href", on ? "#i-heart-f" : "#i-heart"); });
    if(["merkliste", "arztkarte"].includes(route().path)) render();
    return;
  }
  const c = e.target.closest("[data-cmp]");
  if(c){
    e.preventDefault(); const id = c.dataset.cmp, m = byId[id];
    if(cmp.includes(id)) cmp = cmp.filter(x => x !== id);
    else { if(cmp.length >= 3){ toast("Maximal 3 Pilze gleichzeitig vergleichen"); return; } cmp.push(id); toast(m.name + " zum Vergleich hinzugefügt"); }
    saveCmp();
    $$(`[data-cmp="${id}"]`).forEach(b => b.setAttribute("aria-pressed", cmp.includes(id)));
    if(route().path === "vergleich") render();
  }
});
function syncBadges(){ $$("[data-favcount]").forEach(b => b.textContent = favs.size || ""); }
function syncTray(){
  const show = cmp.length > 0 && route().path !== "vergleich";
  $("#tray").classList.toggle("show", show);
  $("#trayText").textContent = cmp.length === 1 ? "1 Pilz ausgewählt" : cmp.length + " Pilze ausgewählt";
}
$("#trayClear").addEventListener("click", () => {
  if(!cmp.length) return;
  const prev = cmp;
  cmp = []; saveCmp(); $$("[data-cmp]").forEach(b => b.setAttribute("aria-pressed", "false"));
  if(route().path === "vergleich") render();
  toast("Vergleich geleert", { onUndo: () => {
    cmp = prev; saveCmp();
    $$("[data-cmp]").forEach(b => b.setAttribute("aria-pressed", cmp.includes(b.dataset.cmp)));
    if(route().path === "vergleich") render();
  } });
});

/* ---------- Router ---------- */
function route(){
  const h = location.hash.replace(/^#\/?/, "");
  const [p, qs] = h.split("?");
  const parts = p.split("/").filter(Boolean);
  return { path: parts[0] || "", arg: parts[1] ? decodeURIComponent(parts[1]) : "", params: new URLSearchParams(qs || "") };
}
const VIEWS = { "":home, pilze:catalog, pilz:detail, vergleich:compare, check, merkliste:favorites, shops, wissen, ueber:about, impressum, datenschutz, rezepte:recipes, arztkarte, tagebuch, radar };
let lastPath = null;
function render(){
  const r = route();
  const view = VIEWS[r.path] || notFound;
  const main = $("#main");
  const samePage = lastPath === r.path + "/" + r.arg;
  const title = view(main, r, samePage);
  document.title = (title ? title + " · " : "") + "Pilz Handel";
  $$("[data-nav]").forEach(a => {
    const n = a.dataset.nav, cur = (n === "home" && r.path === "") || n === r.path || (n === "pilze" && r.path === "pilz");
    if(cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if(!samePage){ window.scrollTo(0, 0); if(lastPath !== null) main.focus({preventScroll:true}); }
  lastPath = r.path + "/" + r.arg;
  syncTray();
}
window.addEventListener("hashchange", render);

/* ================= Seiten ================= */

function home(el){
  const top = M.slice().sort((a, b) => b.score - a.score || a.risk - b.risk).slice(0, 8);
  const fresh = M.filter(m => m.buy.includes("frisch"));
  const counts = Object.fromEntries(D.TAGS.map(t => [t, M.filter(m => m.tags.includes(t)).length]));
  el.innerHTML = `
  <section class="hero">
    <svg class="deco" viewBox="0 0 80 80" aria-hidden="true"><use href="#i-logo"/></svg>
    <div class="bg"><img alt="" src="${fileUrl(HERO[0], 1600)}" data-alt-src="${esc(HERO.slice(1).map(h => fileUrl(h, 1600)).join("|"))}"></div>
    <div class="container inner">
      <div class="eyebrow">Heilpilze · Evidenz · Einkauf</div>
      <h1 class="display">Heilpilze,<br><em>ehrlich</em> eingeordnet.</h1>
      <p class="lead">21 Pilze, die du in Deutschland kaufen kannst. Jede Wirkung mit Evidenzstufe und Quelle, dazu Wechselwirkungen, Dosierung und seriöse Bezugsquellen.</p>
      <form class="herosearch" id="heroSearch" role="search">
        ${icon("search")}<input id="heroQ" type="search" placeholder="z. B. Reishi, Schlaf, Blutzucker …" aria-label="Pilze durchsuchen">
        <button class="btn accent" type="submit">Suchen</button>
      </form>
      <div class="actions">
        <a class="btn ghost" href="#/pilze">${icon("grid")} Alle Pilze</a>
        <a class="btn ghost" href="#/check">${icon("shield")} Wechselwirkungen prüfen</a>
      </div>
      <div class="trustrow">
        <span>${icon("check")} Unabhängig, keine Werbepartner</span>
        <span>${icon("flask")} ${M.reduce((n, m) => n + m.sources.length, 0)} Quellen verlinkt</span>
        <span>${icon("leaf")} Keine Heilversprechen</span>
      </div>
    </div>
    <a class="credit" href="${filePage(HERO[0])}" target="_blank" rel="noopener">Foto: Wikimedia Commons${imgCredit(HERO[0])}</a>
  </section>

  <section class="section container">
    <div class="sechead"><div><div class="eyebrow">Finder</div><h2 class="h2">Wofür suchst du etwas?</h2><p>Wähle ein Anliegen, wir zeigen die Pilze mit der besten Studienlage zuerst.</p></div></div>
    <div class="tiles">${D.TAGS.map(t => `<a class="tile" href="#/pilze?tag=${encodeURIComponent(t)}"><span class="ic" aria-hidden="true">${D.TAG_ICONS[t] || "🍄"}</span><b>${esc(t)}</b><small>${counts[t]} Pilze</small></a>`).join("")}</div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="sechead"><div><div class="eyebrow">Am besten belegt</div><h2 class="h2">Wo die Forschung am weitesten ist</h2><p>Sortiert nach Humanevidenz: dem Punktwert (0–4) der am besten belegten Wirkung je Pilz.</p></div><a class="link-more" href="#/pilze?sort=score">Alle ansehen</a></div>
    <div class="scroller">${top.map(m => card(m)).join("")}</div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="sechead"><div><div class="eyebrow">Unsere Methode</div><h2 class="h2">Vier Stufen statt Werbeversprechen</h2><p>Jede einzelne Wirkungsaussage bekommt die Stufe, die ihre beste Quelle hergibt.</p></div><a class="link-more" href="#/wissen">Mehr zur Methode</a></div>
    ${levelsHtml()}
  </section>

  <section class="section container" style="padding-top:0">
    <div class="band">
      <div>
        <div class="eyebrow" style="color:var(--accent-2)">Sicherheit zuerst</div>
        <h2>Nimmst du Medikamente?</h2>
        <p>Einige Heilpilze verstärken Blutverdünner oder senken den Blutzucker. Der Check zeigt in Sekunden, welche Pilze du mit deinem Arzt besprechen solltest.</p>
        <a class="btn" href="#/check">${icon("shield")} Wechselwirkungen prüfen</a>
      </div>
      <ul>
        <li>Chaga: Nierenschäden durch Oxalat dokumentiert</li>
        <li>Reishi und Agaricus: Einzelfälle von Leberschäden</li>
        <li>Reishi, Judasohr, Maitake: Gerinnungshemmung</li>
        <li>Shiitake roh: juckender Hautausschlag möglich</li>
      </ul>
    </div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="sechead"><div><div class="eyebrow">Werkzeuge</div><h2 class="h2">Für den Alltag</h2></div></div>
    <div class="tools4">
      <a class="tile" href="#/arztkarte"><span class="ic" aria-hidden="true">🩺</span><b>Arzt-Karte</b><small>„Das nehme ich, bitte prüfen“ zum Ausdrucken</small></a>
      <a class="tile" href="#/tagebuch"><span class="ic" aria-hidden="true">📓</span><b>Einnahme-Tagebuch</b><small>Menge und Befinden notieren, Kalender-Erinnerung</small></a>
      <a class="tile" href="#/rezepte"><span class="ic" aria-hidden="true">🍳</span><b>Rezepte</b><small>${R.length} Gerichte mit frischen Edelpilzen</small></a>
      <a class="tile" href="#/radar"><span class="ic" aria-hidden="true">📡</span><b>Studien-Radar</b><small>Neue Studien aus PubMed, noch nicht eingestuft</small></a>
    </div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="sechead"><div><div class="eyebrow">Aus Wald und Küche</div><h2 class="h2">Frisch kaufen statt Kapseln</h2><p>Diese Heilpilze gibt es als Speisepilz. Zwei bis drei Portionen pro Woche sind das, was Beobachtungsstudien überhaupt stützen.</p></div><span style="display:flex;gap:1rem"><a class="link-more" href="#/rezepte">Rezepte</a><a class="link-more" href="#/shops">Wo kaufen</a></span></div>
    <div class="scroller">${fresh.map(m => card(m)).join("")}</div>
  </section>`;
  $("#heroSearch").addEventListener("submit", e => { e.preventDefault(); location.hash = "#/pilze?q=" + encodeURIComponent($("#heroQ").value.trim()); });
  return "";
}

function levelsHtml(){
  const txt = {
    E:"Randomisierte Studien oder Meta-Analysen am Menschen. Oft nur für ein bestimmtes, standardisiertes Präparat.",
    F:"Zell- und Tierstudien, kleine Pilotstudien oder widersprüchliche Humandaten. Plausibel, aber nicht belegt.",
    T:"Überlieferte Anwendung in TCM, Kampo oder europäischer Volksmedizin. Erfahrung, keine Studien.",
    S:"Marketing, Erfahrungsberichte oder Mykotherapie-Literatur ohne nachvollziehbare Belege."
  };
  return `<div class="levels">${Object.keys(D.LEVELS).map(k => `<div class="lvcard"><span class="lv ${k}">${k}</span><b>${esc(D.LEVELS[k].name)}</b><p>${txt[k]}</p></div>`).join("")}</div>`;
}

/* ---------- Katalog ---------- */
function catalog(el, r, same){
  const p = r.params;
  const st = {
    q: p.get("q") || "",
    tags: new Set((p.get("tag") || "").split(",").filter(t => D.TAGS.includes(t))),
    lv: new Set((p.get("lv") || "EFTS").split("").filter(k => D.LEVELS[k])),
    min: +(p.get("min") || 0),
    sort: p.get("sort") || "score",
    view: p.get("view") || store.get("ph-view", "grid"),
    buy: p.get("buy") || ""
  };
  if(!st.lv.size) st.lv = new Set(["E","F","T","S"]);
  const pushState = () => {
    const q = new URLSearchParams();
    if(st.q) q.set("q", st.q);
    if(st.tags.size) q.set("tag", [...st.tags].join(","));
    if(st.lv.size < 4) q.set("lv", [...st.lv].join(""));
    if(st.min) q.set("min", st.min);
    if(st.sort !== "score") q.set("sort", st.sort);
    if(st.buy) q.set("buy", st.buy);
    if(st.view !== "grid") q.set("view", st.view);
    const h = "#/pilze" + (q.toString() ? "?" + q : "");
    history.replaceState(null, "", h);
    store.set("ph-view", st.view);
  };
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Katalog</div>
    <h1 class="h2">Alle Heilpilze</h1>
    <p class="lead">Filtere nach Anliegen, Evidenzstufe und Bezugsart. Die Stufen-Filter blenden einzelne Wirkungsaussagen aus. „Evidenz ↓“ sortiert nach dem Punktwert (0–4) der am besten belegten Wirkung, „Risiken/Verträglichste zuerst“ nach dem Ausmaß dokumentierter Sicherheitsprobleme (0–3).</p>
  </div>
  <div class="filterbar"><div class="container">
    <div class="hscroll" id="tagbar" aria-label="Anliegen">
      <button class="fchip" data-tag="" aria-pressed="${!st.tags.size}">Alle</button>
      ${D.TAGS.map(t => `<button class="fchip" data-tag="${esc(t)}" aria-pressed="${st.tags.has(t)}">${D.TAG_ICONS[t] || ""} ${esc(t)}</button>`).join("")}
    </div>
    <button class="fchip ftoggle" id="fToggle" aria-expanded="false" aria-controls="moreF">${icon("sliders")} Filter &amp; Sortierung<span class="fcount" id="fCount"></span></button>
    <div class="morefilters" id="moreF">
    <div class="frow2">
      <div class="hscroll" id="lvbar" aria-label="Evidenzstufen">
        ${Object.keys(D.LEVELS).map(k => `<button class="fchip lvf" data-lv="${k}" aria-pressed="${st.lv.has(k)}"><span class="lv ${k}">${k}</span>${esc(D.LEVELS[k].name)}</button>`).join("")}
      </div>
    </div>
    <div class="frow2">
      <label class="sr" for="csearch">Im Katalog suchen</label>
      <input id="csearch" class="select" style="flex:1;min-width:10rem" type="search" placeholder="Im Katalog suchen …" value="${esc(st.q)}">
      <label class="sr" for="cbuy">Bezugsart</label>
      <select id="cbuy" class="select"><option value="">Jede Bezugsart</option>${Object.entries(D.BUY).map(([k, b]) => `<option value="${k}" ${st.buy === k ? "selected" : ""}>${b.icon} ${esc(b.label)}</option>`).join("")}</select>
      <label class="sr" for="cmin">Mindest-Evidenz</label>
      <select id="cmin" class="select"><option value="0">Jede Evidenz</option>${[1,2,3,4].map(n => `<option value="${n}" ${st.min === n ? "selected" : ""}>ab ${esc(D.SCORE_LBL[n])}</option>`).join("")}</select>
      <label class="sr" for="csort">Sortierung</label>
      <select id="csort" class="select">
        <option value="score" ${st.sort === "score" ? "selected" : ""}>Evidenz ↓</option>
        <option value="name" ${st.sort === "name" ? "selected" : ""}>Name A–Z</option>
        <option value="risk" ${st.sort === "risk" ? "selected" : ""}>Risiken zuerst</option>
        <option value="safe" ${st.sort === "safe" ? "selected" : ""}>Verträglichste zuerst</option>
      </select>
      <div class="seg" role="group" aria-label="Ansicht">
        <button data-view="grid" aria-pressed="${st.view === "grid"}" aria-label="Kachelansicht">${icon("grid")}</button>
        <button data-view="list" aria-pressed="${st.view === "list"}" aria-label="Listenansicht">${icon("list")}</button>
      </div>
    </div>
    </div>
  </div></div>
  <div class="container">
    <p class="resultcount" id="rc" aria-live="polite"></p>
    <div id="results"></div>
  </div>`;
  $$(".seg[aria-label=Ansicht] svg", el).forEach(s => { s.style.width = "1rem"; s.style.height = "1rem"; });

  const update = () => {
    let list = search(st.q)
      .filter(m => m.score >= st.min)
      .filter(m => !st.tags.size || [...st.tags].every(t => m.tags.includes(t)))
      .filter(m => !st.buy || m.buy.includes(st.buy))
      .filter(m => m.effects.some(e => st.lv.has(e.l)));
    if(st.sort === "name") list.sort((a, b) => coll.compare(a.name, b.name));
    else if(st.sort === "risk") list.sort((a, b) => b.risk - a.risk || b.score - a.score);
    else if(st.sort === "safe") list.sort((a, b) => a.risk - b.risk || b.score - a.score);
    else if(!st.q) list.sort((a, b) => b.score - a.score || coll.compare(a.name, b.name));
    $("#rc").textContent = list.length === M.length ? `${M.length} Pilze` : `${list.length} von ${M.length} Pilzen`;
    const q = st.q.trim();
    $("#results").innerHTML = list.length
      ? (st.view === "list" ? `<div class="list">${list.map(m => lrow(m, q)).join("")}</div>` : `<div class="grid">${list.map(m => card(m, q)).join("")}</div>`)
      : `<div class="empty"><div class="big" aria-hidden="true">🍄‍🟫</div><p>Kein Pilz passt zu dieser Kombination.</p><button class="btn soft sm" id="resetF">Filter zurücksetzen</button></div>`;
    const rf = $("#resetF"); if(rf) rf.addEventListener("click", () => { location.hash = "#/pilze"; lastPath = null; render(); });
    const nf = (st.lv.size < 4 ? 1 : 0) + (st.min ? 1 : 0) + (st.buy ? 1 : 0) + (st.q ? 1 : 0) + (st.sort !== "score" ? 1 : 0);
    $("#fCount").textContent = nf ? " · " + nf : "";
    pushState();
  };
  $("#fToggle").addEventListener("click", () => {
    const open = $("#moreF").classList.toggle("open"); $("#fToggle").setAttribute("aria-expanded", String(open));
  });
  $$("#tagbar .fchip", el).forEach(b => b.addEventListener("click", () => {
    const t = b.dataset.tag;
    if(!t) st.tags.clear(); else st.tags.has(t) ? st.tags.delete(t) : st.tags.add(t);
    $$("#tagbar .fchip", el).forEach(x => x.setAttribute("aria-pressed", x.dataset.tag ? st.tags.has(x.dataset.tag) : !st.tags.size));
    update();
  }));
  $$("#lvbar .fchip", el).forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.lv;
    if(st.lv.has(k)){ if(st.lv.size > 1) st.lv.delete(k); else return toast("Mindestens eine Stufe muss aktiv bleiben"); } else st.lv.add(k);
    b.setAttribute("aria-pressed", st.lv.has(k)); update();
  }));
  let deb; $("#csearch").addEventListener("input", e => { clearTimeout(deb); deb = setTimeout(() => { st.q = e.target.value; update(); }, 120); });
  $("#cbuy").addEventListener("change", e => { st.buy = e.target.value; update(); });
  $("#cmin").addEventListener("change", e => { st.min = +e.target.value; update(); });
  $("#csort").addEventListener("change", e => { st.sort = e.target.value; update(); });
  $$("[data-view]", el).forEach(b => b.addEventListener("click", () => {
    st.view = b.dataset.view; $$("[data-view]", el).forEach(x => x.setAttribute("aria-pressed", x.dataset.view === st.view)); update();
  }));
  update();
  return st.tags.size ? [...st.tags].join(", ") : "Alle Heilpilze";
}

/* ---------- Detail ---------- */
function detail(el, r){
  const m = byId[r.arg];
  if(!m) return notFound(el);
  const idx = M.indexOf(m), prev = M[(idx - 1 + M.length) % M.length], next = M[(idx + 1) % M.length];
  const lvCount = k => m.effects.filter(e => e.l === k).length;
  const shops = D.SHOPS.filter(s => m.buy.includes(s.cat));
  const flagList = Object.entries(m.flags).filter(([k]) => k !== "schwanger").sort((a, b) => b[1] - a[1]);
  el.innerHTML = `
  <section class="dhero">
    ${pimg(m, 1400, true, "meet")}
    <a class="iconbtn onimg back" href="#/pilze" aria-label="Zurück zum Katalog">${icon("back")}</a>
    <div class="dacts">${favBtn(m)}${cmpBtn(m)}<button class="iconbtn onimg" id="shareBtn" aria-label="Teilen">${icon("share")}</button></div>
    <div class="container">
      <div class="chips" style="margin-bottom:.6rem">${m.tags.map(t => `<a class="chip" href="#/pilze?tag=${encodeURIComponent(t)}">${D.TAG_ICONS[t] || ""} ${esc(t)}</a>`).join("")}</div>
      <h1>${esc(m.name)}</h1>
      <div class="latin">${esc(m.latin)}</div>
      <div class="alt">${esc(m.alt)}</div>
    </div>
  </section>
  <div class="container">
    <div class="facts">
      <div class="fact"><div class="k">Humanevidenz</div><div class="v">${meter(m.score, true)}</div></div>
      <div class="fact"><div class="k">Sicherheit</div><div class="v">${risk(m.risk)}</div></div>
      <div class="fact"><div class="k">Aussagen</div><div class="v">${["E","F","T","S"].map(k => `<span class="lv ${k}" title="${esc(D.LEVELS[k].name)}">${k} ${lvCount(k)}</span>`).join(" ")}</div></div>
      <div class="fact"><div class="k">Erhältlich als</div><div class="v" style="font-size:.85rem">${m.buy.map(b => D.BUY[b].icon + " " + esc(D.BUY[b].label)).join(" · ")}</div></div>
    </div>
    <div class="dlayout">
      <div>
        <p class="dsum">${esc(m.summary)}</p>
        <section class="dsec" id="wirkungen">
          <h2>Wirkungen und Einstufung</h2>
          <div class="lvfilter" role="group" aria-label="Stufen filtern">
            ${["E","F","T","S"].map(k => `<button class="fchip lvf" data-dl="${k}" aria-pressed="true"><span class="lv ${k}">${k}</span>${esc(D.LEVELS[k].name)} (${lvCount(k)})</button>`).join("")}
          </div>
          <div class="effects">${m.effects.map(e => `<div class="effect" data-l="${e.l}"><span class="lv ${e.l}" title="${esc(D.LEVELS[e.l].name)}">${e.l}</span><div><b>${esc(e.t)}</b><p>${esc(e.d)}</p></div></div>`).join("")}</div>
        </section>
        <section class="dsec">
          <h2>Inhaltsstoffe und Dosierung</h2>
          <div class="card kv">
            <div><h4>Wichtige Inhaltsstoffe</h4><p>${esc(m.substances)}</p></div>
            <div><h4>Dosierung</h4><p>${esc(m.dose)}</p></div>
            <div><h4>Darreichungsformen</h4><div class="chips">${m.forms.map(f => `<span class="chip">${esc(f)}</span>`).join("")}</div></div>
          </div>
        </section>
        <section class="dsec">
          <h2>Kaufen</h2>
          <div class="buyrow">${m.buy.map(b => `<a class="chip" href="#/pilze?buy=${b}">${D.BUY[b].icon} ${esc(D.BUY[b].label)}</a>`).join("")}</div>
          <div class="shopgrid">${shops.slice(0, 4).map(shopCard).join("")}</div>
          <p class="muted" style="font-size:.85rem;margin-top:.8rem">Die Shops führen nicht zwingend genau diesen Pilz. Bitte Sortiment prüfen. <a href="#/shops">Einkaufs-Checkliste ansehen</a>.</p>
        </section>
        ${R.some(x => x.pilze.includes(m.id)) ? `<section class="dsec">
          <h2>In der Küche</h2>
          <div class="scroller">${R.filter(x => x.pilze.includes(m.id)).map(recipeCard).join("")}</div>
        </section>` : ""}
        <section class="dsec">
          <h2>Quellen</h2>
          <ol class="srcs">${m.sources.map(s => `<li><a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a></li>`).join("")}</ol>
          ${RD && RD.items[m.id] && RD.items[m.id].list.length ? `<details class="acc" style="margin-top:1rem"><summary>Neu in PubMed, noch nicht eingestuft (${RD.items[m.id].count})</summary><div class="body"><ul class="studies">${RD.items[m.id].list.slice(0, 5).map(studyRow).join("")}</ul><p><a href="#/radar">Zum Studien-Radar</a></p></div></details>` : ""}
          <p style="margin-top:.8rem;font-size:.9rem"><a href="${pubmedUrl(m)}" target="_blank" rel="noopener">Aktuelle Humanstudien in PubMed ↗</a></p>
          <p class="muted" style="font-size:.8rem;margin-top:.8rem">Foto: ${(m.imgs || []).map((n, i) => `<a href="${filePage(n)}" target="_blank" rel="noopener">Wikimedia Commons${m.imgs.length > 1 ? " " + (i + 1) : ""}</a>${imgCredit(n)}`).join(", ")} · vollständige Angaben auf der jeweiligen Dateiseite. Lädt das Foto nicht, siehst du eine Illustration.</p>
          <p style="margin-top:.8rem;font-size:.85rem"><a href="${issueUrl(m.name, "Pilz: " + m.name + "\nWas ist falsch, und woher weißt du das?\n\n")}" target="_blank" rel="noopener">Fehler bei diesem Pilz melden ↗</a></p>
        </section>
      </div>
      <aside class="dside">
        <div class="card danger"><h3>Sicherheit</h3><ul>${m.safety.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
        ${flagList.length ? `<div class="card"><h3>Mit Arzt klären bei</h3><div class="chips">${flagList.map(([k, v]) => `<span class="chip ${v === 2 ? "warn" : ""}">${D.FLAGS[k].icon} ${esc(D.FLAGS[k].label)}</span>`).join("")}</div><a class="btn sm soft" style="margin-top:.8rem" href="#/check">${icon("shield")} Persönlichen Check starten</a></div>` : ""}
        <div class="card"><h3>Weiter</h3><div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn sm" data-cmp="${m.id}" aria-pressed="${cmp.includes(m.id)}">${icon("compare")} Vergleichen</button>
          <button class="btn sm soft" onclick="window.print()">${icon("print")} Drucken</button>
        </div></div>
      </aside>
    </div>
    <nav class="pager" aria-label="Weitere Pilze">
      <a href="#/pilz/${prev.id}"><small>← Vorheriger</small><b>${esc(prev.name)}</b></a>
      <a class="next" href="#/pilz/${next.id}"><small>Nächster →</small><b>${esc(next.name)}</b></a>
    </nav>
  </div>`;
  $$("[data-dl]", el).forEach(b => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") !== "true";
    if(!on && $$("[data-dl][aria-pressed=true]", el).length === 1) return toast("Mindestens eine Stufe muss aktiv bleiben");
    b.setAttribute("aria-pressed", on);
    const act = new Set($$("[data-dl][aria-pressed=true]", el).map(x => x.dataset.dl));
    $$(".effect", el).forEach(x => x.hidden = !act.has(x.dataset.l));
  }));
  $("#shareBtn").addEventListener("click", async () => {
    const url = location.href;
    try{
      if(navigator.share){ await navigator.share({title: m.name + " · Pilz Handel", text: m.summary, url}); }
      else { await navigator.clipboard.writeText(url); toast("Link kopiert"); }
    }catch(e){}
  });
  return m.name;
}

function shopCard(s){
  return `<article class="shop">
    <span class="chip" style="align-self:flex-start">${D.BUY[s.cat].icon} ${esc(D.BUY[s.cat].label)}</span>
    <h3>${esc(s.name)}</h3>
    ${s.place ? `<div class="place">${esc(s.place)}</div>` : ""}
    <p>${esc(s.why)}</p>
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ""}
    <a class="btn sm" href="${esc(s.url)}" target="_blank" rel="noopener">Zum Shop ↗</a>
  </article>`;
}

/* ---------- Vergleich ---------- */
function compare(el){
  const list = cmp.map(id => byId[id]);
  const rows = [
    ["Humanevidenz", m => meter(m.score)],
    ["Sicherheit", m => risk(m.risk)],
    ["Anliegen", m => `<div class="chips">${m.tags.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>`],
    ["Belegt (E)", m => lvList(m, "E")],
    ["Forschung (F)", m => lvList(m, "F", 3)],
    ["Tradition (T)", m => lvList(m, "T", 3)],
    ["Wichtigste Risiken", m => `<ul>${m.safety.slice(0, 2).map(s => `<li>${esc(s)}</li>`).join("")}</ul>`],
    ["Dosierung", m => esc(m.dose)],
    ["Erhältlich", m => m.buy.map(b => D.BUY[b].icon + " " + esc(D.BUY[b].label)).join("<br>")]
  ];
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Vergleich</div>
    <h1 class="h2">Bis zu drei Pilze nebeneinander</h1>
    <p class="lead">Wähle Pilze aus der Liste oder über das Vergleichs-Symbol auf jeder Karte.</p>
    <div class="picker" role="group" aria-label="Pilze zum Vergleich auswählen">${M.slice().sort((a, b) => coll.compare(a.name, b.name)).map(m => `<button class="fchip" data-cmp="${m.id}" aria-pressed="${cmp.includes(m.id)}">${esc(m.name)}</button>`).join("")}</div>
  </div>
  <div class="container">
    ${list.length ? `<div class="cmpwrap"><table class="cmp">
      <thead><tr><th scope="col"><span class="sr">Merkmal</span></th>${list.map(m => `<td><div class="th">${pimg(m, 480, false)}</div><h3><a href="#/pilz/${m.id}">${esc(m.name)}</a></h3><div class="muted" style="font-style:italic;font-size:.82rem">${esc(m.latin)}</div><div style="margin-top:.5rem;display:flex;gap:.35rem">${favBtn(m, false)}<button class="iconbtn" data-cmp="${m.id}" aria-pressed="true" aria-label="Aus Vergleich entfernen">${icon("x")}</button></div></td>`).join("")}</tr></thead>
      <tbody>${rows.map(([k, f]) => `<tr><th scope="row">${k}</th>${list.map(m => `<td>${f(m)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>` : `<div class="empty"><div class="big" aria-hidden="true">⚖️</div><p>Noch nichts ausgewählt. Tippe oben auf zwei oder drei Pilze.</p><p><a class="btn soft sm" href="#" id="cmpDemo">Beispiel: Reishi, Hericium, Cordyceps</a></p></div>`}
  </div>`;
  const demo = $("#cmpDemo");
  if(demo) demo.addEventListener("click", e => { e.preventDefault(); cmp = ["reishi","hericium","cordyceps"]; saveCmp(); render(); });
  return "Vergleich";
}
function lvList(m, l, max=9){
  const e = m.effects.filter(x => x.l === l);
  if(!e.length) return `<span class="muted">—</span>`;
  return `<ul>${e.slice(0, max).map(x => `<li>${esc(x.t)}</li>`).join("")}${e.length > max ? `<li class="muted">+ ${e.length - max} weitere</li>` : ""}</ul>`;
}

/* ---------- Wechselwirkungs-Check ---------- */
const FLAG_NOTE = {
  gerinnung:"kann die Blutgerinnung zusätzlich hemmen (Blutungsrisiko)",
  op:"vor Operationen 2 Wochen absetzen (Gerinnung)",
  diabetes:"kann den Blutzucker zusätzlich senken (Unterzuckerung)",
  blutdruck:"kann den Blutdruck zusätzlich senken",
  diuretika:"wirkt entwässernd, Elektrolyte beachten",
  immun:"stimuliert das Immunsystem, kann Immunsuppressiva entgegenwirken",
  autoimmun:"Immunstimulation bei Autoimmunerkrankung unklar",
  chemo:"nur in Absprache mit dem onkologischen Team",
  leber:"Leberschäden in Einzelfällen beschrieben",
  niere:"sehr oxalatreich bzw. entwässernd, Nierenbelastung",
  allergie:"allergische Reaktionen beschrieben",
  gicht:"purinreich",
  roh:"roh unverträglich oder Keimrisiko, immer garen",
  schwanger:"keine Sicherheitsdaten für Extrakte; Speisepilze gegart unproblematisch"
};
function check(el, r){
  const onlyFav = r.params.get("fav") === "1";
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Wechselwirkungs-Check</div>
    <h1 class="h2">Was trifft auf dich zu?</h1>
    <p class="lead">Wähle Medikamente und Umstände. Die Liste zeigt, welche Pilze du vorher ärztlich abklären solltest. Deine Auswahl bleibt nur auf diesem Gerät.</p>
  </div>
  <div class="container">
    <div class="checkgrid" role="group" aria-label="Medikamente und Umstände">
      ${Object.entries(D.FLAGS).map(([k, f]) => `<label class="ck"><input type="checkbox" value="${k}" ${flags.has(k) ? "checked" : ""}><span class="ic" aria-hidden="true">${f.icon}</span><span><b>${esc(f.label)}</b>${f.sub ? `<small>${esc(f.sub)}</small>` : ""}</span></label>`).join("")}
    </div>
    <div class="frow2" style="margin-top:1rem">
      <label class="fchip" style="cursor:pointer"><input type="checkbox" id="onlyFav" ${onlyFav ? "checked" : ""} style="accent-color:var(--accent)"> Nur Pilze auf meiner Merkliste (${favs.size})</label>
      <button class="btn sm soft" id="ckReset">Auswahl leeren</button>
      <a class="btn sm soft" href="#/arztkarte">${icon("print")} Als Arzt-Karte drucken</a>
    </div>
    <div id="ckOut" aria-live="polite"></div>
    <p class="notice info" style="margin-top:1.5rem"><b>Wichtig:</b> Der Check fasst bekannte Fallberichte und theoretische Risiken aus der Literatur zusammen. Er ist kein medizinischer Interaktionscheck und ersetzt nicht das Gespräch mit Arzt oder Apotheke.</p>
  </div>`;
  const out = () => {
    const sel = [...flags];
    const pool = $("#onlyFav").checked ? M.filter(m => favs.has(m.id)) : M;
    if(!sel.length){ $("#ckOut").innerHTML = `<div class="empty"><div class="big" aria-hidden="true">🛡️</div><p>Wähle oben mindestens einen Punkt aus.</p></div>`; return; }
    if(!pool.length){ $("#ckOut").innerHTML = `<div class="empty"><p>Deine Merkliste ist leer.</p></div>`; return; }
    const res = pool.map(m => {
      const {hits, lvl} = checkHits(m.flags, sel);
      return {m, hits, lvl};
    }).sort((a, b) => b.lvl - a.lvl || b.hits.length - a.hits.length || coll.compare(a.m.name, b.m.name));
    const n2 = res.filter(x => x.lvl === 2).length, n1 = res.filter(x => x.lvl === 1).length, n0 = res.length - n1 - n2;
    const ST = ["Kein bekannter Konflikt","Beachten","Ärztlich abklären"];
    $("#ckOut").innerHTML = `
      <div class="frow2" style="margin-top:1.5rem;gap:.4rem">
        <span class="chip" style="background:var(--danger-bg);color:var(--danger)">${n2} ärztlich abklären</span>
        <span class="chip" style="background:var(--warn-bg);color:var(--warn)">${n1} beachten</span>
        <span class="chip" style="background:var(--ok-bg);color:var(--ok)">${n0} kein bekannter Konflikt</span>
      </div>
      <div class="results">${res.map(({m, hits, lvl}) => `
        <article class="res l${lvl}">
          <div class="th">${pimg(m, 160, false)}</div>
          <div style="flex:1;min-width:0">
            <h3><a href="#/pilz/${m.id}">${esc(m.name)}</a></h3>
            ${hits.length ? `<ul>${hits.sort((a, b) => b.v - a.v).map(h => `<li><b>${esc(D.FLAGS[h.k].label)}:</b> ${esc(FLAG_NOTE[h.k])}${h.v === 2 ? " (Fälle dokumentiert)" : ""}</li>`).join("")}</ul>` : `<ul><li>Zu deiner Auswahl ist nichts Spezifisches bekannt. Fehlende Daten heißen nicht „sicher“.</li></ul>`}
          </div>
          <span class="st">${ST[lvl]}</span>
        </article>`).join("")}</div>`;
  };
  $$(".ck input", el).forEach(i => i.addEventListener("change", () => {
    i.checked ? flags.add(i.value) : flags.delete(i.value); store.set("ph-flags", [...flags]); out();
  }));
  $("#onlyFav").addEventListener("change", out);
  $("#ckReset").addEventListener("click", () => {
    if(!flags.size) return;
    const prev = new Set(flags);
    flags.clear(); store.set("ph-flags", []); $$(".ck input", el).forEach(i => i.checked = false); out();
    toast("Auswahl geleert", { onUndo: () => {
      flags = new Set(prev); store.set("ph-flags", [...flags]);
      $$(".ck input", el).forEach(i => i.checked = flags.has(i.value));
      out();
    } });
  });
  out();
  return "Wechselwirkungs-Check";
}

/* ---------- Merkliste ---------- */
function favorites(el, r){
  const shared = (r.params.get("ids") || "").split(",").filter(id => byId[id]);
  const list = [...favs].map(id => byId[id]);
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Merkliste</div>
    <h1 class="h2">Deine gemerkten Pilze</h1>
    <p class="lead">Gespeichert auf diesem Gerät. Über „Teilen“ erzeugst du einen Link, mit dem jemand anderes deine Liste übernehmen kann.</p>
  </div>
  <div class="container">
    ${shared.length ? `<div class="notice" style="margin-bottom:1.25rem"><b>Geteilte Liste:</b> ${shared.map(id => esc(byId[id].name)).join(", ")} <button class="btn sm accent" id="takeShared" style="margin-left:.5rem">Übernehmen</button></div>` : ""}
    ${list.length ? `
      <div class="frow2" style="margin-bottom:1rem">
        <a class="btn sm" href="#/check?fav=1">${icon("shield")} Wechselwirkungen prüfen</a>
        <a class="btn sm soft" href="#/arztkarte">${icon("print")} Arzt-Karte</a>
        <a class="btn sm soft" href="#/tagebuch">📓 Tagebuch</a>
        <button class="btn sm soft" id="favCmp">${icon("compare")} Vergleichen</button>
        <button class="btn sm soft" id="favShare">${icon("share")} Teilen</button>
        <button class="btn sm soft" onclick="window.print()">${icon("print")} Drucken</button>
      </div>
      <div class="grid">${list.map(m => card(m)).join("")}</div>`
    : `<div class="empty"><div class="big" aria-hidden="true">🤍</div><p>Noch nichts gemerkt. Tippe auf das Herz auf einer Pilzkarte.</p><a class="btn soft sm" href="#/pilze">Pilze entdecken</a></div>`}
  </div>`;
  const t = $("#takeShared"); if(t) t.addEventListener("click", () => { shared.forEach(id => favs.add(id)); saveFavs(); toast("Liste übernommen"); location.hash = "#/merkliste"; });
  const c = $("#favCmp"); if(c) c.addEventListener("click", () => { cmp = list.slice(0, 3).map(m => m.id); saveCmp(); location.hash = "#/vergleich"; });
  const s = $("#favShare"); if(s) s.addEventListener("click", async () => {
    const url = location.href.split("#")[0] + "#/merkliste?ids=" + list.map(m => m.id).join(",");
    try{ if(navigator.share) await navigator.share({title:"Meine Pilz-Merkliste", url}); else { await navigator.clipboard.writeText(url); toast("Link kopiert"); } }catch(e){}
  });
  return "Merkliste";
}

/* ---------- Shops ---------- */
function shops(el, r){
  const cat = r.params.get("cat") || "";
  const CAT = [["", "Alle"], ["extrakt", "🧪 Extrakte & Pulver"], ["frisch", "🧺 Frischpilze"], ["zucht", "🌱 Zuchtsets"], ["apotheke", "⚕️ Apotheke"]];
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Einkaufen</div>
    <h1 class="h2">Seriös einkaufen</h1>
    <p class="lead">Eine kleine, kuratierte Auswahl an Anbietern, die ihre Herkunft und Analysen offenlegen. Keine Werbepartnerschaften, keine Provisionen, keine Produkttests durch uns.</p>
  </div>
  <div class="container">
    <section class="section" style="padding-top:0">
      <h2 class="h2" style="margin-bottom:1rem">Checkliste vor dem Kauf</h2>
      <ul class="checklist">
        <li>Lateinischer Artname steht drauf, nicht nur „Cordyceps“ oder „Vitalpilz-Komplex“.</li>
        <li>Fruchtkörper oder Myzel ist deklariert. Myzel auf Getreide enthält oft mehr Stärke als Pilz.</li>
        <li>β-Glucan-Gehalt ist angegeben, nicht nur „Polysaccharide“ (die schließen Stärke ein).</li>
        <li>Analysenzertifikat auf Schwermetalle, Pestizide und Keime ist abrufbar.</li>
        <li>Bio-Siegel und Herkunftsland sind genannt. Pilze reichern Schwermetalle an.</li>
        <li>Keine Heilversprechen. Werbung mit „hilft gegen Krebs“ ist in der EU verboten und ein Warnsignal.</li>
        <li>Dosis pro Portion passt zu den Studien (meist 1–3 g Extrakt). Pilzkaffee liegt oft weit darunter.</li>
        <li>Realistischer Preis: Wild-Cordyceps oder Antrodia-Fruchtkörper kosten mehrere tausend Euro pro Kilo.</li>
      </ul>
    </section>
    <section style="padding-bottom:2rem">
      <div class="sechead"><h2 class="h2">Anbieter</h2></div>
      <div class="hscroll" style="margin-bottom:1rem" role="group" aria-label="Kategorie">${CAT.map(([k, l]) => `<a class="fchip" href="#/shops${k ? "?cat=" + k : ""}" aria-pressed="${cat === k}" style="text-decoration:none">${l}</a>`).join("")}</div>
      <div class="shopgrid">${D.SHOPS.filter(s => !cat || s.cat === cat).map(shopCard).join("")}</div>
      <p class="muted" style="font-size:.85rem;margin-top:1rem">Auswahlkriterien: nachvollziehbare Herkunft, Bio-Zertifizierung oder Laboranalysen, keine Heilversprechen auf der Startseite. Aufnahme heißt nicht, dass jedes Produkt dort empfehlenswert ist. Stand September 2026.</p>
    </section>
    <section class="section" style="padding-top:1rem">
      <div class="sechead"><div><div class="eyebrow">Weiterlesen</div><h2 class="h2">Gute Seiten zum Thema</h2></div></div>
      <div class="linkgroups">${D.LINKS.map(g => `<div class="card"><h3>${esc(g.group)}</h3><ul>${g.items.map(i => `<li><a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.name)}</a></li>`).join("")}</ul></div>`).join("")}</div>
    </section>
  </div>`;
  return "Einkaufen";
}

/* ---------- Wissen ---------- */
function wissen(el){
  const faq = [
    ["Sind Heilpilze Medikamente?", "Nein. In Deutschland sind sie Lebensmittel bzw. Nahrungsergänzungsmittel. Kein Pilzpräparat ist hier als Arzneimittel zugelassen. In Japan sind einzelne Extrakte (PSK, Lentinan) als Begleittherapie bei Krebs zugelassen."],
    ["Pulver oder Extrakt?", "Die meisten Studien nutzen Extrakte. Pulver enthält unverdauliche Zellwände (Chitin), die Wirkstoffe werden schlechter aufgenommen. Bei Speisepilzen ist das Kochen selbst eine Heißwasser-Extraktion."],
    ["Wie lange einnehmen?", "Studien laufen meist 8 bis 16 Wochen. Dauereinnahme hochkonzentrierter Extrakte ist nicht untersucht. Kurweise mit Pausen ist die vorsichtigere Wahl."],
    ["Kann ich mehrere Pilze kombinieren?", "Möglich, aber dann lässt sich eine Unverträglichkeit nicht zuordnen. Mischprodukte enthalten pro Pilz oft zu wenig für eine studienähnliche Dosis."],
    ["Warum hat Chaga so wenig Punkte, obwohl er so beliebt ist?", "Weil es keine einzige kontrollierte Studie am Menschen gibt. Die beeindruckenden Labordaten sagen wenig darüber, was im Körper ankommt. Dafür gibt es Fallberichte über Nierenschäden."]
  ];
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Wissen</div>
    <h1 class="h2">Methode, Einkauf, Sicherheit, Recht</h1>
    <p class="lead">Alles, was nicht zu einem einzelnen Pilz gehört.</p>
  </div>
  <div class="container">
    <section style="margin-bottom:2rem">${levelsHtml()}</section>
    <section style="margin-bottom:2rem">
      <h2 class="h2" style="margin-bottom:1rem">Häufige Fragen</h2>
      ${faq.map(([q, a]) => `<details class="acc"><summary>${esc(q)}</summary><div class="body"><p>${esc(a)}</p></div></details>`).join("")}
    </section>
    <section>
      <h2 class="h2" style="margin-bottom:1rem">Nachschlagen</h2>
      ${D.REFERENCE.map(x => `<details class="acc"><summary>${esc(x.title)}</summary><div class="body">${x.body}</div></details>`).join("")}
    </section>
  </div>`;
  return "Wissen";
}

function about(el){
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Über Pilz Handel</div>
    <h1 class="h2">Warum es diese App gibt</h1>
  </div>
  <div class="container" style="max-width:48rem">
    <p class="dsum">Der Markt für Heilpilze wächst schneller als die Studienlage. Pilz Handel sortiert jede Wirkungsbehauptung nach ihrer besten Quelle, damit du Chancen und Risiken selbst abwägen kannst.</p>
    <div class="card kv">
      <div><h4>Der Name</h4><p>Handel ist der Nachname des Machers. Das Wortspiel nehmen wir gern mit: Gehandelt wird hier mit Wissen, nicht mit Kapseln.</p></div>
      <div><h4>Unabhängigkeit</h4><p>Keine Werbepartner, keine Provisionen. Shops werden nach offengelegten Kriterien aufgenommen.</p></div>
      <div><h4>Quellen</h4><p>Cochrane-Reviews, randomisierte Studien, Fallberichte und Behördeninformationen. Jede Quelle ist beim jeweiligen Pilz verlinkt.</p></div>
      <div><h4>Grenzen</h4><p>Studien zu Heilpilzen sind oft klein, herstellerfinanziert oder nur für ein bestimmtes Präparat aussagekräftig. Neue Studien können Einstufungen ändern.</p></div>
      <div><h4>Datenschutz</h4><p>Merkliste, Vergleich, Check-Auswahl, Tagebuch, Arzt-Karte und Anzeige-Einstellungen bleiben lokal in deinem Browser. Es gibt kein Konto und kein Tracking. Nur die Fotos werden von Wikimedia Commons geladen; die Schriften liegen in der App selbst.</p></div>
      <div><h4>Stand</h4><p>Recherche September 2026. Diese App ersetzt keine ärztliche Beratung.</p></div>
    </div>
    <p style="margin-top:1.25rem"><a href="#/impressum">Impressum</a> · <a href="#/datenschutz">Datenschutzerklärung</a></p>
  </div>`;
  return "Über";
}

/* ---------- Impressum & Datenschutz (LEGAL-01), Angaben aus betreiber.js ---------- */
const BT = window.PH_BETREIBER || {};
const BT_FIELDS = { name: "Name", strasse: "Straße und Hausnummer", plzOrt: "PLZ und Ort", email: "E-Mail-Adresse" };
const btMissing = () => Object.keys(BT_FIELDS).filter(k => !String(BT[k] || "").trim());
const bt = k => String(BT[k] || "").trim() ? esc(BT[k]) : `<mark class="todo">[fehlt noch: ${BT_FIELDS[k]}]</mark>`;
const btMail = () => String(BT.email || "").trim() ? `<a href="mailto:${esc(BT.email)}">${esc(BT.email)}</a>` : bt("email");
const btDraft = () => btMissing().length ? `<p class="notice" role="note"><b>Entwurf:</b> Die Betreiberangaben sind noch nicht vollständig. Diese Seite darf so nicht veröffentlicht werden.</p>` : "";
const btAddress = () => `${bt("name")}<br>${bt("strasse")}<br>${bt("plzOrt")}<br>Deutschland`;

function impressum(el){
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Anbieterkennzeichnung</div>
    <h1 class="h2">Impressum</h1>
  </div>
  <div class="container prose" style="max-width:48rem">
    ${btDraft()}
    <h2 class="h3">Angaben gemäß § 5 DDG</h2>
    <p>${btAddress()}</p>
    <p>E-Mail: ${btMail()}</p>
    <h2 class="h3">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
    <p>${bt("name")}, Anschrift wie oben</p>
    <h2 class="h3">Hinweis</h2>
    <p>Pilz Handel ist ein privates, werbefreies Informationsprojekt. Alle Wirkungsaussagen sind nach Evidenzstufe gekennzeichnet und ersetzen keine ärztliche Beratung. Für die Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich.</p>
    <p><a href="#/datenschutz">Zur Datenschutzerklärung</a></p>
  </div>`;
  return "Impressum";
}

function datenschutz(el){
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Datenschutz</div>
    <h1 class="h2">Datenschutzerklärung</h1>
    <p class="lead">Kurz gesagt: Kein Konto, keine Cookies, kein Tracking. Was du in der App speicherst, bleibt auf deinem Gerät.</p>
  </div>
  <div class="container prose" style="max-width:48rem">
    ${btDraft()}
    <h2 class="h3">Verantwortlicher</h2>
    <p>${btAddress()}<br>E-Mail: ${btMail()}</p>

    <h2 class="h3">Daten, die nur auf deinem Gerät liegen</h2>
    <p>Merkliste, Vergleich, Check-Auswahl, Einnahme-Tagebuch, Arzt-Karte und Anzeige-Einstellungen speichert ausschließlich dein Browser (im sogenannten lokalen Speicher). Diese Daten werden nicht übertragen und erreichen den Betreiber nie. Du kannst sie jederzeit löschen, indem du die Websitedaten dieser Seite in deinem Browser entfernst.</p>

    <h2 class="h3">Hosting über GitHub Pages</h2>
    <p>Die App wird über GitHub Pages bereitgestellt (GitHub Inc., USA). Beim Aufruf verarbeitet GitHub technisch notwendige Daten, insbesondere deine IP-Adresse, und speichert sie in Server-Protokollen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; das berechtigte Interesse liegt in der sicheren und zuverlässigen Bereitstellung der App. Der Betreiber selbst hat keinen Zugriff auf diese Protokolle. Näheres: <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">Datenschutzerklärung von GitHub</a>.</p>

    <h2 class="h3">Fotos von Wikimedia Commons</h2>
    <p>Die Pilzfotos lädt dein Browser direkt von Servern der Wikimedia Foundation (USA). Dabei erhält die Wikimedia Foundation deine IP-Adresse. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; das berechtigte Interesse liegt darin, frei lizenzierte Fotos mit korrekter Urheberangabe zu zeigen, ohne sie selbst zu hosten. Es handelt sich um eine Übermittlung in ein Drittland außerhalb der EU. Näheres: <a href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy/de" target="_blank" rel="noopener">Datenschutzerklärung der Wikimedia Foundation</a>.</p>

    <h2 class="h3">Fehler melden</h2>
    <p>Wenn du über „Fehler melden“ einen inhaltlichen Fehler meldest, geschieht das freiwillig über GitHub Issues. Dafür brauchst du ein GitHub-Konto, und deine Meldung ist öffentlich sichtbar. Es gilt die Datenschutzerklärung von GitHub.</p>

    <h2 class="h3">Schriften</h2>
    <p>Die Schriften sind in der App selbst enthalten. Es werden keine Schriftdienste Dritter aufgerufen.</p>

    <h2 class="h3">Deine Rechte</h2>
    <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Widerspruch (Art. 15–18 und 21 DSGVO). Wende dich dafür an die oben genannte E-Mail-Adresse. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>

    <p class="muted">Stand: September 2026</p>
  </div>`;
  return "Datenschutz";
}

/* ---------- Rezepte ---------- */
const R = D.RECIPES || [];
function recipeCard(x){
  const ms = x.pilze.map(id => byId[id]);
  return `<article class="mcard rcard">
    <a class="media" href="#/rezepte/${x.id}" tabindex="-1" aria-hidden="true">${pimg(ms[0], 640, false)}</a>
    <div class="body">
      <h3><a href="#/rezepte/${x.id}">${esc(x.title)}</a></h3>
      <div class="latin">${ms.map(m => esc(m.name.split(" / ")[0])).join(", ")}</div>
      <div class="foot"><span class="chip">⏱ ${x.zeit} Min.</span><span class="chip">${esc(x.art)}</span></div>
    </div>
  </article>`;
}
function recipes(el, r){
  const x = R.find(y => y.id === r.arg);
  if(r.arg && !x) return notFound(el);
  if(!x){
    const pilz = r.params.get("pilz") || "";
    const withR = [...new Set(R.flatMap(y => y.pilze))].map(id => byId[id]);
    const list = R.filter(y => !pilz || y.pilze.includes(pilz));
    el.innerHTML = `
    <div class="container pagehead">
      <div class="eyebrow">Aus der Küche</div>
      <h1 class="h2">Rezepte mit Speisepilzen</h1>
      <p class="lead">Viele Heilpilze sind zuerst einmal gute Speisepilze. Frisch gekocht sind sie die einfachste und sicherste Art, sie in den Alltag zu holen. Das sind Küchenideen, keine Therapie.</p>
    </div>
    <div class="container">
      <div class="hscroll" style="margin-bottom:1.2rem" role="group" aria-label="Nach Pilz filtern">
        <a class="fchip" href="#/rezepte" aria-pressed="${!pilz}" style="text-decoration:none">Alle</a>
        ${withR.map(m => `<a class="fchip" href="#/rezepte?pilz=${m.id}" aria-pressed="${pilz === m.id}" style="text-decoration:none">${esc(m.name.split(" / ")[0])}</a>`).join("")}
      </div>
      <div class="grid">${list.map(recipeCard).join("")}</div>
      <p class="notice info" style="margin-top:1.5rem"><b>Grundregel:</b> Speisepilze immer gut durchgaren, eingeweichte Trockenpilze am selben Tag verarbeiten und Reste rasch kühlen. Frische Edelpilze gibt es bei Zuchtbetrieben, auf Wochenmärkten oder als Zuchtset. <a href="#/shops?cat=frisch">Bezugsquellen</a></p>
    </div>`;
    return "Rezepte";
  }
  const ms = x.pilze.map(id => byId[id]);
  el.innerHTML = `
  <div class="container pagehead recipe">
    <a class="chip" href="#/rezepte">← Alle Rezepte</a>
    <div class="eyebrow" style="margin-top:1rem">${esc(x.art)} · ${x.zeit} Minuten · ${x.portionen} Portionen</div>
    <h1 class="h2">${esc(x.title)}</h1>
    <div class="chips" style="margin-top:.6rem">${ms.map(m => `<a class="chip" href="#/pilz/${m.id}">🍄 ${esc(m.name)}</a>`).join("")}</div>
  </div>
  <div class="container recipe">
    <div class="rlayout">
      <div class="card"><h3>Zutaten</h3><ul class="ingr">${x.zutaten.map(z => `<li><label><input type="checkbox"> ${esc(z)}</label></li>`).join("")}</ul></div>
      <div>
        <h2 class="h2" style="font-size:1.35rem;margin-bottom:.8rem">Zubereitung</h2>
        <ol class="steps">${x.schritte.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        ${x.tipp ? `<p class="notice info" style="margin-top:1rem"><b>Tipp:</b> ${esc(x.tipp)}</p>` : ""}
        <p class="notice" style="margin-top:.8rem"><b>Sicherheit:</b> ${esc(x.safe)}</p>
        <div class="frow2" style="margin-top:1rem"><button class="btn sm soft" onclick="window.print()">${icon("print")} Drucken</button></div>
      </div>
    </div>
  </div>`;
  return x.title;
}

/* ---------- Arzt-Karte ---------- */
function arztkarte(el){
  const list = [...favs].map(id => byId[id]);
  const info = store.get("ph-arzt", {name:"", meds:"", dose:{}});
  const sel = [...flags];
  const today = new Date().toLocaleDateString("de-DE", {day:"2-digit", month:"2-digit", year:"numeric"});
  const ST = ["kein bekannter Konflikt","beachten","ärztlich abklären"];
  el.innerHTML = `
  <div class="container pagehead noprint">
    <div class="eyebrow">Arzt-Karte</div>
    <h1 class="h2">„Das nehme ich, bitte prüfen“</h1>
    <p class="lead">Eine Seite für Arztpraxis oder Apotheke: deine Pilze aus der Merkliste, was du einnimmst und die Punkte aus dem Wechselwirkungs-Check. Alles bleibt auf diesem Gerät.</p>
    <div class="frow2" style="margin-top:1rem">
      <button class="btn sm accent" onclick="window.print()">${icon("print")} Drucken oder als PDF sichern</button>
      <a class="btn sm soft" href="#/check">${icon("shield")} Check anpassen (${sel.length})</a>
      <a class="btn sm soft" href="#/pilze">${icon("heart")} Pilze hinzufügen</a>
    </div>
    <p class="notice noprint" style="margin-top:1rem">Name, Medikamente und Dosierung liegen nur in diesem Browser, nicht auf einem Server. Bei einem Gerätewechsel, geleertem Speicher oder einer Neuinstallation sind sie weg. Drucke die Karte oder sichere sie als PDF, bevor du sie brauchst.</p>
  </div>
  <div class="container">
    ${list.length ? "" : `<div class="notice noprint" style="margin-bottom:1rem"><b>Noch keine Pilze gemerkt.</b> Wähle hier aus, was du nimmst oder nehmen möchtest:</div>`}
    <div class="picker noprint" role="group" aria-label="Pilze für die Karte auswählen" style="margin-bottom:1.2rem">${M.slice().sort((a, b) => coll.compare(a.name, b.name)).map(m => `<button class="fchip" data-fav="${m.id}" aria-pressed="${favs.has(m.id)}">${esc(m.name)}</button>`).join("")}</div>
    <article class="akarte">
      <header>
        <div><div class="eyebrow">Pilz Handel · Arzt-Karte</div><h2>Heilpilze: bitte auf Verträglichkeit prüfen</h2></div>
        <div class="muted">Stand ${today}</div>
      </header>
      <div class="afields">
        <label>Name<input id="akName" value="${esc(info.name)}" placeholder="Vor- und Nachname"></label>
        <label>Meine Medikamente<textarea id="akMeds" rows="2" placeholder="z. B. Marcumar 3 mg, Metformin 1000 mg">${esc(info.meds)}</textarea></label>
      </div>
      ${sel.length ? `<p><b>Angaben aus dem Check:</b> ${sel.map(k => esc(D.FLAGS[k].label.replace(/­/g, ""))).join(" · ")}</p>` : `<p class="muted">Im Wechselwirkungs-Check ist nichts ausgewählt.</p>`}
      ${list.length ? `<table class="atable">
        <thead><tr><th>Pilz</th><th>Präparat und Dosis</th><th>Hinweise</th></tr></thead>
        <tbody>${list.map(m => {
          const hits = sel.filter(k => m.flags[k]).sort((a, b) => m.flags[b] - m.flags[a]);
          const lvl = hits.reduce((a, k) => Math.max(a, m.flags[k]), 0);
          return `<tr class="l${lvl}">
            <td><b>${esc(m.name)}</b><br><i>${esc(m.latin)}</i><br><small>Evidenz: ${esc(D.SCORE_LBL[m.score])}</small></td>
            <td><input data-dose="${m.id}" value="${esc(info.dose[m.id] || "")}" placeholder="Produkt, Menge, seit wann"></td>
            <td>${sel.length ? `<b class="ast">${ST[lvl]}</b>` : ""}${hits.length ? `<ul>${hits.map(k => `<li>${esc(D.FLAGS[k].label.replace(/­/g, ""))}: ${esc(FLAG_NOTE[k])}</li>`).join("")}</ul>` : ""}<ul class="asafe">${m.safety.slice(0, 2).map(s => `<li>${esc(s)}</li>`).join("")}</ul></td>
          </tr>`;
        }).join("")}</tbody>
      </table>` : ""}
      <div class="aq"><b>Fragen an Arzt oder Apotheke</b>
        <ul>
          <li>Verträgt sich das mit meinen Medikamenten?</li>
          <li>Sollten Werte kontrolliert werden, etwa Leber, Niere, Blutzucker oder Gerinnung (INR)?</li>
          <li>Muss ich vor einer Operation oder Untersuchung pausieren?</li>
          <li>Wie lange ist die Einnahme sinnvoll?</li>
        </ul>
      </div>
      <p class="fine">Heilpilze sind in Deutschland Lebensmittel bzw. Nahrungsergänzungsmittel. Die Hinweise fassen Fallberichte und theoretische Risiken aus der Literatur zusammen und sind kein vollständiger Interaktionscheck. Quelle: Pilz Handel, stephandel.github.io/heilpilze</p>
    </article>
  </div>`;
  const save = () => {
    info.name = $("#akName").value; info.meds = $("#akMeds").value;
    $$("[data-dose]", el).forEach(i => { if(i.value) info.dose[i.dataset.dose] = i.value; else delete info.dose[i.dataset.dose]; });
    store.set("ph-arzt", info);
  };
  $$("input:not([type=checkbox]),textarea", $(".akarte")).forEach(i => i.addEventListener("input", save));
  return "Arzt-Karte";
}

/* ---------- Einnahme-Tagebuch ---------- */
const MOOD = ["😣","🙁","😐","🙂","😄"];
const isoDay = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
function tagebuch(el){
  let log = store.get("ph-diary", []).filter(e => e && byId[e.m]);
  const last = log[0] || {};
  const opts = M.slice().sort((a, b) => (favs.has(b.id) - favs.has(a.id)) || coll.compare(a.name, b.name));
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Einnahme-Tagebuch</div>
    <h1 class="h2">Was nehme ich, und wie geht es mir?</h1>
    <p class="lead">Notiere Pilz, Menge und Befinden. Nach einigen Wochen siehst du, ob sich etwas verändert, und hast alles für das Arztgespräch beisammen. Die Einträge bleiben auf diesem Gerät.</p>
  </div>
  <div class="container">
    <form class="card diaryform" id="dForm">
      <div class="dgrid">
        <label>Datum<input type="date" id="dDate" required value="${isoDay(new Date())}" max="${isoDay(new Date())}"></label>
        <label>Pilz<select id="dPilz" class="select">${opts.map(m => `<option value="${m.id}" ${m.id === last.m ? "selected" : ""}>${favs.has(m.id) ? "♥ " : ""}${esc(m.name)}</option>`).join("")}</select></label>
        <label>Präparat<input id="dProd" placeholder="z. B. Extrakt Kapseln" value="${esc(last.p || "")}"></label>
        <label>Menge<input id="dAmt" placeholder="z. B. 2 × 500 mg" value="${esc(last.a || "")}"></label>
      </div>
      <fieldset class="mood"><legend>Befinden</legend>${MOOD.map((e, i) => `<label><input type="radio" name="mood" value="${i + 1}" ${i === 2 ? "checked" : ""}><span aria-label="${i + 1} von 5">${e}</span></label>`).join("")}</fieldset>
      <label>Notiz<input id="dNote" placeholder="Schlaf, Verdauung, Nebenwirkungen …"></label>
      <button class="btn accent" type="submit">${icon("check")} Eintragen</button>
    </form>
    <div id="dOut"></div>
    <section class="card" style="margin-top:1.5rem">
      <h3>Erinnerung im Kalender</h3>
      <p class="muted" style="font-size:.9rem">Erzeugt einen täglichen Termin für deinen Kalender (iPhone, Android, Outlook). Studien laufen meist 8 bis 16 Wochen; danach erinnert dich der Kalender an eine Pause und ein Gespräch mit Arzt oder Apotheke.</p>
      <div class="frow2">
        <label class="sr" for="rTime">Uhrzeit</label><input type="time" id="rTime" class="select" value="08:00">
        <label class="sr" for="rWeeks">Dauer</label><select id="rWeeks" class="select"><option value="4">4 Wochen</option><option value="8" selected>8 Wochen</option><option value="12">12 Wochen</option><option value="16">16 Wochen</option></select>
        <button class="btn sm" id="rIcs" type="button">📅 Termin herunterladen</button>
      </div>
    </section>
    <p class="notice">Diese Einträge liegen nur in diesem Browser, nicht auf einem Server. Bei einem Gerätewechsel, geleertem Speicher oder einer Neuinstallation sind sie weg. Lade regelmäßig eine Sicherung herunter, besonders vor dem Arztgespräch.</p>
    <section class="frow2" style="margin:1.5rem 0">
      <button class="btn sm soft" id="dCsv" type="button">Als Tabelle (CSV) exportieren</button>
      <button class="btn sm soft" id="dJson" type="button">Sicherung speichern</button>
      <button class="btn sm soft" id="dImpBtn" type="button">Sicherung laden</button>
      <input type="file" id="dImp" accept=".json,application/json" hidden>
    </section>
  </div>`;
  const save = () => { log.sort((a, b) => b.d.localeCompare(a.d) || b.t - a.t); store.set("ph-diary", log); out(); };
  const out = () => {
    if(!log.length){ $("#dOut").innerHTML = `<div class="empty"><div class="big" aria-hidden="true">📓</div><p>Noch keine Einträge.</p></div>`; return; }
    const since = isoDay(new Date(Date.now() - 29 * 864e5));
    const recent = log.filter(e => e.d >= since);
    const days = new Set(recent.map(e => e.d)).size;
    const per = {}; log.forEach(e => { per[e.m] = per[e.m] || {n:0, first:e.d, mood:[]}; per[e.m].n++; per[e.m].first = e.d < per[e.m].first ? e.d : per[e.m].first; per[e.m].mood.push(e.s); });
    const fmt = d => new Date(d + "T12:00").toLocaleDateString("de-DE", {weekday:"short", day:"numeric", month:"short"});
    const byDay = {}; log.forEach(e => (byDay[e.d] = byDay[e.d] || []).push(e));
    $("#dOut").innerHTML = `
      <div class="facts" style="margin-top:1.5rem">
        <div class="fact"><div class="k">Letzte 30 Tage</div><div class="v">${days} ${days === 1 ? "Tag" : "Tage"} mit Einnahme</div></div>
        ${Object.entries(per).map(([id, p]) => `<div class="fact"><div class="k">${esc(byId[id].name)}</div><div class="v" style="font-size:.9rem">${p.n} ${p.n === 1 ? "Eintrag" : "Einträge"} seit ${fmt(p.first)} · Ø ${MOOD[Math.round(p.mood.reduce((a, b) => a + b, 0) / p.mood.length) - 1]}</div></div>`).join("")}
      </div>
      <div class="dlog">${Object.entries(byDay).slice(0, 60).map(([d, es]) => `<div class="dday"><h4>${fmt(d)}</h4>${es.map(e => `<div class="dentry"><span class="dm" title="Befinden ${e.s} von 5">${MOOD[e.s - 1]}</span><div><b>${esc(byId[e.m].name)}</b>${e.p || e.a ? ` · ${esc([e.p, e.a].filter(Boolean).join(", "))}` : ""}${e.n ? `<br><small>${esc(e.n)}</small>` : ""}</div><button class="iconbtn" data-del="${e.t}" aria-label="Eintrag löschen">${icon("x")}</button></div>`).join("")}</div>`).join("")}</div>
      ${Object.keys(byDay).length > 60 ? `<p class="muted">Ältere Einträge sind im Export enthalten.</p>` : ""}`;
    $$("[data-del]", el).forEach(b => b.addEventListener("click", () => {
      const removed = log.find(e => String(e.t) === b.dataset.del);
      log = log.filter(e => String(e.t) !== b.dataset.del);
      save();
      toast("Eintrag gelöscht", { onUndo: () => { log.push(removed); save(); toast("Eintrag wiederhergestellt"); } });
    }));
  };
  $("#dForm").addEventListener("submit", e => {
    e.preventDefault();
    log.push({t: Date.now(), d: $("#dDate").value, m: $("#dPilz").value, p: $("#dProd").value.trim(), a: $("#dAmt").value.trim(), s: +($("input[name=mood]:checked", el) || {value:3}).value, n: $("#dNote").value.trim()});
    $("#dNote").value = ""; save(); toast("Eingetragen");
  });
  const download = (name, type, text) => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  const csvCell = v => /[";\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v;
  $("#dCsv").addEventListener("click", () => {
    if(!log.length) return toast("Noch keine Einträge");
    const rows = [["Datum","Pilz","Präparat","Menge","Befinden (1-5)","Notiz"], ...log.map(e => [e.d, byId[e.m].name, e.p, e.a, e.s, e.n])];
    download("pilz-tagebuch.csv", "text/csv;charset=utf-8", "﻿" + rows.map(r => r.map(v => csvCell(String(v ?? ""))).join(";")).join("\r\n"));
  });
  $("#dJson").addEventListener("click", () => download(`pilz-tagebuch-${isoDay(new Date())}.json`, "application/json", JSON.stringify({app:"pilzhandel", version:1, diary:log}, null, 1)));
  $("#dImpBtn").addEventListener("click", () => $("#dImp").click());
  $("#dImp").addEventListener("change", async e => {
    const f = e.target.files[0]; if(!f) return;
    try{
      const data = JSON.parse(await f.text());
      const add = parseDiaryImport(data, log, id => !!byId[id]);
      log = log.concat(add); save(); toast(add.length + " Einträge übernommen");
    }catch(err){ toast("Datei konnte nicht gelesen werden"); }
    e.target.value = "";
  });
  $("#rIcs").addEventListener("click", () => {
    const m = byId[$("#dPilz").value], [hh, mm] = ($("#rTime").value || "08:00").split(":"), weeks = +$("#rWeeks").value;
    const d0 = new Date(); d0.setHours(+hh, +mm, 0, 0); if(d0 < new Date()) d0.setDate(d0.getDate() + 1);
    const dEnd = new Date(d0.getTime() + weeks * 7 * 864e5);
    const f = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
    const f15 = d => f(new Date(d.getTime() + 15 * 60000));
    const txt = s => s.replace(/[\\;,]/g, c => "\\" + c).replace(/\n/g, "\\n");
    const amt = $("#dAmt").value.trim(), url = location.href.split("#")[0] + "#/tagebuch";
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Pilz Handel//Tagebuch//DE","CALSCALE:GREGORIAN",
      "BEGIN:VEVENT", `UID:ph-${Date.now()}-a@pilzhandel`, `DTSTAMP:${stamp}`, `DTSTART:${f(d0)}`, `DTEND:${f15(d0)}`, `RRULE:FREQ=DAILY;COUNT=${weeks * 7}`,
      `SUMMARY:${txt(m.name + (amt ? " · " + amt : ""))}`, `DESCRIPTION:${txt("Einnahme im Pilz-Tagebuch notieren: " + url)}`,
      "BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${txt(m.name)}`,"TRIGGER:PT0M","END:VALARM","END:VEVENT",
      "BEGIN:VEVENT", `UID:ph-${Date.now()}-b@pilzhandel`, `DTSTAMP:${stamp}`, `DTSTART:${f(dEnd)}`, `DTEND:${f15(dEnd)}`,
      `SUMMARY:${txt(m.name + ": Pause und Bilanz")}`, `DESCRIPTION:${txt(weeks + " Wochen sind um. Tagebuch ansehen, Pause einlegen und mit Arzt oder Apotheke besprechen: " + url)}`,
      "END:VEVENT","END:VCALENDAR"].join("\r\n");
    download(`erinnerung-${m.id}.ics`, "text/calendar;charset=utf-8", ics);
  });
  out();
  return "Tagebuch";
}

/* ---------- Studien-Radar ---------- */
const RD = window.PH_RADAR;
const pubmedUrl = (m, years=2) => "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent("(" + m.pubmed.split(/\s+OR\s+/).map(t => t + "[tiab]").join(" OR ") + ")") + `&filter=pubt.meta-analysis&filter=pubt.randomizedcontrolledtrial&filter=pubt.systematicreview&filter=datesearch.y_${years}&sort=date`;
const studyRow = s => `<li><a href="https://pubmed.ncbi.nlm.nih.gov/${esc(s.pmid)}/" target="_blank" rel="noopener">${esc(s.title)}</a><br><small class="muted">${esc(s.journal)} · ${esc(s.date)}${s.type ? ` · <b>${esc(s.type)}</b>` : ""}</small></li>`;
function radar(el){
  const stand = RD ? new Date(RD.stand + "T12:00").toLocaleDateString("de-DE", {day:"numeric", month:"long", year:"numeric"}) : "";
  const list = RD ? M.map(m => ({m, r: RD.items[m.id] || {count:0, list:[]}})).sort((a, b) => b.r.count - a.r.count || coll.compare(a.m.name, b.m.name)) : [];
  el.innerHTML = `
  <div class="container pagehead">
    <div class="eyebrow">Studien-Radar</div>
    <h1 class="h2">Neu in der Forschung</h1>
    <p class="lead">Neue Studien am Menschen und Übersichtsarbeiten aus PubMed, automatisch gesammelt${RD ? ` am ${stand} für die letzten ${RD.tage} Tage` : ""}. Die Treffer sind <b>noch nicht eingestuft</b>: Erst wenn eine Studie gelesen und bewertet ist, fließt sie in die Evidenzstufen ein.</p>
  </div>
  <div class="container">
    ${RD ? list.map(({m, r}) => `<details class="acc"><summary><span>${esc(m.name)}</span> <span class="chip" style="margin-left:auto">${r.count} Treffer</span></summary><div class="body">
        ${r.list.length ? `<ul class="studies">${r.list.map(studyRow).join("")}</ul>` : `<p class="muted">Keine neuen Treffer im Zeitraum.</p>`}
        <p style="margin-top:.6rem"><a href="${pubmedUrl(m)}" target="_blank" rel="noopener">Live in PubMed suchen ↗</a> · <a href="#/pilz/${m.id}">Zum Pilz</a></p>
      </div></details>`).join("") : `<div class="empty"><p>Der Radar wurde noch nicht erstellt.</p></div>`}
    <p class="notice info" style="margin-top:1.5rem"><b>So funktioniert es:</b> Gesucht wird nach dem Artnamen in Titel und Zusammenfassung, kombiniert mit Studientypen wie randomisierte Studie, Meta-Analyse oder Übersichtsarbeit; reine Tier- und Zellstudien im Titel werden ausgeschlossen. Nicht jeder Treffer handelt vorrangig vom Pilz. Aktualisiert wird mit <code>node pilzhandel/tools/studien-radar.js</code>.</p>
  </div>`;
  return "Studien-Radar";
}

function notFound(el){
  el.innerHTML = `<div class="container empty" style="padding:5rem 1rem"><div class="big" aria-hidden="true">🍄‍🟫</div><h1 class="h2">Diese Seite gibt es nicht</h1><p><a class="btn soft sm" href="#/">Zur Startseite</a></p></div>`;
  return "Nicht gefunden";
}

/* ---------- PWA ---------- */
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; $("#installBtn").hidden = false; });
$("#installBtn").addEventListener("click", async () => { if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt = null; $("#installBtn").hidden = true; });
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).then(() => { $("#offlineState").textContent = "bereit"; }).catch(() => { $("#offlineState").textContent = "nicht verfügbar"; });
} else { $("#offlineState").textContent = "nur über https"; }

/* ---------- Start ---------- */
setFs(curFs());
setTheme(curTheme());
syncBadges();
render();
})();
