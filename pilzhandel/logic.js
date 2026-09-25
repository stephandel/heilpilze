/* ---------- Reine Logik, ohne DOM ---------- */
/* Ausgelagert aus app.js, damit tools/test.mjs sie ohne Browser prüfen kann.
   Nichts hier darf `document`, `window` oder `localStorage` verwenden. */

/* Wechselwirkungs-Check: welche ausgewählten Flags ein Pilz trifft und die
   höchste betroffene Stufe (0 kein Konflikt, 1 beachten, 2 ärztlich abklären). */
function checkHits(mushroomFlags, selectedKeys){
  const hits = selectedKeys.filter(k => mushroomFlags[k]).map(k => ({k, v: mushroomFlags[k]}));
  return {hits, lvl: hits.reduce((a, h) => Math.max(a, h.v), 0)};
}

/* Tagebuch-Import: nur Einträge mit bekanntem Pilz, gültigem Datum und ohne
   Dopplung zum bestehenden Log übernehmen; Felder auf sichere Typen/Bereiche zwingen. */
function parseDiaryImport(data, existingLog, isValidId){
  return ((data && data.diary) || [])
    .filter(x => x && isValidId(x.m) && /^\d{4}-\d{2}-\d{2}$/.test(x.d) && !existingLog.some(y => y.t === x.t))
    .map(x => ({
      t: +x.t || Date.now() + Math.random(),
      d: x.d,
      m: x.m,
      p: String(x.p || ""),
      a: String(x.a || ""),
      s: Math.min(5, Math.max(1, +x.s || 3)),
      n: String(x.n || "")
    }));
}

if(typeof module !== "undefined" && module.exports){
  module.exports = { checkHits, parseDiaryImport };
}
