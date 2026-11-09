# Prüfung Pilz-Begleiter (Stufe 1) – Fable, 09.11.2026

Zweite Meinung zum Nachtlauf von Opus (`BERICHT-BEGLEITER-2026-11-09.md`). Geprüft 04:02–05:25 Uhr in der Arbeitskopie
`/Users/stephanhandel/KI Projekte/_Arbeitskopien/heilpilze-begleiter`, Zweig `begleiter-2026-11-09`. Auftrag war, die
Behauptungen zu widerlegen; echte Fehler habe ich direkt auf dem Zweig behoben (6 eigene Commits, nichts hochgeladen).

## Ergebnis in zwei Sätzen
Die Logik rechnet richtig und die Tests sind echt (6 von 6 absichtlich eingebauten Fehlern werden rot), aber der Opus-Stand hatte
ein hohes Risiko – Kalender-Datei und Sicherung liefen über einen Download-Link, der in der iPhone-Home-Bildschirm-App
erfahrungsgemäß still nichts tut – sowie drei echte Bedienfehler, zwei Tippflächen unter 44 px, 12-px-Schrift im Diagramm und
eine Kalender-Datei, die die Längen-/Maskierungsregeln des Standards verletzte. Alles davon ist behoben und in WebKit (iPhone-15-
Emulation, hell und dunkel) nachgeprüft; **bereit für den iPhone-Test: ja** – der Kalenderweg in der installierten App ist dort
Prüfschritt 1, weil er sich nur am Gerät beweisen lässt.

## Behauptungen → Ergebnis
| Behauptung (Opus-Bericht) | Ergebnis | Beleg |
|---|---|---|
| 9 Tests grün | bestätigt | `node --test begleiter/tools/test.mjs` 9/9; jetzt 10/10 (ein Test ergänzt) |
| Alte Tests 33 grün, 1 todo, nichts kaputt | bestätigt | `node --test pilzhandel/tools/test.mjs pilzhandel/tools/sw-speicher.test.mjs` → tests 34, pass 33, todo 1 (Impressum, wie bisher) |
| (implizit) Tests prüfen wirklich etwas | bestätigt | Scratchpad-Kopie, 6 Mutationen in `logik.js` (Tagesdifferenz +1, COUNT ×6, „genommen“ ignoriert, Ende ≥ statt >, Pilzprüfung weg, LF statt CRLF) → jede macht 1–4 Tests rot |
| Datumsrechnung sicher über Zeitumstellung, Jahreswechsel, Schaltjahr | bestätigt | Kalendertage als UTC-Tagesnummer (`logik.js` 11–20), Tests 24.→26.10., 28.→30.03., 30.12.→02.01., 28.02.2028→29.02. |
| Erinnerungszeit heute/morgen/vor Start/nach Ende/Pause | bestätigt | `naechsteErinnerung` + Test; Uhrzeit nach Mitternacht (00:30 um 23:50 → morgen 00:30) am Code nachvollzogen |
| Rückblick zählt nur bis heute, mittelt je Woche | bestätigt | Test; fehlende Tage werden einfach nicht gezählt (keine Division durch 0, `null` → „–“ im Diagramm, Bild `10-rueckblick-beispiel-*.png`) |
| Kalender-Datei gültig | **teilweise widerlegt** | CRLF, VCALENDAR/VEVENT, UID, DTSTAMP (UTC), RRULE, VALARM waren ok. Aber: DESCRIPTION-Zeile 89 Byte (RFC 5545: höchstens 75, dann falten), keine Maskierung von `, ; \` in Namen, bei 23:55–23:59 Uhr Ende = Start (Safari lehnt solche Termine ab). Behoben, Commit 18041e9 |
| Erinnerung über Kalender-Datei funktioniert | **für die Home-Bildschirm-App nicht haltbar** | Blob-Download über `<a download>` tut in installierten Web-Apps auf iOS nichts (Apple-Forum 95911 „Impossible to download a file on PWA“, WebKit-Bug 275288 „Installed PWA not downloading“). Betraf auch „Sicherung speichern“. Abhilfe eingebaut (Teilen-Blatt in der installierten App, Commits 337d506 + ae402e4), am Gerät nicht prüfbar |
| Text „Kalender-Datei, die du mit einem Tipp übernimmst“ | widerlegt (Text) | Realer Weg: Datei laden/sichern, öffnen, in den Kalender übernehmen – mehrere Tipps. Text ehrlich umformuliert (337d506) |
| Keine Schrift unter 16 px | **widerlegt** | Opus-Messung hatte `<svg>` ausgeschlossen: Diagrammschrift 12 px (effektiv 12,3 px am iPhone 15). Jetzt 16 px (37bcc0b), Nachher-Messung: keine Schrift < 16 px |
| Tippflächen ≥ 44 px überall außer den Schaltern | **widerlegt in WebKit** | `<select>` „Ausprobieren für“ 108×23 px (WebKit ignoriert `min-height` beim Standard-Auswahlfeld; Chrome nicht, deshalb bei Opus unauffällig), Steckbrief-Link „Alle Aussagen …“ 333×20 px. Beide behoben (37bcc0b); Nachher: nur noch die Schalter 51×31 (ganze Zeile tippbar, wie behauptet) |
| Kontrast nicht gerechnet (Opus sagt das selbst) | nachgerechnet | Hell: alle Textpaare ≥ 4,5:1 außer text3 auf akzent-hg 4,32:1 (Untertitel im gewählten Pilz) → text2 (5,76:1, 37bcc0b); hg auf moos 4,38:1 nur Haken-Glyphe/Initial (Bedienelement, 3:1 reicht). Dunkel: alles ≥ 5,3:1. Linien 1,33:1 sind Deko, Felder durch Hintergrund/Text erkennbar |
| Offline alle 21 Pilze | bestätigt, auch WebKit | Emulation: SW aktiv, `setOffline`, Reload → 21 Kacheln (hell und dunkel); Atlas und Steckbrief nutzen keine Fotos, also keine Bildfrage |
| Keine Konsolenfehler | bestätigt für gesunde Daten | WebKit hell/dunkel ohne Fehler. Mit kaputten Speicherdaten TypeError und leerer Atlas (siehe F5, behoben) |
| Safe Areas und Statusleiste `default` | bestätigt im Code; **Risiko Statusleiste** | Titel lag 10–16 px unter der Statusleiste; iOS 27 zeichnet in der installierten App bis ~33 pt weich (Bibliothek Teil C Nr. 1, 36 px am 06.11. am Gerät bestätigt). Kopf in `display-mode: standalone` 36 px tiefer (37bcc0b), am Gerät nicht geprüft |
| Browser-Klickweg, Speicherung nach Reload, Offline (Chrome) | bestätigt | Opus-Skript `begleiter/tools/browser-pruefung.cjs` mit dem Endstand erneut gelaufen: keine Fehler, `.ics`-Download hell/dunkel, Daten nach Reload da, offline 21 |
| Git: 4 Commits auf main c760377, nichts gepusht, keine Bilder | bestätigt | `merge-base main HEAD` = c760377 = `origin/main`; `git ls-remote --heads origin` ohne Begleiter-Zweig; `pruefung/` untracked (jetzt in `.gitignore`); kein Beifang in den 4 Commits (Entwurf-HTML ist gewollt) |
| „Rückgängig“ wirklich rückgängig (Plan beenden, Sicherung laden) | bestätigt am Code | Zustand vorher gemerkt und zurückgeschrieben; Grenze: nächster Hinweis (Toast) ersetzt den Rückgängig-Knopf – wie in der Haupt-App |
| Heilversprechen-Prüfung | bestätigt, Test ist nur grob | Reizwortliste mit 5 Mustern; eigene Texte von mir gegengelesen: Steckbrief, Plan, Tagebuch, Rückblick neutral; Mengen kommen aus `data.js` mit „Maßgeblich ist die Angabe auf deiner Packung“ und Link zur Quellenseite |

## Funde
| Nr. | Schwere | Wo | Was | Status / Commit |
|---|---|---|---|---|
| F1 | hoch | `begleiter/app.js` `datei()` Z. 43–55 | Kalender-Datei und Sicherung nur per `<a download>` (Blob): in der iOS-Home-Bildschirm-App ohne Wirkung. Der Hauptweg der Erinnerung hing daran | behoben: in der installierten App Web Share mit Datei (Bibliothek M105), sonst Download; Share-Fehler → Download. WebKit-Stub: share() erhält `erinnerung-reishi.ics` (489 Byte, `text/calendar`) bzw. die JSON-Sicherung. 337d506, ae402e4. **Am Gerät prüfen** |
| F2 | mittel | `app.js` Z. 307–308 | Rückkehr in die App (visibilitychange) zeichnete neu und löschte Gesicht + Notiz eines ungespeicherten Tagebuch-Eintrags | behoben: nur bei Tageswechsel neu zeichnen. WebKit vorher `notiz:""`, nachher Entwurf erhalten. ed12213 |
| F3 | mittel | `app.js` Z. 99 | „Plan mit X anlegen“ im Steckbrief führte nach abgeschlossenem Plan auf „Plan abgeschlossen“ statt in den Assistenten | behoben (`S.neu = true`). WebKit vorher „Reishi – fertig“, nachher „Welchen Pilz möchtest du ausprobieren?“. ed12213 |
| F4 | mittel | `app.js` Z. 127, Toasts | Kalender-Serie läuft bei Pause, Planende und Uhrzeitwechsel weiter; App sagte „Keine weitere Erinnerung“ | behoben: Hinweise an allen drei Stellen. 337d506 |
| F5 | mittel | `app.js` `laden()` Z. 21–29 | Speicher wurde ungeprüft übernommen; unbekannte Pilz-ID (z. B. nach Datenpflege) oder Befinden 9 → TypeError, Atlas leer (nachgestellt) | behoben: `laden()` prüft wie eine Sicherung, meldet entfernten Plan. WebKit vorher 0 Kacheln + pageerror, nachher 21 ohne Fehler. ed12213 |
| F6 | mittel | `begleiter/sw.js` | Falle 97 (umgeleitete Antworten im Cache) nicht abgefangen – auf GitHub Pages unkritisch (kein Redirect), bei Umzug auf Cloudflare schwarze Seite nach Neustart | **offen**, hängt an Stephans Hosting-Entscheidung; gleiches Muster wie `pilzhandel/sw.js`, dann beide zusammen härten (Muster `Bibliothek/module/offline/sw.js`) |
| F7 | mittel | `begleiter.css` Z. 48 | Titel in der installierten App im Weichzeichner-Streifen von iOS 27 | behoben nach Bibliotheksregel (36 px nur bei `display-mode: standalone`), am Gerät nicht geprüft. 37bcc0b |
| F8 | niedrig | `logik.js` `icsErinnerung` Z. 76–99 | Zeilenlänge, Maskierung, Ende = Start | behoben, Tests vorher rot. 18041e9 |
| F9 | niedrig | `begleiter.css` Z. 132 | 12-px-Schrift im Rückblick-Diagramm | behoben (16 px). 37bcc0b |
| F10 | niedrig | `app.js` Z. 130, 221 | „kein medizinischer Rat“ fehlte in der aktiven Plan-Ansicht; im Tagebuch nur bei „Beschwerden“ sichtbar | behoben. 337d506 |
| F11 | niedrig | `begleiter.css` Z. 95, 104; `app.js` Z. 91 | Kontrast 4,32:1 im gewählten Pilz; `<select>` 23 px in WebKit; Steckbrief-Link 20 px | behoben. 37bcc0b |
| F12 | niedrig | `app.js` Z. 113 | „noch 1 Tage“, „noch 0 Tage“ am letzten Tag | behoben („noch 1 Tag“, „heute ist der letzte Tag“), WebKit bestätigt. 337d506 |
| F13 | niedrig | `.gitignore` | `pruefung/` mit Bildschirmfotos nicht ignoriert | behoben. f54feac |
| F14 | Hinweis | Design | Pause zählt die Plantage weiter; der Rückblick zählt Pausentage als „nicht abgehakt“ | Entscheidung Stephan (so lassen oder Pause als Unterbrechung rechnen) |
| F15 | Hinweis | iOS | `window.print()` („Drucken oder als PDF“) in der Home-Bildschirm-App vermutlich ohne Funktion; im Safari-Tab ok | nur am Gerät prüfbar |
| F16 | Hinweis | `logik.js` `sicherungPruefen` | Datumsprüfung nur per Muster (2026-13-45 würde durchgehen); führt nicht zum Absturz, `Date` normalisiert | nicht geändert |
| F17 | Hinweis | Test „Texte“ | Reizwortliste klein (5 Muster), eher Rauchmelder als Prüfung | nicht geändert; Texte von Hand gegengelesen |

Widerlegte eigene Annahme: Ich hatte zuerst das Teilen-Blatt für alle Touch-Geräte eingebaut (337d506). Im Safari-Tab ist der
Download aber der kürzere Weg (Download-Pfeil → Datei → Kalender), und die WebKit-Emulation zeigte, dass `share()` dort still
„erfolgreich“ meldet, ohne dass etwas passiert. Deshalb ae402e4: Teilen nur in der installierten App.

## Geprüft
- `node --test begleiter/tools/test.mjs`: Opus-Stand 9/9; nach Testerweiterung 8/10 (Kalender rot); nach Fix 10/10.
- `node --test pilzhandel/tools/test.mjs pilzhandel/tools/sw-speicher.test.mjs`: 33 grün, 1 todo, vor und nach meinen Änderungen.
- Mutationstest an einer Kopie im Scratchpad: 6 von 6 Mutationen erkannt.
- WCAG-Kontrast aller Text/Grund-Paare hell und dunkel per Formel (Node-Skript), ICS-Struktur per Skript (CRLF, Byte-Länge je Zeile, Pflichtfelder, DTEND).
- Pilzdaten: 21 Einträge, alle Felder, die der Begleiter nutzt, vorhanden; keine Namen mit `, ; \`.
- Playwright WebKit 1.64.1 (aus `Wetter Apps/Wetterlage`), Gerät „iPhone 15“, hell und dunkel, vorher/nachher: Klickweg Atlas → Steckbrief → 3 Schritte → Plan → Kalender-Download → Haken → Tagebuch → Rückblick (Tag 1 und 20 Tage Beispieldaten, 4 und 8 Wochen) → letzter/vorletzter Tag → Plan fertig → offline; Messung Tippflächen und Schriftgrößen (svg mitgerechnet); Reproduktionen F2/F3/F5; Teilen-Stub nach Bibliothek Falle 265 (Datei, Typ, Inhalt, Rückfall). Bilder: `_Arbeitskopien/heilpilze-begleiter/pruefung/fable/vorher/` (30) und `…/nachher/` (30), angesehen: Plan aktiv, Schritt 2, Steckbrief, Rückblick hell/dunkel.
- Chrome-Skript von Opus (`begleiter/tools/browser-pruefung.cjs`) mit dem Endstand: keine Fehler.
- Git: Zweig, Basis, Remote, Index, Binärdateien; jeder Fund als eigener Commit mit gezieltem `git add`, Arbeitsbaum sauber.

## Offen
- Nur am Gerät prüfbar: Kalender-Datei aus der installierten App (Teilen-Blatt → Dateien → Kalender) und aus dem Safari-Tab (Download → Kalender), Doppelimport nach Uhrzeitwechsel (gleiche UID), Drucken, Statusleiste (36 px), Dunkelmodus, Teilen-Blatt für die Sicherung.
- F6 (Service Worker gegen Umleitungen härten) – erst nach der Hosting-Entscheidung.
- F14 Pausen-Logik, F16/F17 Kleinigkeiten.
- Nicht geprüft: echter Screenreader, Tastaturbedienung durchgetabbt, Druckansicht.

## Nächster Schritt
1. Stephan entscheidet Frage 1 des Opus-Berichts (wie online: A GitHub Pages `heilpilze/begleiter/`, B privates Artefakt, C warten); Merge nur mit Okay.
2. iPhone-Test über den Prüfstand, Schritt 1 = Kalender-Erinnerung aus der Home-Bildschirm-App (und zum Vergleich aus dem Safari-Tab), dann die sechs Schritte aus dem Opus-Bericht.
3. Bei Merge: `VERSION` in `begleiter/sw.js` steht auf `pb-v2`; bei weiteren Änderungen hochzählen.

## Vorschlag für die Bibliothek (nicht eingetragen, Entscheidung Hauptsitzung)
- Falle: **WebKit/Safari ignoriert `min-height` beim Standard-`<select>`** (23 px hoch, Chrome hält 44 px) – `appearance:none` plus eigener Pfeil, dann greift die Höhe. Fundstelle `begleiter/begleiter.css` Z. 104, 09.11.2026.
- Falle: **Datei an den Nutzer in der iOS-Home-Bildschirm-App**: `<a download>` mit Blob tut nichts (Apple-Forum 95911, WebKit 275288); Web Share mit `File` nur dort, im Browser-Tab Download lassen. In der Playwright-WebKit-Emulation meldet `navigator.share()` still Erfolg – als Prüfung nur mit Stub (Falle 265) brauchbar. Fundstelle `begleiter/app.js` `datei()`, 09.11.2026.
- Regel: **Schriftmessung muss `<svg>`-Text mitrechnen** (Skalierung viewBox → tatsächliche Breite), sonst rutschen Diagrammbeschriftungen durch. Fundstelle `pruefung`-Skript dieser Prüfung.

## Ergebnisse
- Dieser Bericht: `/Users/stephanhandel/KI Projekte/Heilpilze/PRUEFUNG-FABLE-BEGLEITER-2026-11-09.md`
- Zweig `begleiter-2026-11-09` in `/Users/stephanhandel/KI Projekte/_Arbeitskopien/heilpilze-begleiter`, 10 Commits auf c760377 (6 von mir: ed12213, 18041e9, 337d506, 37bcc0b, f54feac, ae402e4), nicht gepusht.
- Bildschirmfotos: `/Users/stephanhandel/KI Projekte/_Arbeitskopien/heilpilze-begleiter/pruefung/fable/vorher/` und `…/nachher/` (lokal, per `.gitignore` ausgeschlossen).
- Prüfskripte (Scratchpad, nicht im Repo): `/private/tmp/claude-501/-Users-stephanhandel-KI-Projekte/9f78a17e-7afc-49bb-a107-39be6f6d31ce/scratchpad/webkit-pruefung.cjs`, `…/share-diag.cjs`, Ergebnisse `…/webkit-vorher.json`, `…/webkit-nachher.json`.
