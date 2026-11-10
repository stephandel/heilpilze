// Dauertest Pilz-Begleiter in WebKit (Safari-Engine) mit iPhone-Maßen: node begleiter/tools/oberflaeche.webkit.cjs
// Prüft 1) kein waagrechtes Überlaufen aller Ansichten bei 402/375/320 px hell und dunkel (Stephans Foto P-351a: Atlas-Spalte abgeschnitten),
// 2) Kopf oben in derselben Farbe wie html – iOS malt die Statusleiste der Home-Bildschirm-App in der html-Farbe (Bibliothek Teil C 1),
// 3) nichts scheint durch Kopf und Reiterleiste (Bibliothek M132/Teil C 370; Kanal-Schwelle 20 statt 40, bei 40 blieb „Schmetterlingstramete“ hinter dem Kopf lesbar),
// 4) die von Stephan am 10.11.2026 bestätigten Schritte: Plan anlegen, Kalender-Datei, Haken und Tagebuch nach Neuladen, offline, Dunkelmodus.
// Standalone lässt sich nicht einschalten: der Server macht aus „@media (display-mode:standalone)“ „@media all“ (wie Bibliothek vorlage/tests/kopfzeile.browser.mjs).
const { webkit } = require("/Users/stephanhandel/KI Projekte/Wetter Apps/Wetterlage/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const WURZEL = path.join(__dirname, "..", ".."), PORT = +(process.env.PORT || 8832);
const TYP = {".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".webmanifest":"application/manifest+json", ".svg":"image/svg+xml", ".png":"image/png"};
const server = http.createServer((q, a) => {
  const u = new URL(q.url, "http://x"); let f = path.join(WURZEL, decodeURIComponent(u.pathname));
  if(!f.startsWith(WURZEL)) { a.writeHead(403); return a.end(); }
  if(f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => {
    if(e) { a.writeHead(404); return a.end(); }
    if(f.endsWith(".css") && (q.headers.referer || "").includes("standalone")) d = Buffer.from(String(d).replace(/\(display-mode:\s*standalone\)/g, "all"));
    a.writeHead(200, {"content-type": TYP[path.extname(f)] || "application/octet-stream"}); a.end(d);
  });
});
const BASIS = `http://127.0.0.1:${PORT}/begleiter/`;
const fehler = []; let geprueft = 0;
const pruefe = (ok, text) => { geprueft++; if(!ok) fehler.push(text); };

function beispiel(){
  const ein = {}, tb = {}, k = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  for(let i = 0; i < 20; i++){
    const d = new Date(2026, 9, 21 + i);
    if(i % 6 !== 3) ein[k(d)] = true;
    if(i % 5 !== 2) tb[k(d)] = {befinden: [3,4,3,4,5,3,4][i % 7], vertraeglich: i === 4 ? "etwas" : null, notiz: i === 19 ? "Pulver im Joghurt geht gut, auch mit Honig und etwas Zimt am Abend." : ""};
  }
  return {plan: {pilz: "coriolus", uhr: "20:00", wochen: 8, start: "2026-10-21", erinnern: true, befinden: true, pause: false, beendet: null}, einnahmen: ein, eintraege: tb};
}

// Rechte Kante aller sichtbaren Elemente gegen die Fensterbreite
const ueberlauf = page => page.evaluate(() => {
  const d = document.documentElement, raus = [];
  for(const el of document.querySelectorAll(".app *")){
    if(el.closest(".ansicht:not(.an)") || el.closest("[hidden]")) continue;
    const r = el.getBoundingClientRect();
    if(r.width && r.right > innerWidth + 1) raus.push(`${el.tagName.toLowerCase()}.${el.className.baseVal ?? el.className} „${(el.textContent || "").trim().slice(0, 25)}“ ${Math.round(r.right)}`);
  }
  return {sw: d.scrollWidth, cw: d.clientWidth, raus: raus.slice(0, 3)};
});

(async () => {
  await new Promise(r => server.listen(PORT, "127.0.0.1", r));
  const browser = await webkit.launch();
  const neu = async (breite, schema, extra = {}) => {
    const ctx = await browser.newContext({viewport: {width: breite, height: 874}, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: schema, acceptDownloads: true, ...extra});
    return [ctx, await ctx.newPage()];
  };
  try {
    // 1) Überlauf: alle Ansichten, leer und mit Beispieldaten
    for(const schema of ["light", "dark"]) for(const breite of [402, 375, 320]){
      const [ctx, p] = await neu(breite, schema);
      p.on("pageerror", e => fehler.push(`${schema}/${breite}: Skriptfehler ${e.message}`));
      await p.goto(BASIS + "?heute=2026-11-10#atlas");
      const ziele = ["atlas", "plan", "tagebuch", "rueckblick", ...(await p.$$eval(".pilz", a => a.map(x => x.getAttribute("href").slice(1))))];
      for(const daten of ["leer", "beispiel"]){
        await p.evaluate(d => d ? localStorage.setItem("pb-v1", JSON.stringify(d)) : localStorage.clear(), daten === "beispiel" ? beispiel() : null);
        for(const z of ziele){
          if(daten === "beispiel" && z.startsWith("pilz/") && z !== "pilz/coriolus") continue;
          await p.goto(BASIS + `?heute=2026-11-10#${z}`); await p.reload(); await p.waitForTimeout(60);
          const m = await ueberlauf(p);
          pruefe(m.sw <= m.cw && !m.raus.length, `Überlauf ${schema} ${breite} px #${z} (${daten}): scrollWidth ${m.sw} > ${m.cw}; ${m.raus.join(" | ")}`);
        }
      }
      // Plan-Assistent (3 Schritte) leer
      await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + "?heute=2026-11-10#pilz/coriolus"); await p.reload();
      await p.click("#planMit");
      for(let s = 1; s <= 3; s++){ const m = await ueberlauf(p); pruefe(m.sw <= m.cw && !m.raus.length, `Überlauf ${schema} ${breite} px Plan-Schritt ${s}: ${m.sw}/${m.cw} ${m.raus.join(" | ")}`); if(s < 3) await p.click("#weiter"); }
      await ctx.close();
    }

    // 2) Statusleisten-Streifen: oberste Pixelzeile (Kopf) = html-Farbe, als Home-Bildschirm-App nachgebildet
    for(const schema of ["light", "dark"]){
      const [ctx, p] = await neu(402, schema);
      await p.goto(BASIS + "?standalone&heute=2026-11-10#atlas"); await p.waitForTimeout(300);
      const bild = (await p.screenshot({clip: {x: 0, y: 0, width: 402, height: 40}})).toString("base64");
      const farben = await p.evaluate(async b64 => {
        const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        const g = c.getContext("2d"); g.drawImage(img, 0, 0);
        const px = [...g.getImageData(img.width / 2, 2, 1, 1).data].slice(0, 3);
        const hg = getComputedStyle(document.documentElement).backgroundColor.match(/\d+/g).slice(0, 3).map(Number);
        return {px, hg, abstand: Math.round(document.querySelector(".kopf h1").getBoundingClientRect().top)};
      }, bild);
      const diff = Math.max(...farben.px.map((v, i) => Math.abs(v - farben.hg[i])));
      pruefe(diff <= 2, `Streifen ${schema}: Kopf oben rgb(${farben.px}) ≠ html rgb(${farben.hg}) – iOS malt die Statusleiste in der html-Farbe`);
      pruefe(farben.abstand >= 33, `Standalone-Abstand ${schema}: Titel ${farben.abstand} px unter der Statusleiste (mind. 33, Bibliothek M117)`);
      await ctx.close();
    }

    // 3) Durchscheinen: gerollter Inhalt hinter Kopf und Reiterleiste (Playwright zeichnet keinen Weichzeichner – strenger als das iPhone, so gewollt)
    const { durchschein } = await import("./durchschein.mjs");
    for(const schema of ["light", "dark"]) for(const [ziel, y] of [["atlas", 600], ["rueckblick", 300], ["tagebuch", 400]]){
      const [ctx, p] = await neu(402, schema);
      await p.goto(BASIS + `?heute=2026-11-23#${ziel}`); await p.evaluate(d => localStorage.setItem("pb-v1", JSON.stringify(d)), beispiel()); await p.reload();
      await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(200);
      const bereiche = await p.evaluate(() => { const k = document.querySelector(".kopf").getBoundingClientRect(), t = document.querySelector(".tabs").getBoundingClientRect(); return [{name: "kopf", oben: 0, unten: Math.round(k.bottom)}, {name: "reiter", oben: Math.round(t.top), unten: innerHeight}]; });
      const werte = await durchschein(p, {bereiche, inhalt: "#main", schwelleKanal: 20});
      for(const w of werte) pruefe(w.anteil < 0.005, `Durchscheinen ${schema} #${ziel} ${w.name}: ${(w.anteil * 100).toFixed(2)} % der Pixel weichen ab (stärkste ${w.schlimmste})`);
      await ctx.close();
    }

    // 4) Bestätigte Schritte aus P-351a als Dauertest
    for(const schema of ["light", "dark"]){
      const [ctx, p] = await neu(402, schema);
      await p.goto(BASIS + "?heute=2026-11-10");
      await p.click('a[href="#pilz/reishi"]'); await p.click("#planMit");
      await p.click("#weiter"); await p.click('[data-zeit="08:00"]'); await p.click("#weiter"); await p.click("#weiter");
      const plan = await p.evaluate(() => JSON.parse(localStorage.getItem("pb-v1")).plan);
      pruefe(plan && plan.pilz === "reishi" && plan.uhr === "08:00", `${schema}: Plan nicht gespeichert (${JSON.stringify(plan)})`);
      const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#ics")]);
      const ics = fs.readFileSync(await dl.path(), "utf8");
      pruefe(/BEGIN:VCALENDAR/.test(ics) && /RRULE:FREQ=DAILY/.test(ics) && /T080000/.test(ics) && /BEGIN:VALARM/.test(ics), `${schema}: Kalender-Datei unvollständig`);
      await p.click("#haken");
      await p.click('a[href="#tagebuch"].knopf'); await p.click('[data-b="4"]'); await p.fill("#notiz", "Erster Tag"); await p.click("#speichern");
      await p.reload();
      const nach = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("pb-v1")); return {haken: !!s.einnahmen["2026-11-10"], notiz: s.eintraege["2026-11-10"]?.notiz}; });
      pruefe(nach.haken && nach.notiz === "Erster Tag", `${schema}: Haken/Tagebuch nach Neuladen weg (${JSON.stringify(nach)})`);
      await p.goto(BASIS + "?heute=2026-11-10#plan"); await p.reload();
      pruefe(await p.getAttribute("#haken", "aria-pressed") === "true", `${schema}: Haken nach Neuladen nicht gesetzt`);
      // Dunkelmodus: Seite folgt dem System
      const hg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
      pruefe(schema === "dark" ? hg === "rgb(20, 20, 14)" : hg === "rgb(251, 245, 228)", `${schema}: Hintergrund ${hg}`);
      // Offline: Service Worker übernimmt, dann ohne Netz neu laden
      await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(800);
      await ctx.setOffline(true);
      await p.goto(BASIS + "?heute=2026-11-10#atlas"); await p.waitForTimeout(500);
      pruefe(await p.$$eval(".pilz", a => a.length) === 21, `${schema}: offline keine 21 Pilze`);
      await ctx.close();
    }
  } finally {
    await browser.close(); server.close();
  }
  if(fehler.length){ console.log(`ROT: ${fehler.length} von ${geprueft} Prüfungen\n- ` + fehler.join("\n- ")); process.exit(1); }
  console.log(`GRÜN: ${geprueft} Prüfungen`);
})().catch(e => { console.error(e); process.exit(1); });
