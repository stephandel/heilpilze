// Tests für die Begleiter-Logik: node --test begleiter/tools/test.mjs
import {test} from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require = createRequire(import.meta.url);
const L = require("../logik.js");
const plan = (x = {}) => L.planAnlegen({pilz: "reishi", uhr: "20:00", wochen: 8, start: "2026-11-01", ...x});

test("Datumsrechnung über die Zeitumstellung hinweg", () => {
  assert.equal(L.tageZwischen("2026-10-24", "2026-10-26"), 2); // 25.10. Winterzeit
  assert.equal(L.tageZwischen("2026-03-28", "2026-03-30"), 2); // 29.03. Sommerzeit
  assert.equal(L.plusTage("2026-12-30", 3), "2027-01-02");
  assert.equal(L.plusTage("2028-02-28", 1), "2028-02-29");
  assert.equal(L.datumText(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});

test("Plan anlegen prüft Eingaben", () => {
  assert.equal(plan().wochen, 8);
  assert.throws(() => plan({uhr: "25:00"}));
  assert.throws(() => plan({wochen: 6}));
  assert.throws(() => plan({pilz: ""}));
});

test("Planstand: Tag, Woche, Ende", () => {
  assert.deepEqual([L.planStand(plan(), "2026-11-01").tag, L.planStand(plan(), "2026-11-01").woche], [1, 1]);
  const s = L.planStand(plan(), "2026-11-15");
  assert.equal(s.tag, 15); assert.equal(s.woche, 3); assert.equal(s.fertig, false);
  assert.equal(L.planStand(plan(), "2026-11-29").rueckblick4, true);
  assert.equal(L.planStand(plan(), "2026-11-28").rueckblick4, false);
  assert.equal(L.planStand(plan(), "2026-12-27").fertig, true); // Tag 57
  assert.equal(L.planStand(plan(), "2026-12-26").fertig, false); // Tag 56
  assert.equal(L.planStand({...plan(), beendet: "2026-11-05"},"2026-11-05").fertig, true);
});

test("Erinnerungszeit: heute, morgen oder keine", () => {
  const p = plan();
  assert.equal(+L.naechsteErinnerung(p, new Date(2026, 10, 3, 19, 0), false), +new Date(2026, 10, 3, 20, 0));
  assert.equal(+L.naechsteErinnerung(p, new Date(2026, 10, 3, 19, 0), true), +new Date(2026, 10, 4, 20, 0));
  assert.equal(+L.naechsteErinnerung(p, new Date(2026, 10, 3, 20, 0), false), +new Date(2026, 10, 4, 20, 0));
  assert.equal(+L.naechsteErinnerung(p, new Date(2026, 9, 20, 9, 0), false), +new Date(2026, 10, 1, 20, 0)); // vor Start
  assert.equal(+L.naechsteErinnerung(p, new Date(2026, 11, 26, 9, 0), false), +new Date(2026, 11, 26, 20, 0)); // letzter Tag
  assert.equal(L.naechsteErinnerung(p, new Date(2026, 11, 26, 21, 0), false), null); // nach dem letzten Termin
  assert.equal(L.naechsteErinnerung({...p, pause: true}, new Date(2026, 10, 3, 9, 0), false), null);
  assert.equal(L.naechsteErinnerung({...p, erinnern: false}, new Date(2026, 10, 3, 9, 0), false), null);
});

test("Rückblick zählt nur bis heute und mittelt je Woche", () => {
  const p = plan({wochen: 4});
  const ein = {"2026-11-01": true, "2026-11-02": true, "2026-11-09": true, "2026-12-30": true};
  const tb = {"2026-11-01": {befinden: 3}, "2026-11-02": {befinden: 4}, "2026-11-08": {befinden: 2}, "2026-11-09": {befinden: 9}};
  const r = L.rueckblick(p, ein, tb, 4, "2026-11-09");
  assert.equal(r.tage, 9); assert.equal(r.genommen, 3); assert.equal(r.eintraege, 3);
  assert.deepEqual(r.mittel, [3.5, 2, null, null]);
  assert.equal(L.rueckblick(p, ein, tb, 4, "2027-01-01").tage, 28);
  assert.equal(L.rueckblick(p, ein, tb, 4, "2026-10-01").tage, 0);
});

test("Kalender-Datei: tägliche Wiederholung für die Plandauer", () => {
  const ics = L.icsErinnerung(plan(), "Reishi", new Date(Date.UTC(2026, 10, 9, 3, 0)));
  assert.match(ics, /DTSTART:20261101T200000\r\n/);
  assert.match(ics, /RRULE:FREQ=DAILY;COUNT=56/);
  assert.match(ics, /BEGIN:VALARM/);
  assert.match(ics.replace(/\r\n[ \t]/g, ""), /kein medizinischer Rat/); // entfaltet, die Zeile ist länger als 75 Byte
  // Ende 5 Minuten nach Start, über Mitternacht hinweg auf den nächsten Tag (Safari lehnt Start = Ende ab)
  assert.match(L.icsErinnerung(plan({uhr: "23:58"}), "Reishi"), /DTEND:20261102T000300/);
  assert.match(L.icsErinnerung(plan({uhr: "23:59"}), "Reishi"), /DTEND:20261102T000400/);
});

test("Kalender-Datei: RFC 5545 – CRLF, Zeilen höchstens 75 Byte, Sonderzeichen maskiert", () => {
  const ics = L.icsErinnerung(plan(), "Coriolus / Schmetterlingstramete, Trametes; Test\\x");
  assert.ok(!/[^\r]\n/.test(ics), "nur CRLF-Zeilenenden");
  for(const zeile of ics.split("\r\n")) assert.ok(Buffer.byteLength(zeile, "utf8") <= 75, `Zeile zu lang: ${zeile}`);
  const entfaltet = ics.replace(/\r\n[ \t]/g, "");
  assert.match(entfaltet, /SUMMARY:Coriolus \/ Schmetterlingstramete\\, Trametes\\; Test\\\\x nehmen/);
  assert.match(entfaltet, /DESCRIPTION:Danach im Begleiter abhaken\. Allgemeine Information\\, kein medizinischer Rat\./);
  assert.match(entfaltet, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\nPRODID:/);
  assert.match(entfaltet, /END:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR$/);
  assert.equal((entfaltet.match(/^UID:/gm) || []).length, 1);
});

test("Sicherung laden verwirft Ungültiges", () => {
  const ok = L.sicherungPruefen({plan: {pilz: "reishi", uhr: "08:00", wochen: 4, start: "2026-11-01"},
    einnahmen: {"2026-11-01": true, "kaputt": true, "2026-11-02": "ja"},
    eintraege: {"2026-11-01": {befinden: 4, vertraeglich: "etwas", notiz: "gut"}, "2026-11-02": {befinden: 0}}}, ["reishi"]);
  assert.equal(ok.plan.pilz, "reishi");
  assert.deepEqual(Object.keys(ok.einnahmen), ["2026-11-01"]);
  assert.deepEqual(Object.keys(ok.eintraege), ["2026-11-01"]);
  assert.equal(L.sicherungPruefen({plan: {pilz: "fliegenpilz", uhr: "08:00", wochen: 4, start: "2026-11-01"}}, ["reishi"]), null);
  assert.equal(L.sicherungPruefen("Unsinn", ["reishi"]), null);
});

test("Offline: alle Dateien der Hülle liegen im Service Worker", () => {
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const verweise = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]);
  for(const v of verweise) assert.ok(sw.includes(`"${v}"`), `${v} fehlt in sw.js`);
});

test("Texte: keine Heilversprechen, Hinweis „kein medizinischer Rat“ vorhanden", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8") + readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(html, /kein medizinischer Rat/i);
  for(const wort of [/heilt\b/i, /garantiert/i, /wirkt gegen/i, /stärkt (dein|das) Immunsystem/i, /hilft gegen/i])
    assert.doesNotMatch(html, wort);
});
