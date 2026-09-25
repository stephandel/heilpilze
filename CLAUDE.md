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
- Nach jeder Änderung an App-Dateien `VERSION` in `pilzhandel/sw.js` hochzählen.
- Studien-Radar: `node pilzhandel/tools/studien-radar.js [Tage]`. Treffer gelten als
  „nicht eingestuft“, bis sie in `heilpilze.html` bewertet sind.

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

Stand der Prüfung: 25.09.2026, zuletzt aktualisiert nach Schritt 1–3 des Arbeitsplans
(Code-Durchsicht plus Browsertest der geänderten Abläufe, kein vollständiger A11Y-03-Durchgang).
✅ erfüllt · 🟡 teilweise · ❌ offen. Eine Regel gilt erst als erfüllt, wenn der Nachweis vorliegt.

| Regel | Was sie hier konkret heißt | Stand | Nachweis / Lücke |
|---|---|---|---|
| PROD-01 Produktbrief | Satz oben ist die Messlatte für jede neue Funktion | ✅ | Diese Datei |
| PROD-04 Erfolg + Gegenindikator | Ohne Tracking: Inhaltsqualität messen statt Nutzung | ❌ | Kennzahlen festlegen, siehe Arbeitsplan |
| UX-01 Zweck, Zustand, nächster Schritt | Jede Ansicht hat Eyebrow, Überschrift, Lead und leeren Zustand mit Handlung | 🟡 | Muster vorhanden (Check, Vergleich); je Ansicht beim A11Y-03-Durchgang abhaken |
| UX-03 Fehler + sichere Aktionen | Löschen und Leeren rückgängig machbar; Fehlertexte nennen den nächsten Schritt | ✅ | Toast mit „Rückgängig“ für Tagebuch-Löschen, Check „Auswahl leeren“, Vergleich „Auswahl leeren“ (`toast(msg, {onUndo})` in `app.js`), im Browser geprüft. Import-Fehlertext „Datei konnte nicht gelesen werden“ bleibt ohne Handlungshinweis – kleine Restlücke |
| DEPTH-02 Risiken am Handlungspunkt | Sicherheit und Evidenzstufe stehen dort, wo gekauft oder dosiert wird, nicht nur im Wissensbereich | 🟡 | Check sagt „Fehlende Daten heißen nicht sicher“. Detailseite (Kaufen/Dosierung) und Shop-Liste noch nicht geprüft |
| UI-03 Touch, Tastatur, Maus | Kein Kernvorgang hängt an Hover; alle Knöpfe per Tastatur erreichbar | ✅ | „Sicherung laden“ ist jetzt ein echter `<button id="dImpBtn">`, der den versteckten Datei-Input per Klick auslöst; im Accessibility-Tree als fokussierbarer Button bestätigt. `:hover`-Regeln in `app.css` sind reine Zusatzoptik, kein Kernvorgang hängt daran |
| COLOR-02 Farbe nie allein | Ampel, Stufen, Risiko immer mit Text oder Symbol | ✅ | Check zeigt Status als Text („Ärztlich abklären“ usw.), Stufen als Buchstabe. Nach Pfifferling-Umstellung erneut prüfen, auch dunkel |
| VIS-03 Textalternativen | Pilzfotos „Foto: Name“, Deko `alt=""`, Illustrationen `aria-hidden` | ✅ | `pimg()` in `app.js` |
| VIS-04 Bildrechte | Urheber und Lizenz je Foto nennen, nicht nur verlinken | 🟡 | Link zur Commons-Dateiseite je Foto. CC BY/BY-SA verlangt Urheber und Lizenzname sichtbar; Hero-Bilder ohne Nachweis. Lösung: Urheber + Lizenz in `build-data.js` holen und anzeigen |
| A11Y-02 Semantik, Fokus, Namen | Landmarks, Sprunglink, beschriftete Knöpfe, `aria-live` für Ergebnisse | 🟡 | Weitgehend vorhanden, Datei-Input-Lücke aus UI-03 behoben. Fokus nach Seitenwechsel und Fokus im Undo-Toast noch nicht geprüft |
| A11Y-03 Manueller Test | Kernabläufe mit Tastatur, VoiceOver, 200 % Zoom | ❌ | Kein vollständiges Protokoll. Abläufe: Anliegen → Pilz → Detail; Check; Tagebuch-Eintrag + Sicherung; Arzt-Karte drucken |
| EXPLAIN-01 Kriterien offen | Anliegen-Finder, Top-Evidenz und Sortierung sagen in einem Satz, wonach sie ordnen | 🟡 | Methode im Wissensbereich erklärt; direkt an Finder und Sortierung fehlt der Satz. Shop-Liste: „Aufnahme heißt nicht …“ vorhanden |
| CONTENT-01 Zweck + Grenzen | „Allgemeine Information, keine Beratung“ auf Start, Detail und Check sichtbar | 🟡 | Steht in „Über“ und im Fuß; Check verweist auf ärztliche Abklärung. Auf Detailseite prüfen |
| CONTENT-02 Herkunft + Stand | Verantwortlicher, Stand und Aktualisierungsregel je Pilz | 🟡 | Nur globaler Stand „September 2026“. Kein Datum je Pilz, kein Verantwortlicher genannt |
| CONTENT-03 Evidenz vs. Meinung vs. Werbung | E/F/T/S je Aussage; Shops klar als redaktionelle Auswahl | ✅ | Kern der App. Radar-Treffer als „nicht eingestuft“ markiert |
| CLAIM-02 Health Claims / HWG | Eigene Texte (Hero, Finder-Kacheln, Zusammenfassungen) auf Wirkversprechen prüfen | ❌ | Rechtslage für Produkte erklärt, eigene Formulierungen nicht geprüft. Ergebnis mit Datum hier festhalten |
| CLAIM-03 Aussagenregister | Jede Wirkungsaussage: Text, Stufe, Beleg, Stand | 🟡 | `effects` je Pilz haben Text, Stufe, Begründung. Quellen nur je Pilz, nicht je Aussage. Datenqualität jetzt per Test geprüft (TEST-01) |
| DQ-04 Fehler melden | Meldeweg in der App, Korrektur durch Stephan | ✅ | Link „Fehler melden“ im Fuß (jede Seite) und „Fehler bei diesem Pilz melden“ auf jeder Detailseite, beide öffnen ein vorausgefülltes GitHub-Issue (`issueUrl()` in `app.js`, Repo `stephandel/heilpilze`, Label `inhalt`). Korrekturverantwortung liegt bei Stephan, nicht weiter automatisiert |
| SYNC-03 Browser-Speicher | Hinweis „kann gelöscht werden, Sicherung speichern“ bei Tagebuch und Arzt-Karte | 🟡 | Tagebuch hat jetzt Warnhinweis plus Export/Import (im Browser geprüft). Arzt-Karte weiterhin ohne Hinweis und ohne Sicherung |
| LEGAL-01 Rechtsprofil | Einmal schriftlich: Betreiber, Zielmarkt DE, Datenarten, externe Abrufe, Impressumsfrage | ❌ | Offen. Klären lassen: Anbieterkennzeichnung nach MStV auch ohne Geschäftsmäßigkeit; Weitergabe der IP beim Foto-Abruf an Wikimedia |
| DOC-01 Doku im Repo | README, KONZEPT.md, CLAUDE.md bei jeder wesentlichen Änderung nachziehen | 🟡 | CLAUDE.md nachgeführt. KONZEPT.md §3 weiterhin veraltet (Palette), §5 (Funktionsliste) nicht um logic.js/Meldeweg ergänzt |
| OPS-06 Pflegeplan | Fester Rhythmus für Radar, Inhalte, Links, Fotos | ❌ | Vorschlag im Arbeitsplan |
| TEST-01 Tests nach Risiko | Tests für Check-Logik, Datenaufbereitung, Tagebuch-Import | ✅ | `pilzhandel/tools/test.mjs`, 17 Tests, `node --test tools/test.mjs`. Prüft Datenqualität aller 21 Pilze (Stufen, Punktwert, Flags, Quellen), `checkHits()` (Stufe = Maximum, nicht Summe) und `parseDiaryImport()` (ungültige/doppelte Einträge, Wertebereiche). Beide Funktionen sind nach `pilzhandel/logic.js` ausgelagert und werden von `app.js` und dem Test benutzt, kein Kopie-Risiko |

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
4. **Bildrechte (VIS-04):** Urheber und Lizenz beim Build aus der Commons-API holen, unter jedem Foto zeigen.
5. **Rechtsprofil + Claims (LEGAL-01, CLAIM-02):** als Abschnitt in KONZEPT.md, mit Datum und offenen Punkten.
6. **Stil Pfifferling:** Tokens oben in `app.css` einsetzen, Kontrast prüfen, KONZEPT.md §3 anpassen.
7. **A11Y-03-Durchgang:** Protokoll als kurze Liste in KONZEPT.md; UX-01, DEPTH-02, CONTENT-01 dabei mit abhaken.
8. **Kennzahlen (PROD-04), Vorschlag:** Anteil Aussagen mit Beleg je Aussage; Radar-Treffer
   innerhalb von 30 Tagen eingestuft; Zahl gemeldeter Fehler und Zeit bis zur Korrektur.
   Gegenindikator: Meldungen, die eine T- oder S-Aussage als Empfehlung verstanden haben.
9. **Pflegeplan (OPS-06), Vorschlag:** monatlich Radar laufen lassen und sichten; vierteljährlich
   Shop- und Infolinks prüfen; jährlich Einstufungen und Stand je Pilz erneuern.

Nach jedem erledigten Punkt die Tabelle oben aktualisieren.
