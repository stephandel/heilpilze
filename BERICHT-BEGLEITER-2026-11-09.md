# Bericht Begleiter – 09.11.2026, Nachtlauf (Opus baut)

Kurz: Der „Pilz-Begleiter“ aus dem Entwurf vom 04.11. ist als Stufe 1 gebaut und funktioniert im Browser (Chrome) hell und dunkel, auch ohne Internet. Er liegt auf einem eigenen Zweig, ist **nicht hochgeladen und nicht live**. Am echten iPhone ist er noch nicht geprüft.

## Geändert
- **Zweig:** `begleiter-2026-11-09` (von `main` c760377), Arbeitskopie `/Users/stephanhandel/KI Projekte/_Arbeitskopien/heilpilze-begleiter`
- **Commits:**
  - 78f9f50 Entwurf vom 04.11. als Vorlage übernommen (`entwuerfe/begleiter-mockup-2026-11-04.html`, gleiche Datei wie auf dem alten Zweig `begleiter-entwurf`)
  - 789b0a6 Reine Logik `begleiter/logik.js`: Plan anlegen, Stand (Tag/Woche/Ende), nächste Erinnerungszeit, Rückblick je Woche, Kalender-Datei, Sicherung prüfen
  - 9077493 App `begleiter/` (index.html, app.js, begleiter.css, sw.js, manifest.webmanifest) + 9 Tests `begleiter/tools/test.mjs`
  - a96816b README-Abschnitt, Browser-Prüfskript `begleiter/tools/browser-pruefung.cjs`, Datumsspalte im Tagebuch breiter
- **Umgesetzt mit deinen Entscheidungen vom 03.11.:** Plan Schritt für Schritt (3 Fragen), danach Übersicht mit Haken „Heute genommen?“; Tagebuch ein Tipp (5 Gesichter), Verträglichkeit und Notiz freiwillig; Erinnerung über eine Kalender-Datei; Rückblick neutral („zeigt, wie es dir ging – nicht, warum“, „empfiehlt nichts“).
- **Weitere Inhalte:** Atlas mit allen 21 Pilzen (Daten aus `pilzhandel/data.js`, nichts neu geschrieben), Steckbrief mit Sicherheit und Mengen aus den vorhandenen Daten plus Link zur vollen Pilzseite, Hinweis „Allgemeine Information, kein medizinischer Rat“ im Atlas, Steckbrief, Plan, Tagebuch (bei „Beschwerden“: Einnahme beenden und ärztlich abklären) und Rückblick. Pause, Plan beenden (mit Rückgängig), Sicherung speichern/laden (mit Rückgängig), Drucken/PDF fürs Arztgespräch, Hinweis „Zum Home-Bildschirm“.
- **Ehrliche Grenze:** Der Begleiter schickt keine Mitteilungen von selbst. Das ginge am iPhone nur mit einem Server für Push-Nachrichten. Stufe 1 nutzt deshalb für alle die Kalender-Erinnerung (täglich zur gewählten Uhrzeit bis Planende).
- **Bibliothek:** Falle 274 in `Bibliothek Web Apps/module/INVENTAR.md` (Playwright lädt bei nur geändertem `#` nicht neu; Falle 80 erneut bestätigt).
- Nicht angefasst: Hauptordner, `pilzhandel/`, `heilpilze.html`, `entwuerfe/` im Hauptordner, `_privat/`.

## Geprüft
- `node --test begleiter/tools/test.mjs` → **9 von 9 grün** (Datumsrechnung über Zeitumstellung und Jahreswechsel, Plan-Eingaben, Planstand/Ende, Erinnerungszeiten heute/morgen/vor Start/nach Ende/Pause, Rückblick nur bis heute, Kalender-Datei, Sicherung verwirft Ungültiges, alle Dateien im Offline-Speicher, keine Heilversprechen-Wörter + Hinweis vorhanden). Vorher rot: die Offline- und Text-Tests, solange die App fehlte; ein Planstand-Test war rot wegen eines Fehlers im Test selbst (korrigiert).
- `node --test pilzhandel/tools/test.mjs pilzhandel/tools/sw-speicher.test.mjs` → 33 grün, 1 todo (Impressum, wie bisher), nichts kaputt.
- Browser (Chrome headless, 500 px, hell und dunkel): Klickweg Atlas → Reishi → Plan Schritt 1–3 → Plan steht → Kalender-Datei heruntergeladen (`erinnerung-reishi.ics`) → abgehakt → Tagebuch-Eintrag gespeichert → nach Neuladen noch da. Mit 20 Tagen Beispieldaten: Atlas mit Planband, Plan, Tagebuch, Rückblick. **Offline:** nach Abschalten des Netzes lädt die Seite mit allen 21 Pilzen. **Keine Konsolenfehler.**
- Messung im Browser: **keine Schrift unter 16 px** (nach Korrektur; vorher waren Reiterleiste, Überschriften-Zeile, Gesichter-Beschriftung und lateinische Namen 12–14 px). **Tippflächen ≥ 44 px** überall außer den Schaltern selbst (51×31 px wie bei iOS); dafür ist jetzt die ganze 52 px hohe Zeile mit Beschriftung antippbar. Safe Areas: Kopf, Inhalt, Reiterleiste und Meldung rechnen `env(safe-area-inset-*)` ein (nur im Code geprüft, Simulator nicht genutzt).
- Gefunden und behoben: leerer schwarzer Balken unten (Meldung blieb trotz `hidden` sichtbar).
- 24 Bildschirmfotos: `/Users/stephanhandel/KI Projekte/_Arbeitskopien/heilpilze-begleiter/pruefung/` (angesehen: Atlas, Plan, Tagebuch, Rückblick hell/dunkel; nicht eingecheckt).
- **Nicht geprüft:** echtes iPhone, Safari/WebKit, Kalender-Datei in der iPhone-Kalender-App, Drucken aus der Home-Bildschirm-App, Farbkontrast per Rechnung (Farben aus Entwurf/App übernommen, dunkles `text3` ist heller als in der App). Keine zweite Meinung eingeholt (nichts geht nach außen).

## Offen – Entscheidungen für Stephan (Vorschlag als Auswahl)
1. **Wie geht der Begleiter online?**
   - A: als eigener Bereich `heilpilze/begleiter/` auf GitHub Pages (Merge auf `main` = sofort live, noindex ist drin) – **Empfehlung A**, erst nach deinem iPhone-Test.
   - B: vorher als privates Artefakt zum Ansehen.
   - C: noch warten.
2. **Echte Mitteilungen (Push) für Stufe 2?**
   - A: nein, Kalender-Erinnerung reicht – **Empfehlung A** (kein Server, keine Kosten, keine Daten außer Haus).
   - B: ja, mit dem Push-Baustein aus der Bibliothek (M71, Cloudflare) – braucht Server und Datenschutztext.
3. **Atlas doppelt?** Der Begleiter hat einen kleinen Atlas, die volle Pilzseite bleibt im Pilz Handel.
   - A: so lassen, Begleiter verlinkt für Details – **Empfehlung A**.
   - B: Begleiter als Reiter in den Pilz Handel einbauen (eine App statt zwei).
4. **Alter Zweig `begleiter-entwurf`** (nur der Entwurf, jetzt auch in diesem Zweig): löschen? **Empfehlung ja, nach dem Merge** – nur mit deinem Okay.

## Offen – iPhone-Schritte (für den Prüfstand, je Ja/Nein)
1. Begleiter-Seite in Safari öffnen, Plan mit einem Pilz in 3 Schritten anlegen. *Hat das ohne Hängen geklappt?* Ja/Nein
2. „Kalender-Erinnerung speichern“ tippen und in den Kalender übernehmen. *Steht die Erinnerung jeden Tag zur Uhrzeit im Kalender?* Ja/Nein
3. Über Teilen → „Zum Home-Bildschirm“ legen und von dort öffnen. *Ist oben und unten nichts abgeschnitten, Statusleiste lesbar?* Ja/Nein
4. Flugmodus an, Begleiter vom Home-Bildschirm öffnen. *Erscheinen die 21 Pilze und dein Plan?* Ja/Nein
5. Haken setzen, Tagebuch-Eintrag speichern, App schließen und neu öffnen. *Sind Haken und Eintrag noch da?* Ja/Nein
6. iPhone auf Dunkelmodus stellen. *Ist alles gut lesbar?* Ja/Nein

## Nächster Schritt
Stephan entscheidet Frage 1 und macht die iPhone-Schritte (dafür braucht es eine erreichbare Fassung – also zuerst Frage 1 A oder B). Danach: Merge auf `main` (nur mit Okay), `VERSION` in `begleiter/sw.js` bei jeder weiteren Änderung hochzählen.
