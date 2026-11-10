// durchschein.mjs – M132: Scheint gerollter Inhalt durch schwebende Leisten (Glas-Kopf, Tab-Leiste, Streifen unter der Statusleiste)?
// Regel: Hinter einer schwebenden Leiste darf kein Text lesbar sein (Stephan, Fasten am iPhone „Inhalt scheint oben durch“, 10.11.2026).
// Verfahren: Bereich der Leiste zweimal fotografieren – mit Inhalt darunter und mit ausgeblendetem Inhalt (visibility: hidden) – und Pixel vergleichen.
// Unterschied = was durchscheint. Playwright (WebKit/Chromium), ohne weitere Abhängigkeit: PNG wird in der Seite per <canvas> gelesen.
// Hinweis: Playwright-WebKit zeichnet backdrop-filter oft nicht → strenger als das iPhone (dort weichgezeichnet, aber große Schrift bleibt erkennbar).
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// bereiche: [{ name, oben, unten }] in CSS-Pixeln des Fensters (volle Breite); inhalt: Auswahl für alles, was rollt (z. B. 'main')
// Rückgabe je Bereich: { name, anteil (0–1 der Pixel mit deutlicher Abweichung), schlimmste (größte Kanal-Abweichung) }
export async function durchschein(seite, { bereiche, inhalt = 'main', bilder = '', praefix = 'durch', schwelleKanal = 40 } = {}) {
  const breite = seite.viewportSize().width;
  const aus = [];
  for (const b of bereiche) {
    const clip = { x: 0, y: Math.max(0, b.oben), width: breite, height: Math.max(1, b.unten - Math.max(0, b.oben)) };
    const mit = await seite.screenshot({ clip, animations: 'disabled' });
    await seite.evaluate(sel => document.querySelectorAll(sel).forEach(e => { e.dataset.durchVorher = e.style.visibility; e.style.visibility = 'hidden'; }), inhalt);
    const ohne = await seite.screenshot({ clip, animations: 'disabled' });
    await seite.evaluate(sel => document.querySelectorAll(sel).forEach(e => { e.style.visibility = e.dataset.durchVorher || ''; delete e.dataset.durchVorher; }), inhalt);
    if (bilder) { mkdirSync(bilder, { recursive: true }); writeFileSync(join(bilder, `${praefix}-${b.name}.png`), mit); }
    const m = await seite.evaluate(async ([a, c, schwelle]) => {
      const lies = async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const k = document.createElement('canvas'); k.width = i.width; k.height = i.height; const x = k.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
      const p = await lies(a), q = await lies(c);
      let viel = 0, max = 0;
      for (let j = 0; j < p.length; j += 4) {
        const d = Math.max(Math.abs(p[j] - q[j]), Math.abs(p[j + 1] - q[j + 1]), Math.abs(p[j + 2] - q[j + 2]));
        if (d > max) max = d;
        if (d > schwelle) viel++;
      }
      return { anteil: viel / (p.length / 4), schlimmste: max };
    }, [mit.toString('base64'), ohne.toString('base64'), schwelleKanal]);
    aus.push({ name: b.name, anteil: Math.round(m.anteil * 10000) / 10000, schlimmste: m.schlimmste });
  }
  return aus;
}

// Bereiche aus den Leisten selbst: oben von 0 bis Unterkante der Kopfzeile (inkl. Streifen unter der Statusleiste), unten von Oberkante der Tab-Leiste bis Fensterende
export async function leistenBereiche(seite, { kopf = '.titelzeile', leiste = '.tab-leiste' } = {}) {
  return seite.evaluate(([kopf, leiste]) => {
    const r = s => { const e = document.querySelector(s); if (!e || getComputedStyle(e).display === 'none') return null; return e.getBoundingClientRect(); };
    const k = r(kopf), l = r(leiste), aus = [];
    if (k) aus.push({ name: 'oben', oben: 0, unten: Math.round(k.bottom) });
    if (l && l.top > innerHeight / 2) aus.push({ name: 'unten', oben: Math.round(l.top), unten: innerHeight });
    return aus;
  }, [kopf, leiste]);
}
