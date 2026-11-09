/* Pilz-Begleiter · reine Logik, ohne DOM */
/* Wird von app.js und tools/test.mjs benutzt. Nichts hier darf `document`, `window` oder `localStorage` verwenden.
   Datumsangaben sind Kalendertage als Text "JJJJ-MM-TT" in Ortszeit, damit Sommerzeit nichts verschiebt. */

const TAG_MS = 86400000;

function datumText(d){
  const z = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
function tagNummer(text){
  const [j, m, t] = text.split("-").map(Number);
  return Math.round(Date.UTC(j, m - 1, t) / TAG_MS);
}
function tageZwischen(von, bis){ return tagNummer(bis) - tagNummer(von); }
function plusTage(text, n){
  const d = new Date((tagNummer(text) + n) * TAG_MS);
  const z = x => String(x).padStart(2, "0");
  return `${d.getUTCFullYear()}-${z(d.getUTCMonth() + 1)}-${z(d.getUTCDate())}`;
}
function gueltigeUhr(u){ return typeof u === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(u); }

/* Plan aus den drei Schritten; Dauer nur 4 oder 8 Wochen wie im Entwurf. */
function planAnlegen({pilz, uhr, wochen, start, erinnern = true, befinden = true}){
  if(!pilz) throw new Error("Pilz fehlt");
  if(!gueltigeUhr(uhr)) throw new Error("Uhrzeit ungültig");
  if(![4, 8].includes(+wochen)) throw new Error("Dauer muss 4 oder 8 Wochen sein");
  return {pilz, uhr, wochen: +wochen, start, erinnern: !!erinnern, befinden: !!befinden, pause: false, beendet: null};
}

/* Wo steht der Plan heute? tag ist 1-basiert, woche ebenfalls. */
function planStand(plan, heute){
  const dauer = plan.wochen * 7;
  const tag = tageZwischen(plan.start, heute) + 1;
  const vorStart = tag < 1;
  const fertig = !!plan.beendet || tag > dauer;
  const t = Math.min(Math.max(tag, 1), dauer);
  return {tag: t, woche: Math.ceil(t / 7), wochen: plan.wochen, dauer, vorStart, fertig,
    rueckblick4: tag > 28, rueckblick8: tag > 56, restTage: Math.max(0, dauer - tag)};
}

/* Nächste Erinnerung als Date (Ortszeit) oder null. Heute nur, wenn die Uhrzeit noch kommt und noch nicht genommen. */
function naechsteErinnerung(plan, jetzt, genommenHeute){
  if(!plan || !plan.erinnern || plan.pause || plan.beendet) return null;
  const [h, m] = plan.uhr.split(":").map(Number);
  const heute = datumText(jetzt);
  const ende = plusTage(plan.start, plan.wochen * 7 - 1);
  let tag = tageZwischen(plan.start, heute) < 0 ? plan.start : heute;
  const zeitHeute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate(), h, m);
  if(tag === heute && (genommenHeute || zeitHeute <= jetzt)) tag = plusTage(heute, 1);
  if(tageZwischen(tag, ende) < 0) return null;
  const [j, mo, t] = tag.split("-").map(Number);
  return new Date(j, mo - 1, t, h, m);
}

/* Rückblick über die ersten n Wochen, gezählt bis heute (nicht in die Zukunft). */
function rueckblick(plan, einnahmen, eintraege, wochen, heute){
  const dauer = wochen * 7;
  const bisher = Math.min(dauer, Math.max(0, tageZwischen(plan.start, heute) + 1));
  let genommen = 0, eintr = 0;
  const summe = Array(wochen).fill(0), anzahl = Array(wochen).fill(0);
  for(let i = 0; i < bisher; i++){
    const d = plusTage(plan.start, i);
    if(einnahmen[d]) genommen++;
    const e = eintraege[d];
    if(e && e.befinden >= 1 && e.befinden <= 5){ eintr++; summe[Math.floor(i / 7)] += e.befinden; anzahl[Math.floor(i / 7)]++; }
  }
  return {tage: bisher, genommen, eintraege: eintr,
    mittel: summe.map((s, i) => anzahl[i] ? Math.round(s / anzahl[i] * 10) / 10 : null)};
}

/* Kalender-Erinnerung (.ics): täglich zur Uhrzeit, für die Dauer des Plans, mit Hinweis 0 Minuten vorher.
   Ortszeit ohne Zeitzone ("floating"), damit sie im Urlaub zur gewohnten Uhrzeit kommt. */
function icsErinnerung(plan, pilzName, jetzt = new Date()){
  const d = plan.start.replace(/-/g, ""), u = plan.uhr.replace(":", "") + "00";
  const stempel = jetzt.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const [h, m] = plan.uhr.split(":").map(Number);
  const endeMin = h * 60 + m + 5;
  const z = n => String(n).padStart(2, "0");
  const bis = endeMin >= 1440 ? "235900" : z(Math.floor(endeMin / 60)) + z(endeMin % 60) + "00";
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Heilpilze//Pilz-Begleiter//DE", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:begleiter-${plan.pilz}-${d}@heilpilze`, `DTSTAMP:${stempel}`,
    `DTSTART:${d}T${u}`, `DTEND:${d}T${bis}`, `RRULE:FREQ=DAILY;COUNT=${plan.wochen * 7}`,
    `SUMMARY:${pilzName} nehmen (Pilz-Begleiter)`,
    "DESCRIPTION:Danach im Begleiter abhaken. Allgemeine Information\\, kein medizinischer Rat.",
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${pilzName} nehmen`, "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}

/* Sicherung laden: nur bekannte Felder, ungültige Tage werden verworfen. Gibt null zurück, wenn nichts Brauchbares drin ist. */
function sicherungPruefen(daten, bekanntePilze){
  if(!daten || typeof daten !== "object") return null;
  const tagOk = k => /^\d{4}-\d{2}-\d{2}$/.test(k);
  const out = {plan: null, einnahmen: {}, eintraege: {}};
  const p = daten.plan;
  if(p && bekanntePilze.includes(p.pilz) && gueltigeUhr(p.uhr) && [4, 8].includes(p.wochen) && tagOk(p.start || ""))
    out.plan = {pilz: p.pilz, uhr: p.uhr, wochen: p.wochen, start: p.start, erinnern: !!p.erinnern, befinden: p.befinden !== false,
      pause: !!p.pause, beendet: tagOk(p.beendet || "") ? p.beendet : null};
  for(const [k, v] of Object.entries(daten.einnahmen || {})) if(tagOk(k) && v === true) out.einnahmen[k] = true;
  for(const [k, v] of Object.entries(daten.eintraege || {})){
    if(!tagOk(k) || !v || !Number.isInteger(v.befinden) || v.befinden < 1 || v.befinden > 5) continue;
    out.eintraege[k] = {befinden: v.befinden,
      vertraeglich: ["keine", "etwas", "beschwerden"].includes(v.vertraeglich) ? v.vertraeglich : null,
      notiz: typeof v.notiz === "string" ? v.notiz.slice(0, 500) : ""};
  }
  if(!out.plan && !Object.keys(out.einnahmen).length && !Object.keys(out.eintraege).length) return null;
  return out;
}

const BegleiterLogik = {datumText, tageZwischen, plusTage, gueltigeUhr, planAnlegen, planStand, naechsteErinnerung, rueckblick, icsErinnerung, sicherungPruefen};
if(typeof module !== "undefined") module.exports = BegleiterLogik;
else globalThis.BegleiterLogik = BegleiterLogik;
