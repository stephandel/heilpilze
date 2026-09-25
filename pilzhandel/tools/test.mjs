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
