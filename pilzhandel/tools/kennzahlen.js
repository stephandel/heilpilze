// Kennzahlen-Basiswerte (PROD-04), rein aus vorhandenen Daten berechnet, keine Nutzer-Messung
// (die App hat kein Tracking). Ersetzt keine Entscheidung über Ziele/Schwellen — das bleibt bei
// Stephan, siehe CLAUDE.md. Aufruf: node pilzhandel/tools/kennzahlen.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execSync } = require("child_process");
const root = path.join(__dirname, "..");

function loadWindowScript(file){
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
  return sandbox.window;
}

// Zielwerte: VORSCHLAG vom 25.09.2026, von Stephan noch nicht bestätigt. Bestätigen = `bestaetigt`
// auf true setzen; Zahlen ändern ist ausdrücklich erlaubt. Begründung in KONZEPT.md §11.
const ZIELE = {
  bestaetigt: false,
  quellenJePilzMin: 2,        // kein Pilz soll sich auf nur eine einzige Quelle stützen
  radarMaxAlterTage: 45,      // monatlicher Pflegerhythmus plus zwei Wochen Puffer
  meldungMaxTageBisKorrektur: 14,
  meldungMaxOffen: 3
};
const ziel = ok => (ok ? "  ✓ Ziel erreicht" : "  ✗ Ziel verfehlt") + (ZIELE.bestaetigt ? "" : " (Zielwert nur Vorschlag)");

const PH = loadWindowScript("data.js").PH;
const RD = loadWindowScript("radar.js").PH_RADAR;

console.log("Pilz Handel · Kennzahlen-Basiswerte\n");

// 1. Inhaltsumfang: Datenqualität ist über tools/test.mjs bereits als Pass/Fail geprüft
// (jeder Pilz hat gültige Stufen, Quellen, Flags). Hier zusätzlich die rohen Zahlen, damit
// ein Rückgang über die Zeit auffällt (z. B. wenn ein neuer Pilz ohne genug Quellen ergänzt wird).
const totalSources = PH.MUSHROOMS.reduce((n, m) => n + m.sources.length, 0);
const totalEffects = PH.MUSHROOMS.reduce((n, m) => n + m.effects.length, 0);
console.log(`Pilze: ${PH.MUSHROOMS.length}`);
console.log(`Wirkungsaussagen gesamt: ${totalEffects}, Ø ${(totalEffects / PH.MUSHROOMS.length).toFixed(1)} je Pilz`);
console.log(`Quellen gesamt: ${totalSources}, Ø ${(totalSources / PH.MUSHROOMS.length).toFixed(1)} je Pilz`);
const thin = PH.MUSHROOMS.filter(m => m.sources.length < ZIELE.quellenJePilzMin);
console.log(`Pilze mit weniger als ${ZIELE.quellenJePilzMin} Quellen: ${thin.length}` + (thin.length ? ` (${thin.map(m => m.id).join(", ")})` : ""));
console.log(ziel(thin.length === 0));

// 2. Studien-Radar: wie viele neue Treffer warten noch auf Einstufung, wie alt ist der Scan.
if(RD){
  const pending = Object.values(RD.items).reduce((n, i) => n + i.count, 0);
  const ageDays = Math.round((Date.now() - new Date(RD.stand + "T12:00").getTime()) / 864e5);
  console.log(`\nStudien-Radar: ${pending} noch nicht eingestufte Treffer, Stand vor ${ageDays} Tag(en) (${RD.stand})`);
  console.log(ziel(ageDays <= ZIELE.radarMaxAlterTage) + ` · Abfrage höchstens ${ZIELE.radarMaxAlterTage} Tage alt`);
  // Die Trefferzahl selbst bekommt bewusst keinen Zielwert: studien-radar.js merkt sich nicht,
  // welche Treffer schon gesichtet sind, sie sinkt also nicht durch Sichten.
} else {
  console.log("\nStudien-Radar: radar.js nicht gefunden oder leer.");
}

// 3. Gemeldete Inhaltsfehler (DQ-04): über das Label "inhalt" auf GitHub Issues, das der
// Meldeweg aus der App setzt. Nur ausführbar mit `gh` CLI und Zugriff auf das Repo.
try{
  const open = JSON.parse(execSync('gh issue list --repo stephandel/heilpilze --label inhalt --state open --json number,createdAt', { encoding: "utf8" }));
  const closed = JSON.parse(execSync('gh issue list --repo stephandel/heilpilze --label inhalt --state closed --json number,createdAt,closedAt', { encoding: "utf8" }));
  const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  const avgDaysToClose = closed.length
    ? (closed.reduce((n, i) => n + days(i.createdAt, i.closedAt), 0) / closed.length).toFixed(1)
    : null;
  console.log(`\nGemeldete Inhaltsfehler: ${open.length} offen, ${closed.length} erledigt` +
    (avgDaysToClose ? `, Ø ${avgDaysToClose} Tage bis zur Korrektur` : ""));
  console.log(ziel(open.length <= ZIELE.meldungMaxOffen && (avgDaysToClose === null || +avgDaysToClose <= ZIELE.meldungMaxTageBisKorrektur)) +
    ` · höchstens ${ZIELE.meldungMaxOffen} offen, Ø höchstens ${ZIELE.meldungMaxTageBisKorrektur} Tage bis zur Korrektur`);
} catch(e){
  console.log("\nGemeldete Inhaltsfehler: nicht abrufbar (gh CLI fehlt oder kein Netzwerk).");
}

console.log("\nNicht automatisch messbar, weil dafür keine Daten mitgeschrieben werden:");
console.log("- Anteil Meldungen, die eine T- oder S-Aussage als Empfehlung missverstanden haben");
console.log("  (Gegenindikator zu PROD-04) — beim Sichten der Meldungen von Hand einschätzen.");
console.log("- Zeit von Studien-Radar-Treffer bis Einstufung in heilpilze.html — dafür müsste");
console.log("  beim Einstufen das PMID im Commit oder in heilpilze.html vermerkt werden.");
