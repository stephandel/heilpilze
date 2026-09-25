# CLAUDE.md · Pilz Handel (Heilpilze)

Arbeitsgrundlage für KI-Sitzungen in diesem Repo. Kurz halten; Details stehen in
`README.md` und `pilzhandel/KONZEPT.md`. Regelherkunft: Pilot-Kern aus dem Projekt
„Web App Konfigurator“ (`data/pilot-core.json`, Stand 25.09.2026). Verantwortlich für
Inhalt, Code und diese Datei: Stephan Handel (allein, mit KI).

## Produktbrief

Diese App hilft **Einsteigern ohne Vorwissen** und **Menschen mit einem konkreten Anliegen**,
beim Thema Heilpilze einzuordnen, welche Wirkungsaussagen belegt sind und worauf sie bei
Sicherheit und Einkauf achten müssen.

- **Kernaufgabe:** Wirkungsaussagen zu 21 Pilzen nach Evidenzstufe einordnen (E/F/T/S,
  Punktwert 0–4), Wechselwirkungen prüfen, Einkauf vorbereiten.
- **Nutzeraufgaben:** verstehen, entscheiden, dokumentieren (Tagebuch, Arzt-Karte).
- **Grenze:** allgemeine Information. Keine individuelle Empfehlung, keine Diagnose, kein Verkauf.
- **Geschäftsmodell:** privat, ohne Werbung. Shop/Affiliate erst mit KONZEPT.md §6.

## Feste Rahmenbedingungen

- HTML/CSS/JS ohne Framework, ohne Build, ohne npm-Abhängigkeiten. Nichts davon einführen.
- GitHub Pages, alle Pfade relativ. Kein Tracking, keine Server-Daten, Nutzerdaten nur in `localStorage`.
- Einziger externer Laufzeitabruf: Fotos von Wikimedia Commons. Keine weiteren einführen.
- **Datenquelle ist `heilpilze.html`.** `pilzhandel/data.js` wird erzeugt, nie von Hand ändern:
  `node pilzhandel/tools/build-data.js`
- **Neues Foto (`imgs`/`HERO` in `tools/build-data.js`):** erst `node pilzhandel/tools/fetch-image-credits.js`
  (Urheber/Lizenz von Commons, schreibt `tools/image-credits.json`), dann `build-data.js`. Sonst
  fehlt der Nachweis (VIS-04) und der Test dazu schlägt fehl.
- Nach jeder Änderung an App-Dateien `VERSION` in `pilzhandel/sw.js` hochzählen.
- Studien-Radar: `node pilzhandel/tools/studien-radar.js [Tage]`. Treffer gelten als
  „nicht eingestuft“, bis sie in `heilpilze.html` bewertet sind.
- Vor jedem Commit: `node --test pilzhandel/tools/test.mjs`.

## Design

Stilwahl vom 25.09.2026 (Artifact „Stilwahl“). **Noch nicht in `app.css` umgesetzt**; dort und
in KONZEPT.md §3 steht noch die alte Palette „Waldboden“ (Creme, Erdbraun, Terrakotta).

- **Schrift:** Fraunces 600 für Überschriften, DM Sans für Text, lokal in `pilzhandel/fonts/`.
- **Palette „Pfifferling“:** Buttergelb, Oliv, Orange. Ecken 6 px (Karten) / 4 px (klein),
  Karten flach, Dichte normal.

| Token | Hell | Dunkel |
|---|---|---|
| bg / bg2 | `#FBF5E4` / `#F3EACF` | `#14140E` / `#1A1A12` |
| surface / surface2 | `#FFFDF6` / `#F6EDD6` | `#202016` / `#29291D` |
| ink / ink2 / ink3 | `#23241A` / `#575844` / `#88886F` | `#F2EEDC` / `#C9C3A6` / `#999379` |
| line | `#E8DDBE` | `#36352A` |
| brand / brandInk | `#2F3322` / `#FBF6E6` | `#F2EEDC` / `#1E1E14` |
| accent / accentBg | `#C9761A` / `#F8E2BE` | `#F0A850` / `#3A2C14` |
| moss / mossBg | `#667A36` / `#E7ECCF` | `#B8C985` / `#2A301B` |

Beim Umsetzen Kontrast prüfen: Text mindestens 4,5:1, große Schrift und Bedienelemente 3:1.
Verdächtig sind `ink3` auf `bg` und `accent` als Textfarbe im hellen Schema.

## Regeln (Pilot-Kern) und Ist-Stand

Stand der Prüfung: 25.09.2026, zuletzt aktualisiert nach Schritt 1–9 des Arbeitsplans
(Code-Durchsicht plus Browsertest der geänderten Abläufe; A11Y-03-Durchgang mit Werkzeug-
Grenzen, siehe KONZEPT.md §10. Schritt 5 ist Rechtsanalyse, keine Rechtsberatung, und wartet
auf echte Impressum-Daten. Schritt 8+9 sind Vorschläge mit Basiswerten, Ziele/Rhythmus muss
Stephan bestätigen oder anpassen — damit ist der komplette Arbeitsplan mindestens einmal
durchlaufen).
✅ erfüllt · 🟡 teilweise · ❌ offen. Eine Regel gilt erst als erfüllt, wenn der Nachweis vorliegt.

| Regel | Was sie hier konkret heißt | Stand | Nachweis / Lücke |
|---|---|---|---|
| PROD-01 Produktbrief | Satz oben ist die Messlatte für jede neue Funktion | ✅ | Diese Datei |
| PROD-04 Erfolg + Gegenindikator | Ohne Tracking: Inhaltsqualität messen statt Nutzung | 🟡 | `tools/kennzahlen.js` misst drei Zahlen aus vorhandenen Daten (Arbeitsplan-Schritt 8), Zielwerte als Vorschlag in `ZIELE` (Skript zeigt erreicht/verfehlt) und KONZEPT.md §11, Stephan muss nur noch bestätigen (`bestaetigt: true`). Fund: 11 von 21 Pilzen haben nur eine Quelle |
| UX-01 Zweck, Zustand, nächster Schritt | Jede Ansicht hat Eyebrow, Überschrift, Lead und leeren Zustand mit Handlung | ✅ | Beim A11Y-03-Durchgang (25.09.2026) auf Start, Katalog, Check, Tagebuch bestätigt: Eyebrow, Überschrift, Lead vor jedem Inhalt |
| UX-03 Fehler + sichere Aktionen | Löschen und Leeren rückgängig machbar; Fehlertexte nennen den nächsten Schritt | ✅ | Toast mit „Rückgängig“ für Tagebuch-Löschen, Check „Auswahl leeren“, Vergleich „Auswahl leeren“ (`toast(msg, {onUndo})` in `app.js`). Beim A11Y-03-Durchgang einen echten Fokus-Bug im Rückgängig-Knopf gefunden und behoben (siehe A11Y-02). Import-Fehlertext „Datei konnte nicht gelesen werden“ bleibt ohne Handlungshinweis – kleine Restlücke |
| DEPTH-02 Risiken am Handlungspunkt | Sicherheit und Evidenzstufe stehen dort, wo gekauft oder dosiert wird, nicht nur im Wissensbereich | ✅ | Beim A11Y-03-Durchgang bestätigt: „Sicherheit“-Karte auf der Detailseite steht direkt neben Kaufen/Dosierung, nicht hinter einem Klick. Check zeigt seinen Einschränkungshinweis dauerhaft |
| UI-03 Touch, Tastatur, Maus | Kein Kernvorgang hängt an Hover; alle Knöpfe per Tastatur erreichbar | ✅ | „Sicherung laden“ ist jetzt ein echter `<button id="dImpBtn">`, der den versteckten Datei-Input per Klick auslöst; im Accessibility-Tree als fokussierbarer Button bestätigt. `:hover`-Regeln in `app.css` sind reine Zusatzoptik, kein Kernvorgang hängt daran |
| COLOR-02 Farbe nie allein | Ampel, Stufen, Risiko immer mit Text oder Symbol | ✅ | Check zeigt Status als Text („Ärztlich abklären“ usw.), Stufen als Buchstabe. Nach Pfifferling-Umstellung erneut geprüft (Browser, hell+dunkel): unverändert, da Ampel/Stufen-Logik nicht an Tokens hängt |
| VIS-03 Textalternativen | Pilzfotos „Foto: Name“, Deko `alt=""`, Illustrationen `aria-hidden` | ✅ | `pimg()` in `app.js` |
| VIS-04 Bildrechte | Urheber und Lizenz je Foto nennen, nicht nur verlinken | ✅ | `tools/fetch-image-credits.js` holt Urheber und Lizenz von der Commons-API in `tools/image-credits.json`; `build-data.js` bettet sie als `PH.IMG_CREDITS` ein. `app.js` zeigt sie auf jeder Detailseite und beim Hero-Bild an (`imgCredit()`), alle 42 verwendeten Fotos haben einen Eintrag. Test prüft Vollständigkeit lokal, ohne Netzwerk |
| A11Y-02 Semantik, Fokus, Namen | Landmarks, Sprunglink, beschriftete Knöpfe, `aria-live` für Ergebnisse | ✅ | Datei-Input-Lücke aus UI-03 behoben. Fokus nach Seitenwechsel bestätigt (`main.focus()` in `app.js`). Fokus im Undo-Toast war kaputt (Rückgängig-Knopf bekam nie Fokus, weil der native Klick-Fokus des Auslöser-Knopfs ihn überschrieb) und ist jetzt behoben (`setTimeout(fn,0)`), plus Tab-Falle nach dem Ausblenden geschlossen. Formularfelder im Tagebuch per `element.labels` bestätigt korrekt beschriftet |
| A11Y-03 Manueller Test | Kernabläufe mit Tastatur, VoiceOver, 200 % Zoom | 🟡 | KONZEPT.md §10 (25.09.2026): Sprunglink, Seitenwechsel-Fokus, Textstufe A+ (140 %), Formularbeschriftung und Knopfnamen geprüft (Chrome-Automatisierung mit echten Klicks + Fokus-/Label-APIs). Dabei den A11Y-02-Fund oben gemacht. Nicht geprüft: echter Screenreader, schmaler Mobil-Viewport mit großer Schrift zusammen, echtes sequenzielles Durchtabben (Werkzeug-Grenzen, in KONZEPT.md §10 benannt). Handtest-Checkliste zum Abhaken in KONZEPT.md §12. Beim Abgleich gefunden und behoben: Escape schloss die Anzeige-Einstellungen, ließ aber `aria-expanded` auf true und den Fokus im Nichts |
| EXPLAIN-01 Kriterien offen | Anliegen-Finder, Top-Evidenz und Sortierung sagen in einem Satz, wonach sie ordnen | ✅ | Finder-Kachel hatte den Satz bereits. Ergänzt (25.09.2026, im Browser geprüft): „Am besten belegt“ auf der Startseite und die Sortierung im Katalog-Filter nennen jetzt je einen Satz, was „Evidenz“/„Risiken“ numerisch bedeutet (Punktwert aus `heilpilze.html`: score 0–4, risk 0–3). Shop-Liste: „Aufnahme heißt nicht …“ vorhanden |
| CONTENT-01 Zweck + Grenzen | „Allgemeine Information, keine Beratung“ auf Start, Detail und Check sichtbar | ✅ | Beim A11Y-03-Durchgang auf Start, Check und Detailseite bestätigt (Fußzeile auf jeder Seite, Check-Hinweistext). Nicht auf jeder einzelnen Unterseite geprüft |
| CONTENT-02 Herkunft + Stand | Verantwortlicher, Stand und Aktualisierungsregel je Pilz | 🟡 | Nur globaler Stand „September 2026“. Kein Datum je Pilz, kein Verantwortlicher genannt |
| CONTENT-03 Evidenz vs. Meinung vs. Werbung | E/F/T/S je Aussage; Shops klar als redaktionelle Auswahl | ✅ | Kern der App. Radar-Treffer als „nicht eingestuft“ markiert |
| CLAIM-02 Health Claims / HWG | Eigene Texte (Hero, Finder-Kacheln, Zusammenfassungen) auf Wirkversprechen prüfen | ✅ | KONZEPT.md §9 (25.09.2026): Hero, Finder, Zusammenfassungen, Shop- und Rezepttexte gegen Reizwortliste geprüft, keine Heilversprechen gefunden. Shop-Liste als verbleibendes Risiko benannt, keine Regel erzwingt das bisher, nur Gewohnheit. Keine Rechtsberatung |
| CLAIM-03 Aussagenregister | Jede Wirkungsaussage: Text, Stufe, Beleg, Stand | 🟡 | `effects` je Pilz haben Text, Stufe, Begründung. Quellen nur je Pilz, nicht je Aussage. Datenqualität jetzt per Test geprüft (TEST-01) |
| DQ-04 Fehler melden | Meldeweg in der App, Korrektur durch Stephan | ✅ | Link „Fehler melden“ im Fuß (jede Seite) und „Fehler bei diesem Pilz melden“ auf jeder Detailseite, beide öffnen ein vorausgefülltes GitHub-Issue (`issueUrl()` in `app.js`, Repo `stephandel/heilpilze`, Label `inhalt`). Korrekturverantwortung liegt bei Stephan, nicht weiter automatisiert |
| SYNC-03 Browser-Speicher | Hinweis „kann gelöscht werden, Sicherung speichern“ bei Tagebuch und Arzt-Karte | ✅ | Tagebuch hat Warnhinweis plus Export/Import. Arzt-Karte hat jetzt denselben Warnhinweis, als Sicherung dient der vorhandene „Drucken oder als PDF sichern“-Knopf (kein zusätzlicher JSON-Export gebaut, da die Karte für den Druck gedacht ist) (25.09.2026, im Browser geprüft) |
| LEGAL-01 Rechtsprofil | Einmal schriftlich: Betreiber, Zielmarkt DE, Datenarten, externe Abrufe, Impressumsfrage | 🟡 | KONZEPT.md §8 (25.09.2026): Profil geschrieben, Ergebnis **Impressum und Datenschutzerklärung sind vermutlich schon jetzt Pflicht** (nicht erst bei Verkauf, wie §6 bisher annahm), fehlen aber noch live auf der Seite. Entwürfe für beide liegen in §8 mit Platzhaltern. Impressum und Datenschutz sind als Ansichten gebaut (`#/impressum`, `#/datenschutz`, im Fuß verlinkt), Angaben kommen aus `pilzhandel/betreiber.js`. Fehlt nur: Name/Anschrift/E-Mail dort eintragen, `VERSION` in `sw.js` erhöhen; der todo-Test in `test.mjs` wird dann grün. Nicht nach `main` bringen, solange er todo ist. Keine Rechtsberatung |
| DOC-01 Doku im Repo | README, KONZEPT.md, CLAUDE.md bei jeder wesentlichen Änderung nachziehen | ✅ | CLAUDE.md nachgeführt. KONZEPT.md §3 war bereits aktuell (Palette Pfifferling seit Schritt 6). §5 (Funktionsliste) um Meldeweg, Rückgängig-Funktion, Bildrechte, Tests, Kennzahlen-Skript und Impressum/Datenschutz-Ansichten ergänzt (25.09.2026) |
| OPS-06 Pflegeplan | Fester Rhythmus für Radar, Inhalte, Links, Fotos | 🟡 | Rhythmus als Vorschlag dokumentiert (Arbeitsplan-Schritt 9), nicht automatisiert — Stephan muss ihn tatsächlich einhalten oder später die geplante GitHub Action (KONZEPT.md §5) bauen lassen |
| TEST-01 Tests nach Risiko | Tests für Check-Logik, Datenaufbereitung, Tagebuch-Import | ✅ | `pilzhandel/tools/test.mjs`, 20 Tests (einer todo, bis `betreiber.js` ausgefüllt ist), `node --test tools/test.mjs`. Prüft Datenqualität aller 21 Pilze (Stufen, Punktwert, Flags, Quellen), `checkHits()` (Stufe = Maximum, nicht Summe) und `parseDiaryImport()` (ungültige/doppelte Einträge, Wertebereiche). Beide Funktionen sind nach `pilzhandel/logic.js` ausgelagert und werden von `app.js` und dem Test benutzt, kein Kopie-Risiko |

## Arbeitsplan (Reihenfolge nach Schaden)

1. ✅ **Schutz, klein** (erledigt 25.09.2026): Rückgängig für Tagebuch-Löschen und „Auswahl leeren“
   (Check und Vergleich) über `toast(msg, {onUndo})`. Datei-Import ist jetzt ein echter `<button>`
   (`#dImpBtn`), der den versteckten Input auslöst. Warnhinweis zum Verlustrisiko im Tagebuch.
2. ✅ **Meldeweg (DQ-04)** (erledigt 25.09.2026): Link „Fehler melden“ im Fuß (`index.html`) und
   „Fehler bei diesem Pilz melden“ auf jeder Detailseite, beide zu vorausgefüllten GitHub-Issues.
3. ✅ **Tests (TEST-01)** (erledigt 25.09.2026): `pilzhandel/tools/test.mjs`, `node --test`. Prüft
   Datenqualität, `checkHits()` (Stufe = Maximum der Treffer) und `parseDiaryImport()` (verwirft
   ungültige Einträge). Die geprüfte Logik liegt in `pilzhandel/logic.js`, aus `app.js` ausgelagert,
   damit Test und App denselben Code laufen lassen statt einer Kopie.
4. ✅ **Bildrechte (VIS-04)** (erledigt 25.09.2026): `pilzhandel/tools/fetch-image-credits.js`
   fragt die Commons-API für alle in `build-data.js` verwendeten Fotos (Pilze + Hero) ab und
   schreibt `tools/image-credits.json`. `build-data.js` liest nur diesen Cache (kein
   Netzwerkzugriff beim normalen Bauen) und bettet ihn als `PH.IMG_CREDITS` in `data.js` ein.
   `app.js` zeigt Urheber und Lizenz auf jeder Detailseite und beim Hero-Bild. `HERO` liegt
   jetzt ebenfalls in `build-data.js` (vorher hart in `app.js` kodiert), damit eine einzige
   Quelle für „welche Fotos gibt es“ existiert. Ein Test prüft ohne Netzwerk, ob alle aktuell
   verwendeten Fotos einen Cache-Eintrag haben.
5. 🟡 **Rechtsprofil + Claims (LEGAL-01, CLAIM-02)** (Analyse erledigt 25.09.2026, Veröffentlichung
   offen): KONZEPT.md §8+§9. Wichtigster Fund: Impressum und Datenschutzerklärung sind nach
   dieser Einschätzung vermutlich **schon jetzt** Pflicht, nicht erst bei einem Verkauf — die
   Seite hat aktuell keines von beiden. Entwürfe mit Platzhaltern liegen in §8. Claims-Prüfung
   (Hero, Finder, Zusammenfassungen, Shops) fand keine Heilversprechen. **Nächster Schritt liegt
   bei Stephan:** Name, ladungsfähige Anschrift und E-Mail festlegen, dann Impressum- und
   Datenschutz-Ansicht in der App bauen und im Fuß verlinken (aus §5/§18 MStV folgt: leicht
   erkennbar, in höchstens zwei Klicks erreichbar — ein Absatz in KONZEPT.md reicht dafür nicht).
6. ✅ **Stil Pfifferling** (erledigt 25.09.2026): Tokens in `app.css` eingesetzt (Farben, Radius
   6/4/3 px statt 18/12/8 px, Schatten deutlich leiser für „Karten flach“). Kontrast für jede
   Text/Grund-Paarung mit der WCAG-Formel nachgerechnet, nicht nur geschätzt. Zwei Lücken dabei
   gefunden und behoben, die schon in der alten Palette latent oder durch die hellere
   Pfifferling-Akzentfarbe neu entstanden wären: weißer Buttontext auf der Akzentfarbe erreichte
   nur 3,45:1 (dunkel 2:1) statt 4,5:1 → neuer Token `--on-accent`, jetzt 4,55–7,78:1. Die
   Akzentfarbe selbst als Link-/Beschriftungstext auf hellem Grund erreichte nur 3,17:1 → neuer
   Token `--accent-ink`, jetzt 4,95:1. Beide nur in Zusammenhängen eingesetzt, wo vorher `accent`
   direkt als Text galt; Buttons/Icons/Ränder verwenden weiter die unveränderte Markenfarbe.
   Im Browser hell und dunkel auf Start, Katalog, Check und Detailseite geprüft, keine
   Konsolenfehler. KONZEPT.md §3 aktualisiert. Nebenbei mitgezogen, weil sonst inkonsistent:
   `logo.svg`-Wordmark, `manifest.webmanifest` und die `theme-color`-Meta-Tags in `index.html`
   trugen noch die alte Terrakotta/Erdbraun-Farbe.
   **Offen:** Die illustrierten Mushroom-Icons (`icon.svg`, PNG-Icons in `icons/`, die
   Fallback-Illustrationen in `app.js`) verwenden weiterhin ihre eigene braun/grüne
   Illustrationspalette, nicht die neuen Marken-Tokens — das ist Bildmaterial, kein
   Token-Austausch, und bewusst nicht angefasst.
7. 🟡 **A11Y-03-Durchgang** (erledigt 25.09.2026, mit offenen Punkten): Protokoll in KONZEPT.md
   §10. UX-01, DEPTH-02, CONTENT-01 dabei bestätigt. Dabei einen echten Fokus-Bug im
   Rückgängig-Knopf aus Schritt 1 gefunden und behoben (A11Y-02). Offen, weil mit den
   verfügbaren Werkzeugen nicht zu prüfen: echter Screenreader, schmaler Mobil-Viewport mit
   großer Schrift, echtes sequenzielles Durchtabben. Empfehlung: einmal von Hand an einem echten
   Telefon nachholen.
8. 🟡 **Kennzahlen (PROD-04), Vorschlag mit Basiswerten** (erledigt 25.09.2026, Ziele/Schwellen
   offen für Stephan): `pilzhandel/tools/kennzahlen.js` rechnet drei Zahlen direkt aus den
   vorhandenen Daten, ohne jede Form von Nutzer-Tracking:
   - Inhaltsumfang: Wirkungsaussagen und Quellen je Pilz (Basiswert 25.09.2026: 21 Pilze,
     Ø 6,3 Aussagen, Ø 2,4 Quellen je Pilz) — ein Rückgang würde auffallen, wenn ein neuer
     Pilz ohne genug Belege ergänzt wird.
   - Studien-Radar-Rückstand: noch nicht eingestufte Treffer und Alter des letzten Scans
     (Basiswert: 77 offene Treffer, Scan von gestern).
   - Gemeldete Inhaltsfehler über das `inhalt`-Label aus dem Meldeweg (Schritt 2): offen/erledigt
     und Ø Tage bis zur Korrektur, per `gh issue list`. Das Label existierte noch gar nicht im
     Repository — jetzt angelegt (`gh label create inhalt`), sonst wäre der Meldeweg gegen ein
     nicht vorhandenes Label gelaufen und hätte nie gefilterte Zahlen geliefert.
   **Nicht automatisch messbar**, weil dafür niemand Daten mitschreibt: der Gegenindikator
   (Anteil Meldungen, die eine T-/S-Aussage als Empfehlung missverstanden haben — beim Sichten
   von Hand einschätzen) und die Zeit von Radar-Treffer bis Einstufung (dafür müsste die PMID
   beim Einstufen in `heilpilze.html` vermerkt werden, macht das Skript nicht von selbst).
   **Offen, Entscheidung bei Stephan:** ob diese drei Zahlen die richtigen sind und welche
   Zielwerte/Schwellen gelten sollen — das Skript liefert nur die Messung, nicht das Urteil.
9. 🟡 **Pflegeplan (OPS-06), Vorschlag** (erledigt 25.09.2026, nicht automatisiert): monatlich
   `node pilzhandel/tools/kennzahlen.js` und `node pilzhandel/tools/studien-radar.js` laufen
   lassen, Treffer sichten; vierteljährlich Shop- und Infolinks in `tools/build-data.js` und
   `KONZEPT.md` auf tote Links prüfen; jährlich Einstufungen und Stand je Pilz erneuern, dabei
   `data-2026-09` als grobe Marke im Kopf behalten. **Bewusst nicht gebaut:** eine GitHub Action,
   die das monatliche Radar automatisch laufen lässt und einen Pull Request öffnet, steht schon
   als eigener Punkt in KONZEPT.md §5 (Stufe 2) — das ist ein eigenständiges Feature mit eigenen
   Fragen (PubMed-Ratenlimits, Bot-Rechte zum Öffnen von PRs), keine Nebenarbeit dieses Schritts.

Nach jedem erledigten Punkt die Tabelle oben aktualisieren.
