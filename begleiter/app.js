/* Pilz-Begleiter · Oberfläche. Daten nur in localStorage ("pb-v1"); Logik in logik.js. */
(() => {
const L = window.BegleiterLogik, PH = window.PH;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const PILZE = PH.MUSHROOMS;
const pilz = id => PILZE.find(p => p.id === id);
const SPEICHER = "pb-v1";
const BEFINDEN = [["😣","schlecht"],["😕","mäßig"],["😐","okay"],["🙂","gut"],["😄","sehr gut"]];
const VERTR = [["keine","keine Beschwerden"],["etwas","etwas"],["beschwerden","Beschwerden"]];
const pilzSvg = '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12a9 7 0 0 1 18 0z"/><path d="M10 12v6a2 2 0 0 0 4 0v-6"/></svg>';

// Zum Prüfen: ?heute=2026-11-20 setzt das Datum, ?theme=dark die Ansicht
const q = new URLSearchParams(location.search);
if(q.get("theme")) document.documentElement.dataset.theme = q.get("theme");
const jetzt = () => { if(q.get("heute")){ const [j,m,t] = q.get("heute").split("-").map(Number); const d = new Date(); return new Date(j, m-1, t, d.getHours(), d.getMinutes()); } return new Date(); };
const heute = () => L.datumText(jetzt());
const datumLang = (t, opt = {weekday:"long", day:"numeric", month:"long"}) => { const [j,m,d] = t.split("-").map(Number); return new Date(j, m-1, d).toLocaleDateString("de-DE", opt); };

// Gespeicherte Daten gehen durch dieselbe Prüfung wie eine Sicherung: Kaputtes oder Unbekanntes (z. B. eine Pilz-ID, die es nicht mehr gibt) wird verworfen statt die App zu blockieren
function laden(){
  try {
    const roh = JSON.parse(localStorage.getItem(SPEICHER)), d = L.sicherungPruefen(roh, PILZE.map(p => p.id));
    if(roh && roh.plan && !(d && d.plan)) setTimeout(() => toast("Dein gespeicherter Plan passte nicht mehr zu den Pilzdaten und wurde entfernt. Tagebuch und Haken bleiben."), 400);
    if(d) return d;
  } catch(e){}
  return {plan: null, einnahmen: {}, eintraege: {}};
}
let S = laden();
function speichern(){ try { localStorage.setItem(SPEICHER, JSON.stringify(S)); } catch(e){ toast("Konnte nicht speichern. Ist privates Surfen an?"); } }

let toastZeit;
function toast(text, rueckgaengig){
  const t = $("#toast");
  t.innerHTML = `<span>${esc(text)}</span>` + (rueckgaengig ? '<button type="button">Rückgängig</button>' : "");
  t.hidden = false;
  if(rueckgaengig) t.querySelector("button").onclick = () => { rueckgaengig(); t.hidden = true; };
  clearTimeout(toastZeit); toastZeit = setTimeout(() => t.hidden = true, rueckgaengig ? 7000 : 3500);
}
// Datei weitergeben. Auf Touch-Geräten über das Teilen-Blatt (Web Share mit Datei, Bibliothek M105): in der
// iOS-Home-Bildschirm-App tut ein Download-Link sonst nichts (Apple-Forum 95911, WebKit-Bug 275288). Sonst Download.
function datei(name, typ, inhalt){
  const f = new File([inhalt], name, {type: typ});
  if(matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({files: [f]})){
    navigator.share({files: [f], title: name}).catch(e => { if(e.name !== "AbortError") herunterladen(name, typ, inhalt); });
    return;
  }
  herunterladen(name, typ, inhalt);
}
function herunterladen(name, typ, inhalt){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([inhalt], {type: typ})); a.download = name;
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const aktiv = () => S.plan && !L.planStand(S.plan, heute()).fertig;

/* ---------- Atlas ---------- */
function planband(){
  if(!S.plan){ $("#planband").innerHTML = ""; return; }
  const st = L.planStand(S.plan, heute()), p = pilz(S.plan.pilz);
  const zeile = st.fertig ? "Plan abgeschlossen · Rückblick ansehen"
    : `${S.plan.uhr} Uhr · Woche ${st.woche} von ${st.wochen} · ${S.einnahmen[heute()] ? "heute genommen" : (S.plan.pause ? "Pause" : "heute noch offen")}`;
  $("#planband").innerHTML = `<a class="planband" href="#${st.fertig ? "rueckblick" : "plan"}"><span class="kreis" aria-hidden="true">${esc(p.name[0])}</span><span><b>Mein Pilz-Plan: ${esc(p.name)}</b><br><span class="klein">${zeile}</span></span></a>`;
}
function raster(f = ""){
  const t = f.trim().toLowerCase();
  const liste = PILZE.filter(p => (p.name + " " + p.latin + " " + p.alt).toLowerCase().includes(t));
  $("#raster").innerHTML = liste.map(p => `<a class="pilz" href="#pilz/${p.id}"><span class="bild">${pilzSvg}</span><b>${esc(p.name)}</b><i>${esc(p.latin.split(" / ")[0])}</i><span class="stufe">Studien: ${p.score}/4</span></a>`).join("")
    || '<p class="klein">Kein Pilz gefunden. Versuch den deutschen oder lateinischen Namen.</p>';
}
$("#suche").addEventListener("input", e => raster(e.target.value));

function steckbrief(id){
  const p = pilz(id);
  if(!p){ location.hash = "#atlas"; return; }
  const v = $("#v-pilz"); v.dataset.titel = p.name;
  const liste = a => `<ul>${(Array.isArray(a) ? a : [a]).map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  v.innerHTML = `<div class="eyebrow">Steckbrief</div>
    <h2>${esc(p.name)}</h2>
    <p class="lead"><i>${esc(p.latin)}</i></p>
    <div class="karte"><dl class="steck">
      <dt>Formen</dt><dd>${esc(p.forms.join(", "))}</dd>
      <dt>Rechtlich</dt><dd>Lebensmittel bzw. Nahrungsergänzung</dd>
      <dt>Studienlage</dt><dd><span class="stufe">${p.score}/4</span> ${esc(PH.SCORE_LBL[p.score])}</dd>
    </dl></div>
    <h3>Was untersucht wurde</h3>
    <p>${esc(p.summary)}</p>
    <details class="mehr"><summary>Sicherheit und Wechselwirkungen</summary>${liste(p.safety)}</details>
    <details class="mehr"><summary>Mengen in Studien und im Handel</summary><p>${esc(p.dose)}</p><p class="klein">Maßgeblich ist die Angabe auf deiner Packung.</p></details>
    <a class="knopf zwei" href="../pilzhandel/#/pilz/${p.id}">Alle Aussagen mit Evidenzstufe und Quellen</a>
    <p class="hinweis">Allgemeine Information, kein medizinischer Rat. Wenn du Medikamente nimmst, schwanger bist oder stillst: vorher ärztlich abklären.</p>
    <div class="karte" style="background:var(--moos-hg);border:0">
      <h3>${esc(p.name)} selbst ausprobieren?</h3>
      <p>Der Begleiter erinnert dich an deinen selbst gewählten Plan und hält fest, wie es dir geht. Er sagt nicht, ob ${esc(p.name)} für dich passt.</p>
      <button class="knopf" type="button" id="planMit">${aktiv() ? "Zu meinem Plan" : `Plan mit ${esc(p.name)} anlegen`}</button>
    </div>`;
  // S.neu: auch nach einem abgeschlossenen Plan direkt in den Assistenten, nicht auf die Seite „Plan abgeschlossen“
  $("#planMit").onclick = () => { if(!aktiv()){ entwurf = {pilz: p.id, uhr: "20:00", wochen: 8, erinnern: true, befinden: true}; schritt = 1; S.neu = true; } location.hash = "#plan"; };
}

/* ---------- Plan ---------- */
let schritt = 1, entwurf = {pilz: "reishi", uhr: "20:00", wochen: 8, erinnern: true, befinden: true};
const installiert = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function plan(){
  const v = $("#v-plan");
  if(!aktiv()) return S.plan && L.planStand(S.plan, heute()).fertig && !S.neu ? planFertig(v) : planAnlegen(v);
  const st = L.planStand(S.plan, heute()), p = pilz(S.plan.pilz), gen = !!S.einnahmen[heute()];
  const naechste = L.naechsteErinnerung(S.plan, jetzt(), gen);
  v.innerHTML = `<div class="eyebrow">Woche ${st.woche} von ${st.wochen}${S.plan.pause ? " · Pause" : ""}</div>
    <h2>${esc(p.name)}, um ${S.plan.uhr} Uhr</h2>
    <p class="lead">${st.vorStart ? `Startet am ${datumLang(S.plan.start)}.` : `Seit ${datumLang(S.plan.start, {day:"numeric", month:"long"})}, ${st.restTage === 0 ? "heute ist der letzte Tag" : st.restTage === 1 ? "noch 1 Tag" : `noch ${st.restTage} Tage`}.`}</p>
    <div class="karte heute">
      <button class="haken" type="button" aria-pressed="${gen}" id="haken" aria-label="Heute genommen">✓</button>
      <div><b>Heute genommen?</b><br><span class="klein" id="hakenText">${gen ? "Erledigt. Bis morgen!" : "Ein Tipp genügt. Vergessen ist kein Problem."}</span></div>
    </div>
    ${S.plan.befinden ? `<a class="knopf zwei" href="#tagebuch">${S.eintraege[heute()] ? "Tagebuch-Eintrag von heute ansehen" : "Wie geht es dir heute?"}</a>` : ""}
    <div class="karte">
      <div class="zeile"><label for="uhr">Uhrzeit</label><input type="time" id="uhr" value="${S.plan.uhr}"></div>
      <div class="zeile"><label for="erinn">Erinnerung</label><input class="schalter" type="checkbox" id="erinn" role="switch" ${S.plan.erinnern ? "checked" : ""}></div>
      <div class="zeile"><label for="frage">Befinden abfragen</label><input class="schalter" type="checkbox" id="frage" role="switch" ${S.plan.befinden ? "checked" : ""}></div>
    </div>
    ${S.plan.erinnern ? `<div class="karte"><h3>Erinnerung</h3>
      <p class="klein">${naechste ? `Nächste: ${naechste.toLocaleDateString("de-DE", {weekday:"long"})}, ${S.plan.uhr} Uhr.` : (S.plan.pause ? "Pause – der Begleiter plant gerade keine Erinnerung." : "Keine weitere Erinnerung in diesem Plan.")}</p>
      <p>Der Begleiter kann keine Mitteilungen schicken. Speichere die Erinnerung in deinem Kalender – sie kommt dann jeden Tag zur gewählten Uhrzeit, bis der Plan endet.</p>
      <p class="klein">Am iPhone: Datei über das Teilen-Blatt in „Dateien“ sichern, dort antippen und in den Kalender übernehmen. Eine gespeicherte Kalender-Serie läuft bei Pause, Uhrzeitwechsel oder Planende weiter – lösche sie dann im Kalender.</p>
      <button class="knopf zwei" type="button" id="ics">Kalender-Erinnerung speichern</button></div>` : ""}
    ${installiert() ? "" : `<p class="hinweis">Tipp: Leg den Begleiter auf den Home-Bildschirm (Safari: Teilen, dann „Zum Home-Bildschirm“). Dann öffnet er sich wie eine App und funktioniert auch ohne Internet.</p>`}
    <p class="hinweis">Allgemeine Information, kein medizinischer Rat. Bei Beschwerden: Einnahme beenden und ärztlich abklären.</p>
    <div class="knoepfe">
      <button class="knopf zwei" type="button" id="pause">${S.plan.pause ? "Pause beenden" : "Pause machen"}</button>
      <button class="knopf zwei" type="button" id="beenden">Plan beenden</button>
    </div>`;
  $("#haken").onclick = () => {
    const an = !S.einnahmen[heute()];
    if(an) S.einnahmen[heute()] = true; else delete S.einnahmen[heute()];
    speichern(); plan();
    if(an && S.plan.befinden && !S.eintraege[heute()]) toast("Abgehakt. Magst du kurz ins Tagebuch?");
  };
  $("#uhr").onchange = e => { if(L.gueltigeUhr(e.target.value)){ S.plan.uhr = e.target.value; speichern(); plan(); toast("Uhrzeit geändert. Alte Serie im Kalender löschen, Erinnerung neu speichern."); } };
  $("#erinn").onchange = e => { S.plan.erinnern = e.target.checked; speichern(); plan(); };
  $("#frage").onchange = e => { S.plan.befinden = e.target.checked; speichern(); plan(); };
  if($("#ics")) $("#ics").onclick = () => datei(`erinnerung-${p.id}.ics`, "text/calendar;charset=utf-8", L.icsErinnerung(S.plan, p.name));
  $("#pause").onclick = () => { S.plan.pause = !S.plan.pause; speichern(); plan(); toast(S.plan.pause ? "Pause. Tagebuch bleibt; eine Kalender-Serie läuft weiter." : "Weiter geht's."); };
  $("#beenden").onclick = () => {
    const vorher = S.plan.beendet; S.plan.beendet = heute(); speichern(); render();
    toast("Plan beendet. Kalender-Serie bei Bedarf im Kalender löschen.", () => { S.plan.beendet = vorher; speichern(); render(); });
  };
}

function planFertig(v){
  const p = pilz(S.plan.pilz);
  v.innerHTML = `<div class="eyebrow">Plan abgeschlossen</div><h2>${esc(p.name)} – fertig</h2>
    <p class="lead">Deine Einträge bleiben erhalten. Im Rückblick siehst du, wie es dir in der Zeit ging.</p>
    <div class="knoepfe"><a class="knopf" href="#rueckblick">Rückblick ansehen</a>
    <button class="knopf zwei" type="button" id="neu">Neuen Plan anlegen</button></div>`;
  $("#neu").onclick = () => { S.neu = true; schritt = 1; plan(); };
}

function planAnlegen(v){
  const z = entwurf;
  const zeiten = [["Morgens","08:00"],["Mittags","12:30"],["Abends","20:00"]];
  const inhalt = {
    1: `<h2>Welchen Pilz möchtest du ausprobieren?</h2>
      <p class="lead">Wähle einen. Mehrere gleichzeitig machen es schwer, im Tagebuch etwas zu erkennen.</p>
      <div role="group" aria-label="Pilz">${PILZE.map(p => `<button class="wahl" type="button" data-p="${p.id}" aria-pressed="${p.id === z.pilz}"><span class="punkt" aria-hidden="true"></span><span><b>${esc(p.name)}</b><span class="klein">${esc(p.latin.split(" / ")[0])} · Studien ${p.score}/4</span></span></button>`).join("")}</div>`,
    2: `<h2>Wann nimmst du ihn?</h2>
      <p class="lead">Eine feste Zeit hilft beim Dranbleiben. Wie viel, steht auf deiner Packung.</p>
      <div class="reihe" role="group" aria-label="Tageszeit">${zeiten.map(([n, u]) => `<button class="chip" type="button" data-zeit="${u}" aria-pressed="${z.uhr === u}">${n}</button>`).join("")}</div>
      <div class="karte"><div class="zeile"><label for="uhr">Uhrzeit</label><input type="time" id="uhr" value="${z.uhr}"></div>
        <div class="zeile"><label for="dauer">Ausprobieren für</label><select id="dauer"><option value="4" ${z.wochen === 4 ? "selected" : ""}>4 Wochen</option><option value="8" ${z.wochen === 8 ? "selected" : ""}>8 Wochen</option></select></div></div>`,
    3: `<h2>Soll der Begleiter dich erinnern?</h2>
      <div class="karte">
        <div class="zeile"><label for="erinn">Erinnerung um ${z.uhr} Uhr</label><input class="schalter" type="checkbox" id="erinn" role="switch" ${z.erinnern ? "checked" : ""}></div>
        <div class="zeile"><label for="frage">Danach kurz fragen, wie es dir geht</label><input class="schalter" type="checkbox" id="frage" role="switch" ${z.befinden ? "checked" : ""}></div>
      </div>
      <p class="hinweis">Die Erinnerung kommt über deinen Kalender: Nach dem Speichern bekommst du eine Kalender-Datei (.ics) für deine Kalender-App. Der Begleiter selbst kann keine Mitteilungen schicken.</p>
      <p class="hinweis">Allgemeine Information, kein medizinischer Rat. Bei Beschwerden: Einnahme beenden und ärztlich abklären.</p>`
  };
  v.innerHTML = `<div class="eyebrow">Schritt ${schritt} von 3</div>
    <div class="schritte" aria-hidden="true">${[1,2,3].map(n => `<i class="${n <= schritt ? "an" : ""}"></i>`).join("")}</div>
    ${inhalt[schritt]}
    <div style="display:flex;gap:8px;margin-top:16px">
      ${schritt > 1 ? '<button class="knopf zwei" type="button" id="zurueckS" style="flex:1">Zurück</button>' : ""}
      <button class="knopf" type="button" id="weiter" style="flex:2">${schritt === 3 ? "Plan speichern" : "Weiter"}</button>
    </div>`;
  v.querySelectorAll(".wahl").forEach(b => b.onclick = () => { z.pilz = b.dataset.p; v.querySelectorAll(".wahl").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  v.querySelectorAll("[data-zeit]").forEach(b => b.onclick = () => { z.uhr = b.dataset.zeit; $("#uhr").value = z.uhr; v.querySelectorAll("[data-zeit]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  if($("#uhr")) $("#uhr").onchange = e => { if(L.gueltigeUhr(e.target.value)) z.uhr = e.target.value; v.querySelectorAll("[data-zeit]").forEach(x => x.setAttribute("aria-pressed", x.dataset.zeit === z.uhr)); };
  if($("#dauer")) $("#dauer").onchange = e => z.wochen = +e.target.value;
  if($("#erinn")) $("#erinn").onchange = e => z.erinnern = e.target.checked;
  if($("#frage")) $("#frage").onchange = e => z.befinden = e.target.checked;
  if($("#zurueckS")) $("#zurueckS").onclick = () => { schritt--; plan(); fokus(); };
  $("#weiter").onclick = () => {
    if(schritt < 3){ schritt++; plan(); fokus(); return; }
    S.plan = L.planAnlegen({...z, start: heute()}); delete S.neu; speichern(); render();
    toast(`Dein Plan steht: ${pilz(z.pilz).name} um ${z.uhr} Uhr.`);
    if(z.erinnern) $("#ics")?.focus();
  };
}

/* ---------- Tagebuch ---------- */
function tagebuch(){
  const v = $("#v-tagebuch"), t = heute(), e = S.eintraege[t] || {befinden: 0, vertraeglich: null, notiz: ""};
  const wahl = {...e};
  const tage = Object.keys(S.eintraege).sort().reverse().slice(0, 14);
  v.innerHTML = `<div class="eyebrow">Heute, ${datumLang(t)}</div>
    <h2>Wie geht es dir?</h2>
    <p class="lead">Ein Tipp reicht. Alles andere ist freiwillig.</p>
    <div class="stufen" role="group" aria-label="Befinden heute">${BEFINDEN.map(([g, w], i) => `<button type="button" data-b="${i+1}" aria-pressed="${e.befinden === i+1}"><span aria-hidden="true">${g}</span>${w}</button>`).join("")}</div>
    <span class="feld" id="vtTitel">Verträglichkeit (freiwillig)</span>
    <div class="drei" role="group" aria-labelledby="vtTitel">${VERTR.map(([k, w]) => `<button type="button" data-v="${k}" aria-pressed="${e.vertraeglich === k}">${w}</button>`).join("")}</div>
    <p class="hinweis" id="beschwerden" ${e.vertraeglich === "beschwerden" ? "" : "hidden"}><b>Bei Beschwerden:</b> Einnahme beenden und ärztlich abklären. Das Tagebuch ersetzt keinen medizinischen Rat.</p>
    <label for="notiz" class="feld">Notiz (freiwillig)</label>
    <textarea id="notiz" maxlength="500" placeholder="z. B. Tee schmeckt bitter, lieber Pulver im Joghurt">${esc(e.notiz)}</textarea>
    <button class="knopf" type="button" id="speichern" style="margin-top:12px">Speichern</button>
    <h3 style="margin-top:20px">Letzte Tage</h3>
    ${tage.length ? `<div class="karte" style="padding:4px 16px">${tage.map(d => { const x = S.eintraege[d]; return `<div class="eintrag"><div class="tag">${datumLang(d, {weekday:"short", day:"numeric", month:"numeric"})}</div><div>${BEFINDEN[x.befinden-1][0]} ${BEFINDEN[x.befinden-1][1]}${S.plan ? (S.einnahmen[d] ? " · genommen" : " · nicht abgehakt") : ""}${x.vertraeglich && x.vertraeglich !== "keine" ? ` · Verträglichkeit: ${VERTR.find(y => y[0] === x.vertraeglich)[1]}` : ""}${x.notiz ? `<br><span class="klein">„${esc(x.notiz)}“</span>` : ""}</div></div>`; }).join("")}</div>`
      : '<p class="klein">Noch keine Einträge. Dein erster Eintrag erscheint hier.</p>'}
    <p class="hinweis">Allgemeine Information, kein medizinischer Rat. Das Tagebuch hilft dir beim Beobachten, es bewertet nichts.</p>
    <p class="hinweis">Deine Einträge bleiben nur auf diesem Gerät. Der Browser kann sie löschen, zum Beispiel beim Aufräumen von Website-Daten. Speichere ab und zu eine Sicherung.</p>
    <div class="knoepfe"><button class="knopf zwei" type="button" id="sichern">Sicherung speichern</button>
      <button class="knopf zwei" type="button" id="ladenK">Sicherung laden</button>
      <input type="file" id="ladenD" accept="application/json,.json" hidden aria-label="Sicherungsdatei wählen"></div>`;
  v.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { wahl.befinden = +b.dataset.b; v.querySelectorAll("[data-b]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  v.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
    wahl.vertraeglich = wahl.vertraeglich === b.dataset.v ? null : b.dataset.v;
    v.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === wahl.vertraeglich));
    $("#beschwerden").hidden = wahl.vertraeglich !== "beschwerden";
  });
  $("#speichern").onclick = () => {
    if(!wahl.befinden){ toast("Tipp erst auf ein Gesicht, wie es dir heute geht."); return; }
    S.eintraege[t] = {befinden: wahl.befinden, vertraeglich: wahl.vertraeglich, notiz: $("#notiz").value.trim().slice(0, 500)};
    speichern(); tagebuch(); toast("Gespeichert. Bis morgen!");
  };
  $("#sichern").onclick = () => datei(`pilz-begleiter-${t}.json`, "application/json", JSON.stringify({app: "pilz-begleiter", stand: t, plan: S.plan, einnahmen: S.einnahmen, eintraege: S.eintraege}, null, 1));
  $("#ladenK").onclick = () => $("#ladenD").click();
  $("#ladenD").onchange = async e => {
    const f = e.target.files[0]; if(!f) return;
    let d = null; try { d = L.sicherungPruefen(JSON.parse(await f.text()), PILZE.map(p => p.id)); } catch(err){}
    if(!d){ toast("Datei konnte nicht gelesen werden. Wähle eine Sicherung, die der Begleiter gespeichert hat."); return; }
    const vorher = S; S = d; speichern(); render();
    toast("Sicherung geladen.", () => { S = vorher; speichern(); render(); });
  };
}

/* ---------- Rückblick ---------- */
let rbWochen = 4;
function rueckblickZeigen(){
  const v = $("#v-rueckblick");
  if(!S.plan){ v.innerHTML = `<div class="eyebrow">Rückblick</div><h2>Noch nichts zu sehen</h2><p class="lead">Sobald du einen Plan hast und Tagebuch führst, zeigt dir der Rückblick nach 4 und nach 8 Wochen deinen Verlauf.</p><a class="knopf" href="#plan">Plan anlegen</a>`; return; }
  const p = pilz(S.plan.pilz), st = L.planStand(S.plan, heute());
  if(rbWochen > S.plan.wochen) rbWochen = S.plan.wochen;
  const r = L.rueckblick(S.plan, S.einnahmen, S.eintraege, rbWochen, S.plan.beendet && L.tageZwischen(S.plan.beendet, heute()) > 0 ? S.plan.beendet : heute());
  const bw = 300 / rbWochen;
  const balken = r.mittel.map((x, i) => { const cx = 12 + i*bw + bw/2; if(x === null) return `<text x="${cx}" y="112" text-anchor="middle">–</text><text x="${cx}" y="138" text-anchor="middle">W${i+1}</text>`; const h = x / 5 * 100; return `<rect x="${12 + i*bw + bw*.18}" y="${120-h}" width="${bw*.64}" height="${h}" rx="4" fill="var(--moos)"/><text x="${cx}" y="${114-h}" text-anchor="middle">${String(x).replace(".", ",")}</text><text x="${cx}" y="138" text-anchor="middle">W${i+1}</text>`; }).join("");
  const beschreibung = r.mittel.map((x, i) => `Woche ${i+1}: ${x === null ? "keine Einträge" : String(x).replace(".", ",")}`).join(", ");
  v.innerHTML = `<div class="eyebrow">${esc(p.name)} seit ${datumLang(S.plan.start, {day:"numeric", month:"long"})}</div>
    <h2>${rbWochen === 4 ? "Deine ersten 4 Wochen" : "Deine 8 Wochen"}</h2>
    ${(rbWochen === 4 ? st.rueckblick4 : st.rueckblick8) ? "" : `<p class="lead">Noch nicht vorbei – das ist der Stand bis heute.</p>`}
    <div class="seg" role="group" aria-label="Zeitraum">
      <button type="button" data-w="4" aria-pressed="${rbWochen === 4}">Nach 4 Wochen</button>
      <button type="button" data-w="8" aria-pressed="${rbWochen === 8}" ${S.plan.wochen < 8 ? "disabled" : ""}>Nach 8 Wochen</button>
    </div>
    <div class="zahlen">
      <div class="zahl"><b>${r.genommen} von ${r.tage}</b><span>Tagen abgehakt</span></div>
      <div class="zahl"><b>${r.eintraege}</b><span>Tagebuch-Einträge</span></div>
    </div>
    <div class="karte"><h3>Befinden je Woche</h3>
      <p class="klein">Mittelwert deiner Einträge (1 = schlecht, 5 = sehr gut)</p>
      <svg viewBox="0 0 320 150" width="100%" role="img" aria-label="Befinden je Woche. ${beschreibung}">${balken}<line x1="10" x2="314" y1="120" y2="120" stroke="var(--linie)"/></svg></div>
    <p class="hinweis"><b>Wichtig:</b> Der Rückblick zeigt, wie es dir ging – nicht, warum. Schlaf, Wetter, Stress und vieles mehr spielen mit. Ob ${esc(p.name)} etwas damit zu tun hat, kann ein Tagebuch nicht sagen. Kein medizinischer Rat.</p>
    <div class="karte"><h3>Wie geht es weiter?</h3>
      <p>Du entscheidest. Der Begleiter empfiehlt nichts.</p>
      <div class="knoepfe">
        ${st.fertig ? "" : `<a class="knopf zwei" href="#plan">Weiter wie bisher</a><button class="knopf zwei" type="button" id="rbPause">${S.plan.pause ? "Pause beenden" : "Pause machen"}</button>`}
        <button class="knopf" type="button" id="drucken">Drucken oder als PDF fürs Arztgespräch</button>
      </div></div>`;
  v.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { rbWochen = +b.dataset.w; rueckblickZeigen(); });
  if($("#rbPause")) $("#rbPause").onclick = () => { S.plan.pause = !S.plan.pause; speichern(); rueckblickZeigen(); };
  $("#drucken").onclick = () => print();
}

/* ---------- Steuerung ---------- */
function fokus(){ window.scrollTo(0, 0); $("#main").focus({preventScroll: true}); }
function render(){
  gezeichnetAm = heute();
  const [v, id] = (location.hash.slice(1) || "atlas").split("/");
  const ansicht = ["atlas","pilz","plan","tagebuch","rueckblick"].includes(v) ? v : "atlas";
  if(ansicht === "atlas"){ planband(); raster($("#suche").value); }
  if(ansicht === "pilz") steckbrief(id);
  if(ansicht === "plan") plan();
  if(ansicht === "tagebuch") tagebuch();
  if(ansicht === "rueckblick") rueckblickZeigen();
  $$(".ansicht").forEach(s => s.classList.toggle("an", s.id === "v-" + ansicht));
  $("#titel").textContent = $("#v-" + ansicht).dataset.titel;
  document.title = ($("#v-" + ansicht).dataset.titel) + " · Pilz-Begleiter";
  $("#zurueck").classList.toggle("an", ansicht === "pilz");
  const tab = ansicht === "pilz" ? "atlas" : ansicht;
  $$(".tabs a").forEach(a => a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
}
$("#zurueck").onclick = () => { location.hash = "#atlas"; };
$("#sprung").onclick = () => $("#main").focus();
addEventListener("hashchange", () => { render(); fokus(); });
// Beim Zurückkehren in die App nur neu zeichnen, wenn inzwischen ein neuer Tag ist – sonst ginge ein angefangener Tagebuch-Eintrag verloren
let gezeichnetAm = "";
document.addEventListener("visibilitychange", () => { if(!document.hidden && heute() !== gezeichnetAm) render(); });
render();
if("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
