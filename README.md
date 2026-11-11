# Heilpilze

Zwei Ansichten auf denselben Datenbestand: ein Nachschlagewerk als einzelne HTML-Seite und
eine installierbare Webapp. Keine Abhängigkeiten, kein Build, kein Tracking.

**Live:** https://stephandel.github.io/heilpilze/

## Nachschlagewerk

[`heilpilze.html`](heilpilze.html) — leitet seit 11.11.2026 zu Pilz Handel weiter (war nicht fürs iPhone
gebaut: seitlich verschiebbar, kleine Tippflächen, kein Dunkelmodus). `#m-<id>` führt auf die Pilzseite.
Die Datei bleibt die Datenquelle für `pilzhandel/data.js`; zum Ansehen der alten Seite die Umleitung
im Kopf auskommentieren.

- 21 in Deutschland kaufbare Heil- und Vitalpilze (Reishi, Shiitake, Coriolus, Austernpilz,
  Hericium, Cordyceps, Agaricus, Maitake, Chaga, Judasohr, Eichhase, Schopftintling,
  Silberohr, Phellinus, Poria, Antrodia, Krause Glucke, Enoki, Champignon, Zunderschwamm,
  Lärchenschwamm)
- Jede Wirkungsaussage einzeln eingestuft: **E** evidenzbasiert (RCT/Meta-Analyse),
  **F** Forschung (Labor, Tier, Pilotstudie), **T** TCM/Tradition, **S** Sonstige/Marketing
- Punktwert 0–4 für die Humanevidenz, Sicherheitshinweise, Dosierung, Inhaltsstoffe,
  Quellenlinks pro Pilz
- Volltextsuche mit Hervorhebung, Filter nach Anwendungsgebiet und Evidenzstufe,
  Mindest-Evidenz, Sortierung, Karten- oder Tabellenansicht
- Nachschlageteil: Bewertungsmethode, Einkaufskriterien (Pulver/Extrakt/Myzel),
  Wechselwirkungen, Rechtslage (Health Claims, Novel Food)

Alle Daten stecken in `MUSHROOMS` und `REFERENCE` im `<script>`-Block der Datei.

## Pilz Handel (Webapp)

[`pilzhandel/`](pilzhandel/) — https://stephandel.github.io/heilpilze/pilzhandel/

Dieselben Daten im Stil moderner Vitalpilz-Shops, aber mit Evidenz statt Werbeversprechen.
Konzept und Ausbauplan: [`pilzhandel/KONZEPT.md`](pilzhandel/KONZEPT.md).

- Startseite mit Anliegen-Finder, Katalog mit Filtern, Detailseite pro Pilz
- Wechselwirkungs-Check (14 Medikamente und Umstände), Vergleich von bis zu 3 Pilzen,
  teilbare Merkliste
- Einkaufs-Checkliste, kuratierte Shops und seriöse Infoseiten
- Rezepte mit Speisepilzen, druckbare Arzt-Karte, Einnahme-Tagebuch mit Kalender-Erinnerung
- Studien-Radar mit neuen PubMed-Treffern pro Pilz (noch nicht eingestuft)
- Toolbar mit Suche und Live-Vorschlägen, Textgröße in 5 Stufen, Hell/Dunkel/Auto
- Offlinefähig und installierbar (PWA)
- Fotos von Wikimedia Commons; fehlt ein Foto, erscheint eine Illustration
- Urheber und Lizenz je Foto sichtbar, nicht nur verlinkt (`pilzhandel/tools/fetch-image-credits.js`)
- Schriften lokal eingebunden, kein Abruf bei Google

## Pilz-Begleiter (Stufe 1, Zweig `begleiter-2026-11-09`, noch nicht live)

[`begleiter/`](begleiter/) — eigener Plan mit einem Pilz, tägliches Abhaken, Tagebuch, Rückblick.

- Atlas mit den 21 Pilzen aus `pilzhandel/data.js` (Steckbrief, Sicherheit, Link zur vollen Seite)
- Plan in 3 Schritten (Pilz, Uhrzeit, 4 oder 8 Wochen), danach Übersicht mit Haken für heute
- Erinnerung als Kalender-Datei (.ics, täglich bis Planende); echte Mitteilungen bräuchten einen Server
- Tagebuch: Befinden in 5 Stufen, Verträglichkeit und Notiz freiwillig, Sicherung als Datei
- Rückblick nach 4/8 Wochen, neutral („zeigt, wie es dir ging – nicht, warum“), Druck/PDF
- Daten nur in `localStorage` (`pb-v1`), offline per `begleiter/sw.js` (`VERSION` bei Änderungen hochzählen)
- Tests: `node --test begleiter/tools/test.mjs`; Browser: `python3 -m http.server 8817`, dann
  `node begleiter/tools/browser-pruefung.cjs pruefung` (nutzt Playwright aus `Wetter Apps/Wetterlage`)

## Herkunft

Diese Dateien lagen bis zum 24. September 2026 im Repository
[`stephandel/scheinfasten`](https://github.com/stephandel/scheinfasten) und sind dort aus
der Scheinfasten-Kur-Seite herausgewachsen. Sie haben inhaltlich nichts damit zu tun und
wurden deshalb in ein eigenes Projekt gelegt. Die alten Adressen unter
`/scheinfasten/heilpilze.html` und `/scheinfasten/pilzhandel/` leiten hierher weiter, damit
bereits installierte Apps und gesetzte Lesezeichen weiter funktionieren. Die
Versionsgeschichte bis zu diesem Schnitt steht weiterhin im alten Repository.

## Ändern

Alle Pfade im Projekt sind relativ — es läuft an jeder Adresse und auch lokal per
Doppelklick. Nach einer Änderung an den App-Dateien die Zahl in `VERSION` in
`pilzhandel/sw.js` hochzählen, sonst sehen installierte Kopien die Änderung erst später.

- Daten ändern: in `heilpilze.html` (Pilze) bzw. `pilzhandel/tools/build-data.js` (App-Zusätze, Rezepte),
  dann `node pilzhandel/tools/build-data.js`
- Neues Foto hinzugefügt oder entfernt (`imgs`/`HERO` in `pilzhandel/tools/build-data.js`):
  danach `node pilzhandel/tools/fetch-image-credits.js` (holt Urheber/Lizenz von Wikimedia
  Commons, schreibt `pilzhandel/tools/image-credits.json`), erst dann `build-data.js`
- Studien-Radar aktualisieren: `node pilzhandel/tools/studien-radar.js [Tage]`, Treffer sichten,
  `pilzhandel/radar.js` committen
- Tests laufen lassen: `node --test pilzhandel/tools/test.mjs`
- Kennzahlen-Basiswerte ansehen: `node pilzhandel/tools/kennzahlen.js` (Inhaltsumfang,
  Studien-Radar-Rückstand, gemeldete Inhaltsfehler; siehe `CLAUDE.md`, Regel PROD-04)
