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
let toastT;
function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Bilder ---------- */
const COMMONS = "https://commons.wikimedia.org/wiki/";
const fileUrl = (name, w) => `${COMMONS}Special:FilePath/${encodeURIComponent(name.replace(/ /g, "_"))}?width=${w}`;
const filePage = name => `${COMMONS}File:${encodeURIComponent(name.replace(/ /g, "_"))}`;
const HERO = ["A_little_mushroom_scene_in_the_woods_(30559452831).jpg", "Pilze-im-Moos.jpg", "Mushroom_Forest.jpg"];

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
  if(e.key === "Escape"){ pop.classList.remove("show"); }
});

/* ---------- Merkliste & Vergleich (delegiert) ---------- */
document.addEventListener("click", e => {
  const f = e.target.closest("[data-fav]");
  if(f){
    e.preventDefault(); const id = f.dataset.fav, m = byId[id];
    if(favs.has(id)){ favs.delete(id); toast(m.name + " von der Merkliste entfernt"); } else { favs.add(id); toast(m.name + " gemerkt"); }
    saveFavs();
    $$(`[data-fav="${id}"]`).forEach(b => { const on = favs.has(id); b.setAttribute("aria-pressed", on); b.querySelector("use").setAttribute("href", on ? "#i-heart-f" : "#i-heart"); });
    if(route().path === "merkliste") render();
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
$("#trayClear").addEventListener("click", () => { cmp = []; saveCmp(); $$("[data-cmp]").forEach(b => b.setAttribute("aria-pressed", "false")); });

/* ---------- Router ---------- */
function route(){
  const h = location.hash.replace(/^#\/?/, "");
  const [p, qs] = h.split("?");
  const parts = p.split("/").filter(Boolean);
  return { path: parts[0] || "", arg: parts[1] ? decodeURIComponent(parts[1]) : "", params: new URLSearchParams(qs || "") };
}
const VIEWS = { "":home, pilze:catalog, pilz:detail, vergleich:compare, check, merkliste:favorites, shops, wissen, ueber:about };
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
    <a class="credit" href="${filePage(HERO[0])}" target="_blank" rel="noopener">Foto: Wikimedia Commons</a>
  </section>

  <section class="section container">
    <div class="sechead"><div><div class="eyebrow">Finder</div><h2 class="h2">Wofür suchst du etwas?</h2><p>Wähle ein Anliegen, wir zeigen die Pilze mit der besten Studienlage zuerst.</p></div></div>
    <div class="tiles">${D.TAGS.map(t => `<a class="tile" href="#/pilze?tag=${encodeURIComponent(t)}"><span class="ic" aria-hidden="true">${D.TAG_ICONS[t] || "🍄"}</span><b>${esc(t)}</b><small>${counts[t]} Pilze</small></a>`).join("")}</div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="sechead"><div><div class="eyebrow">Am besten belegt</div><h2 class="h2">Wo die Forschung am weitesten ist</h2></div><a class="link-more" href="#/pilze?sort=score">Alle ansehen</a></div>
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
    <div class="sechead"><div><div class="eyebrow">Aus Wald und Küche</div><h2 class="h2">Frisch kaufen statt Kapseln</h2><p>Diese Heilpilze gibt es als Speisepilz. Zwei bis drei Portionen pro Woche sind das, was Beobachtungsstudien überhaupt stützen.</p></div><a class="link-more" href="#/shops">Wo kaufen</a></div>
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
    <p class="lead">Filtere nach Anliegen, Evidenzstufe und Bezugsart. Die Stufen-Filter blenden einzelne Wirkungsaussagen aus.</p>
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
        <section class="dsec">
          <h2>Quellen</h2>
          <ol class="srcs">${m.sources.map(s => `<li><a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a></li>`).join("")}</ol>
          <p class="muted" style="font-size:.8rem;margin-top:.8rem">Foto: ${(m.imgs || []).map((n, i) => `<a href="${filePage(n)}" target="_blank" rel="noopener">Wikimedia Commons${m.imgs.length > 1 ? " " + (i + 1) : ""}</a>`).join(", ")} · Urheber und Lizenz auf der Dateiseite. Lädt das Foto nicht, siehst du eine Illustration.</p>
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
      const hits = sel.filter(k => m.flags[k]).map(k => ({k, v: m.flags[k]}));
      return {m, hits, lvl: hits.reduce((a, h) => Math.max(a, h.v), 0)};
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
  $("#ckReset").addEventListener("click", () => { flags.clear(); store.set("ph-flags", []); $$(".ck input", el).forEach(i => i.checked = false); out(); });
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
      <div><h4>Datenschutz</h4><p>Merkliste, Vergleich, Check-Auswahl und Anzeige-Einstellungen bleiben lokal in deinem Browser. Es gibt kein Konto und kein Tracking. Fotos werden von Wikimedia Commons, Schriften von Google Fonts geladen.</p></div>
      <div><h4>Stand</h4><p>Recherche September 2026. Diese App ersetzt keine ärztliche Beratung.</p></div>
    </div>
  </div>`;
  return "Über";
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
