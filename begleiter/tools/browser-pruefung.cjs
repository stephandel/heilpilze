// Prüfung Pilz-Begleiter: Klickweg, Bildschirmfotos hell/dunkel 500 px, Tippflächen, Schriftgröße
const { chromium } = require("/Users/stephanhandel/KI Projekte/Wetter Apps/Wetterlage/node_modules/playwright");
const AUS = process.argv[2];
const BASIS = "http://localhost:8817/begleiter/";
const fehler = [];

function beispiel(){
  const ein = {}, tb = {};
  for(let i = 0; i < 20; i++){
    const d = new Date(2026, 9, 21 + i), k = d.toISOString ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "";
    if(i % 6 !== 3) ein[k] = true;
    if(i % 5 !== 2) tb[k] = {befinden: [3,4,3,4,5,3,4][i % 7], vertraeglich: i === 4 ? "etwas" : null, notiz: i === 19 ? "Pulver im Joghurt geht gut." : ""};
  }
  return {plan: {pilz: "reishi", uhr: "20:00", wochen: 8, start: "2026-10-21", erinnern: true, befinden: true, pause: false, beendet: null}, einnahmen: ein, eintraege: tb};
}

async function messen(page){
  return page.evaluate(() => {
    const klein = [], schrift = [];
    for(const el of document.querySelectorAll("button, a, input, select, textarea, summary")){
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if(!r.width || cs.visibility === "hidden" || el.closest("[hidden]") || el.id === "sprung") continue;
      if(el.closest("p") && el.tagName === "A") continue; // Links im Fließtext
      if(r.height < 44 || (r.width < 44)) klein.push(`${el.tagName}#${el.id}.${el.className} ${Math.round(r.width)}x${Math.round(r.height)} „${el.textContent.trim().slice(0,25)}“`);
    }
    const w = document.createTreeWalker(document.querySelector(".app"), NodeFilter.SHOW_TEXT);
    while(w.nextNode()){
      const n = w.currentNode, el = n.parentElement;
      if(!n.textContent.trim() || !el.getClientRects().length || el.closest("svg")) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if(fs < 16) schrift.push(`${fs}px „${n.textContent.trim().slice(0,30)}“ (${el.tagName}.${el.className})`);
    }
    return {klein: [...new Set(klein)], schrift: [...new Set(schrift)]};
  });
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const ergebnis = {};
  for(const schema of ["light", "dark"]){
    // Leerer Start: Klickweg Atlas → Reishi → Plan (3 Schritte) → Plan steht → abhaken → Tagebuch
    const ctx = await browser.newContext({ viewport: { width: 500, height: 900 }, deviceScaleFactor: 2, colorScheme: schema });
    const page = await ctx.newPage();
    page.on("console", m => { if(m.type() === "error") fehler.push(`${schema}: ${m.text()}`); });
    page.on("pageerror", e => fehler.push(`${schema}: ${e.message}`));
    await page.goto(BASIS + "?heute=2026-11-09");
    await page.screenshot({ path: `${AUS}/01-atlas-leer-${schema}.png` });
    await page.click('a[href="#pilz/reishi"]');
    await page.screenshot({ path: `${AUS}/02-steckbrief-${schema}.png`, fullPage: true });
    await page.click("#planMit");
    await page.screenshot({ path: `${AUS}/03-plan-schritt1-${schema}.png` });
    await page.click("#weiter");
    await page.click('[data-zeit="08:00"]');
    await page.screenshot({ path: `${AUS}/04-plan-schritt2-${schema}.png` });
    await page.click("#weiter");
    await page.screenshot({ path: `${AUS}/05-plan-schritt3-${schema}.png` });
    await page.click("#weiter");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#ics")]);
    ergebnis[`ics-${schema}`] = dl.suggestedFilename();
    await page.click("#haken");
    await page.screenshot({ path: `${AUS}/06-plan-steht-${schema}.png`, fullPage: true });
    await page.click('a[href="#tagebuch"].knopf');
    await page.click('[data-b="4"]');
    await page.click('[data-v="beschwerden"]');
    await page.fill("#notiz", "Erster Tag, Pulver im Tee.");
    await page.click("#speichern");
    await page.screenshot({ path: `${AUS}/07-tagebuch-${schema}.png`, fullPage: true });
    ergebnis[`gespeichert-${schema}`] = await page.evaluate(() => localStorage.getItem("pb-v1"));
    ergebnis[`masse-tagebuch-${schema}`] = await messen(page);
    // Nach Neuladen noch da?
    await page.reload();
    ergebnis[`nachReload-${schema}`] = await page.evaluate(() => !!JSON.parse(localStorage.getItem("pb-v1")).eintraege["2026-11-09"]);
    await ctx.close();

    // Mit Beispieldaten (20 Tage)
    const ctx2 = await browser.newContext({ viewport: { width: 500, height: 900 }, deviceScaleFactor: 2, colorScheme: schema });
    const p2 = await ctx2.newPage();
    p2.on("pageerror", e => fehler.push(`${schema}/2: ${e.message}`));
    await p2.goto(BASIS + "?heute=2026-11-23");
    await p2.evaluate(d => localStorage.setItem("pb-v1", JSON.stringify(d)), beispiel());
    await p2.goto(BASIS + "?heute=2026-11-23#atlas"); await p2.reload();
    await p2.screenshot({ path: `${AUS}/08-atlas-mit-plan-${schema}.png` });
    for(const v of ["plan", "tagebuch", "rueckblick"]){
      await p2.goto(BASIS + `?heute=2026-11-23#${v}`); await p2.reload();
      await p2.screenshot({ path: `${AUS}/09-${v}-beispiel-${schema}.png`, fullPage: true });
      ergebnis[`masse-${v}-${schema}`] = await messen(p2);
    }
    await p2.goto(BASIS + "?heute=2026-11-23#atlas");
    ergebnis[`masse-atlas-${schema}`] = await messen(p2);
    // Offline: Service Worker aktiv, dann ohne Netz neu laden
    await p2.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true), null, { timeout: 5000 }).catch(() => {});
    await p2.reload(); await p2.waitForTimeout(800);
    await ctx2.setOffline(true);
    await p2.reload();
    ergebnis[`offline-${schema}`] = await p2.evaluate(() => document.querySelectorAll(".pilz").length);
    await p2.screenshot({ path: `${AUS}/10-offline-${schema}.png` });
    await ctx2.close();
  }
  await browser.close();
  console.log(JSON.stringify({ fehler, ergebnis }, null, 1));
})();
