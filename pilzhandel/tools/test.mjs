// Tests nach Risiko (TEST-01): Fachregeln (Einstufung), Sicherheitslogik
// (Wechselwirkungs-Check) und Datenaufbereitung (Tagebuch-Import).
// Ausführen: node --test tools/test.mjs   (Node 18 oder neuer)
//
// Prüft echten Code, keine Kopien: `data.js` wird als Browser-Skript geladen
// (window.PH), `logic.js` per require, genau wie index.html sie einbindet.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require = createRequire(import.meta.url);

function loadData(){
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const src = readFileSync(join(root, "data.js"), "utf8");
  vm.runInContext(src, sandbox, { filename: "data.js" });
  return sandbox.window.PH;
}

const PH = loadData();
const { checkHits, parseDiaryImport } = require(join(root, "logic.js"));

const LEVELS = new Set(["E", "F", "T", "S"]);

describe("Datenqualität (data.js, alle Pilze)", () => {
  test("jeder Pilz hat eine eindeutige id", () => {
    const ids = PH.MUSHROOMS.map(m => m.id);
    assert.equal(new Set(ids).size, ids.length, "doppelte id in MUSHROOMS");
  });

  test("jede Wirkungsaussage hat eine gültige Evidenzstufe E/F/T/S und Text", () => {
    for(const m of PH.MUSHROOMS){
      assert.ok(Array.isArray(m.effects) && m.effects.length, `${m.id}: keine effects`);
      for(const e of m.effects){
        assert.ok(LEVELS.has(e.l), `${m.id}: unbekannte Stufe "${e.l}" bei "${e.t}"`);
        assert.ok(e.t && e.t.trim(), `${m.id}: Aussage ohne Text`);
        assert.ok(e.d && e.d.trim(), `${m.id}: "${e.t}" ohne Begründung/Beleg`);
      }
    }
  });

  test("der Punktwert je Pilz liegt zwischen 0 und 4", () => {
    for(const m of PH.MUSHROOMS){
      assert.ok(Number.isInteger(m.score), `${m.id}: score ist keine ganze Zahl`);
      assert.ok(m.score >= 0 && m.score <= 4, `${m.id}: score ${m.score} außerhalb 0–4`);
    }
  });

  test("jedes Check-Flag eines Pilzes existiert in PH.FLAGS", () => {
    for(const m of PH.MUSHROOMS){
      for(const key of Object.keys(m.flags || {})){
        assert.ok(PH.FLAGS[key], `${m.id}: Flag "${key}" ist nicht in PH.FLAGS definiert`);
      }
    }
  });

  test("jeder Flag-Wert ist 1 (beachten) oder 2 (ärztlich abklären)", () => {
    for(const m of PH.MUSHROOMS){
      for(const [key, v] of Object.entries(m.flags || {})){
        assert.ok(v === 1 || v === 2, `${m.id}: Flag "${key}" hat ungültigen Wert ${v}`);
      }
    }
  });

  test("jede Quelle hat Titel und Link", () => {
    for(const m of PH.MUSHROOMS){
      assert.ok(Array.isArray(m.sources) && m.sources.length, `${m.id}: keine Quellen`);
      for(const s of m.sources){
        assert.ok(s.t && s.t.trim(), `${m.id}: Quelle ohne Titel`);
        assert.ok(s.u && /^https?:\/\//.test(s.u), `${m.id}: Quelle "${s.t}" ohne gültigen Link`);
      }
    }
  });

  test("jedes verwendete Foto (Pilze + Hero) hat einen Bildrechte-Eintrag mit Lizenz (VIS-04)", () => {
    // Rein lokal, ohne Netzwerk: prüft nur, ob tools/fetch-image-credits.js zuletzt für
    // alle aktuell verwendeten Fotos gelaufen ist, nicht ob Commons erreichbar ist.
    const { EXTRA, HERO } = require(join(root, "tools", "build-data.js"));
    const used = [...new Set([...Object.values(EXTRA).flatMap(x => x.imgs || []), ...HERO])];
    const credits = PH.IMG_CREDITS || {};
    const missing = used.filter(f => !credits[f] || !credits[f].license);
    assert.deepEqual(missing, [], `Bildrechte fehlen oder sind veraltet für: ${missing.join(", ")} — node pilzhandel/tools/fetch-image-credits.js und danach build-data.js laufen lassen`);
  });
});

describe("Wechselwirkungs-Check (checkHits, aus logic.js)", () => {
  test("ohne Auswahl gibt es keine Treffer und Stufe 0", () => {
    const { hits, lvl } = checkHits({ op: 2, diabetes: 1 }, []);
    assert.deepEqual(hits, []);
    assert.equal(lvl, 0);
  });

  test("Stufe ist das Maximum der getroffenen Flags, nicht die Summe", () => {
    const { hits, lvl } = checkHits({ diabetes: 1, op: 2, leber: 1 }, ["diabetes", "op", "leber"]);
    assert.equal(hits.length, 3);
    assert.equal(lvl, 2, "ein op-Treffer (2) darf nicht durch zwei Treffer der Stufe 1 verdeckt werden");
  });

  test("nur ausgewählte Flags zählen, andere Pilz-Flags werden ignoriert", () => {
    const { hits, lvl } = checkHits({ diabetes: 1, op: 2 }, ["diabetes"]);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].k, "diabetes");
    assert.equal(lvl, 1, "op ist nicht ausgewählt und darf die Stufe nicht anheben");
  });

  test("gegen die echten Daten: jeder Pilz mit einem op- oder gerinnungs-Treffer liegt auf Stufe seines Maximums", () => {
    for(const m of PH.MUSHROOMS){
      const keys = Object.keys(m.flags || {});
      if(!keys.length) continue;
      const { lvl } = checkHits(m.flags, keys);
      const expected = Math.max(...Object.values(m.flags));
      assert.equal(lvl, expected, `${m.id}: erwartete Stufe ${expected}, erhalten ${lvl}`);
    }
  });
});

describe("Tagebuch-Import (parseDiaryImport, aus logic.js)", () => {
  const isValidId = id => id === "reishi" || id === "chaga";
  const today = "2026-09-25";

  test("übernimmt einen gültigen, neuen Eintrag", () => {
    const add = parseDiaryImport({ diary: [{ t: 1, d: today, m: "reishi", s: 4 }] }, [], isValidId);
    assert.equal(add.length, 1);
    assert.equal(add[0].m, "reishi");
    assert.equal(add[0].s, 4);
  });

  test("verwirft Einträge mit unbekanntem Pilz", () => {
    const add = parseDiaryImport({ diary: [{ t: 1, d: today, m: "unbekannt" }] }, [], isValidId);
    assert.equal(add.length, 0);
  });

  test("verwirft Einträge mit ungültigem oder fehlendem Datum", () => {
    const add = parseDiaryImport({ diary: [
      { t: 1, d: "25.09.2026", m: "reishi" },
      { t: 2, d: "", m: "reishi" },
      { t: 3, m: "reishi" },
    ] }, [], isValidId);
    assert.equal(add.length, 0);
  });

  test("verwirft bereits vorhandene Einträge (gleicher Zeitstempel), statt sie zu verdoppeln", () => {
    const existing = [{ t: 1, d: today, m: "reishi" }];
    const add = parseDiaryImport({ diary: [{ t: 1, d: today, m: "reishi" }] }, existing, isValidId);
    assert.equal(add.length, 0);
  });

  test("erzwingt Befinden im Bereich 1–5, auch bei fehlerhaften oder fehlenden Werten", () => {
    const add = parseDiaryImport({ diary: [
      { t: 1, d: today, m: "reishi", s: 9 },
      { t: 2, d: today, m: "reishi", s: -3 },
      { t: 3, d: today, m: "reishi", s: "kaputt" },
    ] }, [], isValidId);
    assert.equal(add.length, 3);
    for(const e of add) assert.ok(e.s >= 1 && e.s <= 5, `Befinden ${e.s} außerhalb 1–5`);
  });

  test("wandelt Präparat, Menge und Notiz in Text um, auch wenn sie fehlen", () => {
    const add = parseDiaryImport({ diary: [{ t: 1, d: today, m: "reishi" }] }, [], isValidId);
    assert.equal(add[0].p, "");
    assert.equal(add[0].a, "");
    assert.equal(add[0].n, "");
  });

  test("eine leere oder fehlerhafte Sicherungsdatei ergibt keine Einträge, statt zu werfen", () => {
    assert.deepEqual(parseDiaryImport({}, [], isValidId), []);
    assert.deepEqual(parseDiaryImport({ diary: null }, [], isValidId), []);
    assert.deepEqual(parseDiaryImport({ diary: [null, 42, "x"] }, [], isValidId), []);
  });
});

// ---------------------------------------------------------------------------
// Regel-Nachweise: prüfen, ob das, was die Tabelle in CLAUDE.md als ✅ behauptet,
// im Code noch stimmt. Selbst eingetragener Status veraltet, ein Test nicht.
// Die Quelltext-Prüfungen stellen nur sicher, dass Text/Element vorhanden ist,
// nicht dass es im Browser richtig aussieht — dafür bleibt der Browsertest.
// ---------------------------------------------------------------------------
const read = f => readFileSync(join(root, f), "utf8");
const APP = read("app.js"), HTML = read("index.html"), CSS = read("app.css"), SW = read("sw.js");

// Quelltext einer Ansichts-Funktion aus app.js, bis zur nächsten Funktion auf oberster Ebene
function fnSrc(name){
  const start = APP.indexOf(`\nfunction ${name}(`);
  assert.ok(start >= 0, `Funktion ${name}() nicht in app.js gefunden`);
  const end = APP.indexOf("\nfunction ", start + 1);
  return APP.slice(start, end < 0 ? undefined : end);
}

describe("Regel-Nachweise im Quelltext (CLAUDE.md-Tabelle)", () => {
  test("CONTENT-01: Fußzeile sagt, dass die App keine ärztliche Beratung ersetzt", () => {
    assert.match(HTML, /ersetzt keine ärztliche Beratung/);
  });

  test("CONTENT-02: jede Detailseite nennt Verantwortlich, Stand und Aktualisierungsregel", () => {
    const d = fnSrc("detail");
    assert.match(d, /Verantwortlich:.*#\/impressum/);
    assert.match(d, /Stand dieser Einstufung/);
    assert.match(d, /Aktualisierung:/);
  });

  test("EXPLAIN-01: Top-Evidenz und Katalog-Sortierung sagen, wonach sie ordnen", () => {
    assert.match(fnSrc("home"), /Sortiert nach Humanevidenz/);
    assert.match(fnSrc("catalog"), /„Evidenz ↓“ sortiert nach/);
  });

  test("SYNC-03: Tagebuch und Arzt-Karte warnen, dass die Daten nur im Browser liegen", () => {
    assert.match(fnSrc("tagebuch"), /nur in diesem Browser/);
    assert.match(fnSrc("arztkarte"), /nur in diesem Browser/);
  });

  test("UX-03: Löschen/Leeren bietet Rückgängig an (mind. drei Stellen)", () => {
    assert.ok((APP.match(/onUndo/g) || []).length >= 3);
  });

  test("DQ-04 + LEGAL-01: Fußzeile verlinkt Fehler melden, Impressum und Datenschutz; Detailseite hat Meldelink", () => {
    for(const s of ["#/impressum", "#/datenschutz", "labels=inhalt"]) assert.ok(HTML.includes(s), `Fußzeile ohne ${s}`);
    assert.match(fnSrc("detail"), /issueUrl\(/);
  });

  test("A11Y-02: Sprunglink, main-Landmark und Live-Region vorhanden", () => {
    assert.match(HTML, /class="skip" href="#main"/);
    assert.match(HTML, /<main id="main"/);
    assert.match(HTML, /aria-live="polite"/);
  });

  test("OPS-06: Studien-Radar läuft als monatliche GitHub Action", () => {
    const wf = readFileSync(join(root, "..", ".github", "workflows", "studien-radar.yml"), "utf8");
    assert.match(wf, /cron:/);
    assert.match(wf, /studien-radar\.js/);
  });
});

describe("Offline-Fähigkeit (sw.js)", () => {
  test("jede in index.html eingebundene lokale Datei steht im App-Cache (SHELL)", () => {
    const shell = new Function("return " + SW.match(/const SHELL = (\[[\s\S]*?\]);/)[1])();
    const used = [...HTML.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)]
      .map(m => m[1]).filter(u => !/^(https?:|#|data:)/.test(u));
    const missing = used.filter(u => !shell.includes(u));
    assert.deepEqual(missing, [], `fehlt im SHELL von sw.js: ${missing.join(", ")} — offline sonst kaputt`);
  });
});

describe("Farbkontrast (app.css, WCAG AA)", () => {
  const vars = block => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
  const light = vars(CSS.match(/:root\{([^}]*)\}/)[1]);
  const darkSys = { ...light, ...vars(CSS.match(/:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/)[1]) };
  const darkSet = { ...light, ...vars(CSS.match(/:root\[data-theme="dark"\]\{([^}]*)\}/)[1]) };
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

  test("die beiden Dunkel-Blöcke (System und Umschalter) haben dieselben Farben", () => {
    assert.deepEqual(darkSys, darkSet, "Dunkelmodus per System und per Umschalter weichen voneinander ab");
  });

  for(const [name, t] of [["hell", light], ["dunkel", darkSys]]){
    test(`${name}: jede Textfarbe erreicht auf jedem Grund mindestens 4,5:1`, () => {
      const low = [];
      for(const fg of ["ink", "ink-2", "ink-3", "accent-ink"])
        for(const bg of ["bg", "bg-2", "surface", "surface-2"]){
          const r = ratio(t[fg], t[bg]);
          if(r < 4.5) low.push(`${fg} auf ${bg}: ${r.toFixed(2)}:1`);
        }
      const r = ratio(t["on-accent"], t.accent);
      if(r < 4.5) low.push(`on-accent auf accent: ${r.toFixed(2)}:1`);
      assert.deepEqual(low, []);
    });
  }
});

describe("Impressum & Datenschutz (betreiber.js, LEGAL-01)", () => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(root, "betreiber.js"), "utf8"), sandbox, { filename: "betreiber.js" });
  const BT = sandbox.window.PH_BETREIBER;
  const missing = ["name", "strasse", "plzOrt", "email"].filter(k => !String(BT[k] || "").trim());

  // Als "todo" markiert, solange Angaben fehlen: blockiert keine Commits, wird aber bei jedem
  // Testlauf angezeigt. Vor dem Zusammenführen nach main muss dieser Test grün sein.
  test("alle Betreiberangaben sind ausgefüllt", missing.length ? { todo: `fehlt noch: ${missing.join(", ")}` } : {}, () => {
    assert.deepEqual(missing, []);
  });

  test("die E-Mail-Adresse sieht gültig aus, sobald sie eingetragen ist", () => {
    if(BT.email) assert.match(BT.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
