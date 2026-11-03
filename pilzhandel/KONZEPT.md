# Pilz Handel · Konzept für die Webapp

Stand: 24. September 2026

## 1. Idee in einem Satz

Pilz Handel ist die unabhängige Anlaufstelle für Heilpilze: Jede Wirkungsbehauptung ist nach ihrer besten Quelle eingestuft. Dazu gibt es praktische Werkzeuge für Sicherheit und Einkauf.

Die Lücke im Markt: Shops wie smaints verkaufen gut gemachte Produkte mit schönem Storytelling. Behörden wie die Verbraucherzentrale oder der Krebsinformationsdienst warnen trocken. Dazwischen fehlt eine Seite, die beides verbindet: schön, alltagstauglich, ehrlich.

## 2. Was wir von smaints.de lernen

Die Seite selbst ließ sich aus der Arbeitsumgebung nicht öffnen, weil die Netzwerkfreigabe den Zugriff sperrt. Die Punkte stammen aus Suchergebnissen, Shop-Einträgen und Erfahrungsberichten.

| smaints macht | Was wir daraus machen |
|---|---|
| Heilpilze **in den Alltag holen** (Drinks, Flüssigextrakt, Kaffee statt Kapseln) | Rubrik „Frisch kaufen statt Kapseln“ und Speisepilz-Hinweise pro Pilz; später Rezepte |
| Produktlinien nach **Tageszeit und Bedürfnis** (Day, Night, Focus) | Finder nach Anliegen auf der Startseite (13 Kacheln) |
| **Transparenz** als Verkaufsargument: EU-Herkunft, Bio, laborgeprüft, Polysaccharidgehalt | Einkaufs-Checkliste und Shop-Auswahl nach genau diesen Kriterien |
| **Markengeschichte** („small saints“, der Aztekenname für Pilze) | Eigene Geschichte: Handel ist der Familienname. Persönlich statt Konzern, das Wortspiel „mit Wissen handeln“ gibt es gratis dazu |
| **Help-Center, Blog, Erfahrungsseite, Presse, Broschüre** | Wissensbereich mit FAQ, Methode und Rechtslage; Blog als nächste Stufe |
| **Bundles und Starter-Sets** | Vergleich von bis zu 3 Pilzen und teilbare Merkliste als „Starter-Set“ |
| Warme Naturfotografie, weiche Farben, runde Formen, große Schrift | Übernommen: Cremetöne, Erdbraun, Terrakotta-Akzent, Fraunces und DM Sans, runde Karten |
| **Social Proof** mit über 2.000 Bewertungen | Bewusst **nicht** kopiert: Wir fälschen keine Bewertungen. Vertrauen entsteht über Quellen und die Evidenzanzeige. |

Wo wir uns absetzen: smaints wirbt mit Wirkung, wir ordnen Wirkung ein. Das ist das Alleinstellungsmerkmal.

## 3. Design

- **Farben (Stand 25.09.2026, Palette „Pfifferling“):** Buttergelb `#FBF5E4` als Grund, dunkles
  Oliv `#2F3322` für Marke und Fließtext, Orange `#C9761A` als Akzent, dasselbe Moosgrün wie
  vorher für „belegt“. Im Dunkelmodus warme Braun-Schwarztöne statt kaltem Grau. Ecken 6 px auf
  Karten, 4 px auf kleinen Elementen (vorher 18/12/8 px), Karten flach — sie stützen sich auf den
  Rahmen, nicht auf Schatten. Abgelöst: die Palette „Waldboden“ (Creme `#F7F1E8`, Erdbraun
  `#3A2A1F`, Terrakotta `#B4602E`), Auswahl und alle Werte in `CLAUDE.md`.
  Für Buttons und Fließtext auf der Akzentfarbe reicht die reine Akzentfarbe nicht für 4,5:1
  Kontrast (WCAG AA) — deshalb zwei zusätzliche, aus ihr abgeleitete Token: `--accent-ink` für
  Links/Beschriftungen auf hellem Grund, `--on-accent` für Text auf der Akzentfarbe selbst
  (Buttons, Badges). Beide in `app.css` dokumentiert und gegen alle Text/Grund-Paarungen
  gegengerechnet (WCAG-Kontrastformel, kein automatisiertes Tool).
- **Schrift:** Fraunces, eine weiche Serifenschrift, für Überschriften und das Logo. DM Sans, eine gut lesbare Grotesk, für Text.
- **Name:** Handel ist der Nachname. Die Marke ist damit persönlich, wie ein Familienbetrieb. Das Wortspiel mit „handeln“ trägt die Idee: Hier wird Wissen weitergegeben, keine Ware verkauft.
- **Logo:** Brauner Pilz im Stil von 🍄‍🟫 mit Moos am Fuß. Schriftzug „Pilz“ gerade, „Handel“ kursiv in Terrakotta, das wirkt wie eine Unterschrift unter dem Pilz. Untertitel: Heilpilze · Evidenz · Einkauf. Dateien: `logo.svg`, `icon.svg`, PNG-Icons in `icons/`.
  Logo und App-Icons zeigen noch die alte Terrakotta-Farbe, nicht die neue Akzentfarbe — offen,
  siehe Wissenslücken unten.
- **Bilder:** Fotos von Wikimedia Commons, direkt im Browser geladen. Lädt ein Foto nicht, zeigt die App eine gezeichnete Illustration in der Farbe des Pilzes. Die Seite sieht also nie kaputt aus.

## 4. Bedienung (Usability)

- **Toolbar oben:** Logo, Hauptnavigation, Suche mit Live-Vorschlägen, Textgröße A−/A/A+, Hell/Dunkel/Auto, Einstellungen, Merkliste mit Zähler. Wird der Platz knapp, etwa bei großer Schrift, verdichtet sich die Toolbar stufenweise.
- **Tab-Leiste unten auf dem Handy:** Start, Pilze, Check, Merkliste, Kaufen. Daumenfreundlich.
- **Tastatur:** `/` springt in die Suche, Pfeiltasten wählen Vorschläge, Esc schließt.
- **Barrierefreiheit:** Textgröße in fünf Stufen bis 140 %, alles in rem skaliert, Fokusrahmen, Sprunglink, beschriftete Knöpfe, reduzierte Animation wenn gewünscht.
- **Teilbare Links:** Jede Filterkombination und jeder Pilz hat eine eigene Adresse. Die Merkliste lässt sich per Link teilen.
- **Offline:** Als App installierbar, funktioniert nach dem ersten Besuch ohne Netz.

## 5. Funktionen

**Umgesetzt**

1. Startseite mit Hero, Suche, Anliegen-Finder, Top-Evidenz, Methode, Sicherheitsband und Frischpilzen
2. Katalog mit Filtern nach Anliegen, Stufe, Bezugsart und Mindest-Evidenz, Sortierung, Kachel- und Listenansicht
3. Detailseite pro Pilz mit Evidenzanzeige, Stufenfilter, Sicherheit, Dosierung, Kaufen, Quellen, Teilen, Drucken, Blättern
4. Wechselwirkungs-Check mit 14 Medikamenten und Umständen, Ampel pro Pilz und Begründung
5. Vergleich von bis zu drei Pilzen nebeneinander
6. Merkliste mit Teilen-Link, Vergleich und Check für die gemerkten Pilze
7. Einkaufen: Checkliste, elf Anbieter in vier Kategorien, 14 geprüfte Infoseiten
8. Wissen: FAQ, Methode, Einkauf, Sicherheit, Rechtslage
9. Installierbar als App (PWA), offlinefähig
10. Rezepte mit Speisepilzen (8 Gerichte, je mit Sicherheitshinweis), verlinkt von den Detailseiten
11. Druckbare Arzt-Karte aus Merkliste und Check („Das nehme ich, bitte prüfen“), Name, Medikamente und Dosis lokal gespeichert
12. Einnahme-Tagebuch: Pilz, Präparat, Menge, Befinden; Auswertung, CSV-Export, Sicherung als Datei, Kalender-Erinnerung (.ics) mit Termin für Pause und Bilanz
13. Studien-Radar: `tools/studien-radar.js` holt neue Humanstudien und Übersichtsarbeiten aus PubMed nach `radar.js`; Anzeige als „noch nicht eingestuft“, Live-Link zu PubMed auf jeder Detailseite
14. Schriften lokal eingebunden, externe Abrufe nur noch für Fotos
15. Meldeweg für Inhaltsfehler: Link „Fehler melden“ im Fuß und „Fehler bei diesem Pilz melden“ auf jeder Detailseite, öffnen ein vorausgefülltes GitHub-Issue mit Label `inhalt`
16. Rückgängig-Funktion für gelöschte Tagebuch-Einträge und geleerte Check-/Vergleichs-Auswahl (Toast mit „Rückgängig“)
17. Bildrechte je Foto (Urheber, Lizenz von Wikimedia Commons) auf jeder Detailseite und beim Hero-Bild, per `tools/fetch-image-credits.js` erzeugt
18. Automatisierte Tests (`pilzhandel/tools/test.mjs`, `node --test`) für Datenqualität aller Pilze, Check-Logik und Tagebuch-Import; die geprüfte Logik liegt gemeinsam mit `app.js` in `pilzhandel/logic.js`
19. Kennzahlen-Skript (`tools/kennzahlen.js`): Inhaltsumfang, Studien-Radar-Rückstand und gemeldete Inhaltsfehler aus vorhandenen Daten, ohne Nutzer-Tracking
20. Impressum und Datenschutzerklärung als eigene Ansichten (`#/impressum`, `#/datenschutz`, im Fuß verlinkt); Angaben (Name, Anschrift, E-Mail) in `pilzhandel/betreiber.js` noch leer, siehe §8
21. Verantwortlich/Stand/Aktualisierungsregel auf jeder Detailseite (verlinkt zum Impressum statt den Namen zu wiederholen)
22. Studien-Radar als GitHub Action (`.github/workflows/studien-radar.yml`): läuft monatlich, öffnet bei neuen Treffern einen Pull Request zum Sichten; stuft nichts selbst ein. Braucht einmalig eine Einstellung von Stephan (Kommentar in der Datei)

**Nächste Stufen, nach Aufwand sortiert**

| Stufe | Idee | Aufwand |
|---|---|---|
| 1 | Eigene Fotos oder lizenzierte Bildserie statt Commons, einheitlicher Look | klein, braucht Fotos |
| 2 | Produktdatenbank: konkrete Produkte mit β-Glucan-Gehalt, Herkunft, Preis pro Studiendosis | mittel |
| 2 | Treffer aus dem Radar lesen und in `heilpilze.html` einstufen (Handarbeit, fachlich) | laufend |
| 3 | Eigener Shop oder Affiliate-Links, klar gekennzeichnet | groß, rechtlich prüfen |
| 3 | Konto mit Synchronisierung über Geräte | groß |

## 6. Falls später doch verkauft wird

„Handel“ ist der Nachname, die App verkauft nichts. Kämen später Affiliate-Links oder ein eigener Shop dazu, gelten zusätzliche Pflichten:

- ~~Impressum und Datenschutzerklärung sind Pflicht, sobald die Seite geschäftsmäßig ist.~~
  **Korrektur (§8):** Das war zu optimistisch. Nach heutiger Einschätzung gilt das schon jetzt, nicht erst ab einem Verkauf — siehe §8.
- **Health-Claims-Verordnung:** Keine Wirkversprechen bei eigenen Produkten. Die Evidenzseite muss vom Shop klar getrennt sein, sonst wird sie rechtlich zur Werbung.
- **Lebensmittelrecht:** Registrierung als Lebensmittelunternehmer, Kennzeichnung nach der Lebensmittelinformations-Verordnung, Novel-Food-Status einzelner Arten prüfen.
- **Affiliate-Links** müssen als Werbung gekennzeichnet sein.

## 7. Technik

- Reines HTML, CSS und JavaScript ohne Framework und ohne Build. Läuft auf GitHub Pages.
- Datenquelle ist `heilpilze.html`. `tools/build-data.js` erzeugt daraus `data.js` und ergänzt Bilder, Farben, Wechselwirkungen und Shops.
- Alle Einstellungen, Merkliste, Check-Auswahl, Tagebuch und Arzt-Karte liegen nur im Browser (`localStorage`). Kein Tracking.
- Schriften liegen in `fonts/` (SIL Open Font License). Einziger externer Abruf: Fotos von Wikimedia Commons.
- `tools/studien-radar.js` braucht Node 18 oder neuer (eingebautes `fetch`) und fragt die öffentliche PubMed-Schnittstelle ohne Schlüssel ab.

## 8. Rechtsprofil (Stand: 25. September 2026)

Regel LEGAL-01 aus dem Pilot-Regelkatalog verlangt ein Rechtsprofil vor Veröffentlichung — die
Seite ist aber schon live. Dieser Abschnitt holt das nach. **Keine Rechtsberatung:** erstellt
auf Basis öffentlich zugänglicher Gesetzestexte und Kanzlei-Erläuterungen (Quellen unten), nicht
von einer Anwältin oder einem Anwalt geprüft. Referenzprofil Deutschland/EU, kein weltweiter
Rechtskatalog.

| Feld | Einschätzung |
|---|---|
| Verantwortlicher Betreiber | Stephan Handel, Einzelperson. Vollständige Angaben fehlen noch auf der Seite selbst (siehe offene Punkte). |
| Länder / Zielmarkt | Primär Deutschland (deutschsprachig, deutsche Anbieter, deutsches Recht als Bezugsrahmen). Über GitHub Pages ohne Geoblocking weltweit erreichbar; für Besuchende außerhalb der EU gilt zusätzlich deren eigenes Recht, hier nicht geprüft. |
| Zielgruppen | Erwachsene Laien mit allgemeinem Interesse oder einem konkreten Gesundheitsanliegen. Keine gezielte Ansprache an Kinder oder Jugendliche. |
| Minderjährige | **Nicht nötig, begründet:** keine Altersprüfung, kein Jugendschutzbeauftragter. Die Inhalte sind Gesundheitsinformation ohne jugendschutzrelevante Kategorien (keine Gewalt, Sexualität, extremistische Inhalte). |
| Vertragsarten | Keine. Die App schließt selbst keine Verträge, verkauft nichts, hat keine Registrierung. Verweise zu Drittanbieter-Shops führen aus der App heraus; dort gelten deren eigene AGB und Widerrufsregeln. |
| Datenkategorien | Browserdaten (Merkliste, Check-Auswahl, Tagebuch, Arzt-Karte, Anzeigeeinstellungen) verlassen das Gerät nie und werden vom Betreiber nicht verarbeitet — dafür besteht ihm gegenüber keine Informationspflicht. Tatsächlich verarbeitet werden **IP-Adressen**: einmal durchs Hosting (GitHub-Pages-Server-Logs), einmal beim direkten Laden der Fotos im Browser (Wikimedia-Foundation-Server). IP-Adressen sind personenbezogene Daten (EuGH „Breyer“), auch ohne Cookies oder Tracking. |
| Verkaufskanäle | Keine eigenen. Die Shop-Liste verlinkt elf Drittanbieter ohne Affiliate-Vergütung (Stand heute, siehe §6). |
| Inhalte | Gesundheitsbezogene Fachinhalte zu Heilpilzen, Rezepte, kuratierte Linklisten. Redaktionelle Sorgfalt dazu bereits im Pilot-Regelkatalog verankert (CONTENT-01/02/03, siehe `CLAUDE.md`). |
| Besondere Branchenfunktionen | Gesundheitsinhalte (Claims-Grenzen, siehe §9); Auslandsbezug durch Bildabruf bei einer US-Stiftung (Wikimedia Foundation). |

**Ergebnis:**

1. **Anbieterkennzeichnung (Impressum), § 5 DDG i. V. m. § 18 Abs. 1 MStV — vermutlich schon
   heute Pflicht, nicht erst bei einem Verkauf.** Die Ausnahme gilt nur für Angebote, die
   „ausschließlich persönlichen oder familiären Zwecken“ dienen. Eine öffentliche, professionell
   gestaltete, unter eigenem Namen und Logo geführte Webapp mit regelmäßiger Pflege erfüllt das
   nicht. Gewinnerzielungsabsicht ist laut Rechtsprechung keine Voraussetzung. **Fehlt aktuell.**
2. **Verantwortlicher nach § 18 Abs. 2 MStV** (zusätzlich zum Impressum, für journalistisch-
   redaktionelle Angebote): Grenzfall. Pilz Handel ordnet und kommentiert Inhalte redaktionell
   (Evidenzstufen, Methode-Seite, kuratierte Shop-Auswahl), was dafürspricht. Anbieter und
   Verantwortlicher dürfen bei einer Einzelperson identisch sein — der Zusatzaufwand ist nur eine
   weitere Namensnennung. Empfehlung: mit ausweisen, statt die Einstufung abschließend zu klären.
3. **Datenschutzerklärung, Art. 13 DSGVO — Pflicht**, weil IP-Adressen über Hosting und
   Bildabruf verarbeitet werden, auch ohne Cookies oder Tracking. **Fehlt aktuell**, es gibt nur
   den kurzen Absatz unter „Über Pilz Handel“.

**Entwurf Impressum** (Platzhalter füllen, dann als eigene Ansicht in der App veröffentlichen,
von „Fuß“ und „Über“ verlinkt):

```
Impressum

Verantwortlich für den Inhalt:
[Vollständiger Name]
[Straße und Hausnummer]
[PLZ und Ort]
Deutschland

Kontakt: [E-Mail-Adresse]

Verantwortlich im Sinne des § 18 Abs. 2 Medienstaatsvertrag:
[Name wie oben, falls identisch]

Haftungshinweis: Pilz Handel ist ein privates, werbefreies Informationsprojekt.
Alle Wirkungsaussagen sind nach Evidenzstufe gekennzeichnet und ersetzen keine
ärztliche Beratung. Für die Inhalte verlinkter externer Seiten sind deren
Betreiber verantwortlich.
```

**Entwurf Datenschutzerklärung** (Kernpunkte, redaktionell noch auszuformulieren):

- Verantwortlicher: wie Impressum.
- Es gibt kein Nutzerkonto, keine Cookies, kein Tracking und keine Analyse-Software.
- Merkliste, Vergleich, Check-Auswahl, Tagebuch, Arzt-Karte und Anzeigeeinstellungen speichert
  ausschließlich der Browser (`localStorage`). Diese Daten erreichen den Betreiber nie.
- Beim Aufruf der Seite verarbeitet GitHub Pages als Hosting-Anbieter Server-Logs mit der
  IP-Adresse (Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO, berechtigtes Interesse am sicheren
  Betrieb). Details: GitHubs eigene Datenschutzerklärung.
- Fotos werden direkt vom Server der Wikimedia Foundation (USA) geladen; dabei erhält Wikimedia
  die IP-Adresse des Besuchers. Details: Datenschutzerklärung der Wikimedia Foundation.
- Es gibt einen Meldeweg für inhaltliche Fehler über GitHub Issues (öffentlich, freiwillig).

**Offen, nicht von uns abschließend geklärt:**

- Ob der Bildabruf bei der Wikimedia Foundation (USA) eine nach Art. 44 ff. DSGVO ausreichende
  Garantie hat — wird in der Datenschutzerklärung als Drittlandtransfer benannt, die rechtliche
  Absicherung selbst liegt bei Wikimedia.
- Ob GitHub Pages einen Auftragsverarbeitungsvertrag anbietet bzw. ob einer nötig ist.
- Endgültige Einstufung als journalistisch-redaktionell (Punkt 2 oben).
- **Umsetzung (25.09.2026):** Impressum (`#/impressum`) und Datenschutzerklärung (`#/datenschutz`)
  sind als eigene Ansichten gebaut und im Fuß sowie auf „Über“ verlinkt. Die Angaben kommen aus
  `betreiber.js`; fehlende Felder erscheinen als markierter Platzhalter mit Entwurfshinweis, und
  `tools/test.mjs` führt sie als offenen Punkt (todo). **Einziger Rest:** Name, ladungsfähige
  Anschrift (kein Postfach) und E-Mail in `betreiber.js` eintragen, `VERSION` in `sw.js` erhöhen.

Quellen: [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html) (Volltext geprüft) ·
[§ 18 MStV — Das Impressum und der Verantwortliche](https://www.res-media.net/18-mstv-das-impressum-und-der-verantwortliche/) ·
[§ 18 MStV — Informationspflichten und Auskunftsrechte](https://dr-dsgvo.de/18-mstv-informationspflichten-und-auskunftsrechte/) ·
[Benennung des inhaltlich Verantwortlichen](https://koehrer.de/benennung-des-inhaltlich-verantwortlichen-%C2%A7-18-abs-2-mstv/)
(letztere drei sind Kanzlei-Erläuterungen, kein Gesetzestext direkt geprüft).

## 9. Prüfung eigener Aussagen — Health Claims & HWG (Stand: 25. September 2026)

Regel CLAIM-02 aus dem Pilot-Regelkatalog. Geprüft: eigene, nicht quellenbelegte Texte der
App — Hero, Anliegen-Finder-Kacheln, Pilz-Zusammenfassungen (`summary`), Shop-Beschreibungen,
Rezepttexte. **Nicht** Gegenstand: die evidenzbasierten Wirkungsaussagen selbst (`effects`),
die schon über CONTENT-03 mit Quelle und Stufe gekennzeichnet sind.

**Rechtlicher Rahmen in Kürze** (laut mehreren Kanzlei-Erläuterungen, kein Gesetzestext direkt
geprüft):

- Die Health-Claims-Verordnung (EG) 1924/2006 gilt nur für „kommerzielle Mitteilungen“ bei
  Kennzeichnung, Aufmachung oder Werbung für Lebensmittel, die an Endverbraucher abgegeben
  werden. Unabhängige Gesundheitsinformation — wie bei der Verbraucherzentrale oder dem
  Krebsinformationsdienst, an denen sich Pilz Handel ausdrücklich orientiert (§2) — fällt in
  der Regel nicht darunter, außer sie ist faktisch doch produktbezogene Werbung.
- Das Heilmittelwerbegesetz nimmt sachliche, aufklärende oder journalistische Inhalte ohne
  Wettbewerbsabsicht aus. Die Abgrenzung wird laut Fachliteratur schwierig, sobald ein Angebot
  zugleich Anbieter oder Produkte hervorhebt — das trifft auf die Shop-Liste zu.

**Durchsicht:** automatisiert nach Reizwörtern („heilt“, „wirkt gegen“, „bekämpft“, „verhindert“,
„garantiert“, „wirksam gegen“, „kuriert“, „hilft bei“, „lindert“, „stärkt“) über alle
Pilz-Zusammenfassungen, Shop- und Rezepttexte, dazu manuelle Durchsicht von Hero- und
Finder-Text.

**Ergebnis: keine Formulierung gefunden, die eine Heilwirkung behauptet oder ein Produkt mit
einer Krankheit in Verbindung bringt.**

- Hero und Finder beschreiben nur, was die App tut ( „Jede Wirkung mit Evidenzstufe und
  Quelle“), nicht eine Wirkung selbst.
- Shop-Beschreibungen loben Herkunft, Zertifizierung und Verarbeitung ( „Bio-Zucht“,
  „GMP-zertifiziertes Labor“), nicht Gesundheitswirkungen.
- Pilz-Zusammenfassungen ordnen historisch/wissenschaftlich ein, ohne eigene Wirkbehauptung.

**Verbleibendes Risiko:** Die Shop-Liste nennt Anbieter namentlich und beschreibt sie positiv —
genau dort kann laut Fachliteratur die HWG-Ausnahme für redaktionelle Inhalte kippen, weil
„Anbieter oder Produkte hervorgehoben“ werden. Heute eingehalten, aber nur durch Gewohnheit,
nicht durch eine erzwungene Regel: **jede neue Shop-Beschreibung nennt nur Fakten (Herkunft,
Zertifizierung, Sortiment), nie eine Wirkung oder eine Empfehlung „bei Beschwerde X“.**

Nicht geprüft: lebensmittelrechtliche Kennzeichnungspflichten der bei den Shops verkauften
Produkte selbst — das ist Sache der jeweiligen Anbieter, nicht von Pilz Handel.

**Kein Änderungsbedarf am aktuellen Text.** Diese Prüfung ist eine Momentaufnahme, keine
Freigabe für künftige Texte. Jede neue, selbst formulierte Passage (nicht die reinen
`effects`-Einträge) sollte gegen dieselben Reizwortgruppen geprüft werden, bevor sie live geht.

Quellen: [Health Claims: Anwendungsbereich der HCVO](https://www.it-recht-kanzlei.de/anwendungsbereich-health-claims-verordnung.html) ·
[Heilmittelwerbegesetz kompakt](https://www.dmrz.de/wissen/ratgeber/heilmittelwerbegesetz) ·
[Werbung für Heilmittel: was ist erlaubt?](https://www.rueden.de/blog/wettbewerbsrecht/werbung-fuer-heilmittel-was-ist-erlaubt-was-ist-verboten/).

## 10. Tastatur- und Fokus-Durchgang (Stand: 25. September 2026)

Regel A11Y-03. Geprüft mit Chrome-Automatisierung: echte Klicks/Eingaben plus direkte Abfrage
der Fokus- und Beschriftungs-APIs des Browsers (`document.activeElement`, `element.labels`),
nicht nur Blick auf den Bildschirm.

**Geprüft und bestätigt:**

- Sprunglink „Zum Inhalt springen“ ist beim Fokussieren sichtbar und funktioniert.
- Bei jedem Seitenwechsel bekommt `<main>` den Fokus (`main.focus({preventScroll:true})` in
  `app.js`), Screenreader beginnen wieder oben statt auf einem toten Link stehen zu bleiben.
  War schon vorhanden, jetzt am laufenden Code bestätigt statt nur vermutet.
- Textstufe A+ (140 %, höchste Stufe) auf Desktop-Breite: keine Überlappung, kein
  abgeschnittener Text, Karten fließen sauber in eine Spalte um.
- Formularfelder im Tagebuch (Präparat, Menge, Notiz) sind trotz Platzhaltertext korrekt über
  `<label>` beschriftet — per `element.labels` bestätigt, nicht nur vermutet. Der zuerst
  angezeigte Name in der Werkzeug-Ausgabe war der Platzhalter, das war eine Einschränkung des
  Prüfwerkzeugs, kein Fehler der App.
- Arzt-Karte und Tagebuch: alle Knöpfe haben klare, eigene Beschriftungen (Pilznamen als
  Knopftext, „Drucken oder als PDF sichern“ usw.), keine namenlosen Icon-Knöpfe gefunden.

**Ein echter Fehler gefunden und behoben** (betrifft UX-03/A11Y-02, siehe `app.js`
`function toast`): Der „Rückgängig“-Knopf im Toast aus Arbeitsplan-Schritt 1 bekam beim
Erscheinen keinen Tastaturfokus. Ursache: Chrome fokussiert nach einem echten Klick zuerst den
geklickten Auslöser-Knopf selbst (nativ, nach dem Ende unseres Event-Handlers), unser
`.focus()`-Aufruf auf den Rückgängig-Knopf lief davor und wurde überschrieben. Ohne Korrektur
war „Rückgängig“ für Tastaturnutzer nur über viele weitere Tab-Schritte erreichbar — für ein
Feature, dessen Zweck schnelle Reaktion ist, praktisch unbrauchbar. Behoben mit
`setTimeout(fn, 0)`, damit unser Fokus nach dem nativen Verhalten des Browsers läuft. Zusätzlich
blieb der Knopf nach dem Ausblenden unsichtbar, aber weiter mit Tab erreichbar (Tab-Falle);
behoben, indem der Toast-Inhalt kurz nach dem Ausblenden geleert wird. Beides live im Browser
nachvollzogen (nicht nur am Code), mit einem echten Klick auf „Auswahl leeren“ im
Wechselwirkungs-Check.

**Nicht geprüft, offen:**

- Ein echter Screenreader (VoiceOver, NVDA) — das Automatisierungswerkzeug kann keinen
  Screenreader bedienen, nur dessen technische Grundlage (Fokus, Namen, Landmarks, `aria-live`)
  stichprobenartig prüfen.
- Der schmale Mobil-Viewport zusammen mit großer Schrift — das verwendete Werkzeug konnte den
  Browser nicht zuverlässig auf Handy-Breite verkleinern (`resize_window` änderte die
  Fenstergröße, aber nicht die von der Seite gesehene Viewport-Breite). Die Tab-Leiste unten
  existiert für genau diesen Fall (siehe §4), wurde aber nicht bei A+/XXL gegengeprüft.
- Reine Tastatur-Navigation per echtem, sequenziellem Tab-Tastendruck durch die ganze Toolbar —
  die synthetischen Tab-Tastendrücke des Werkzeugs kamen im Test nicht zuverlässig an (bekanntes
  Verhalten bei Erweiterungs-basierter Automatisierung). Ersatzweise wurden Fokusziele
  programmatisch angesteuert und geprüft; das prüft Erreichbarkeit und Beschriftung, aber nicht
  die tatsächliche Reihenfolge beim Durchtabben.
- Empfehlung: die drei offenen Punkte einmal von Hand nachholen, am besten an einem echten
  Telefon plus einer echten Tastatur ohne Automatisierung dazwischen.

Nebenbei mit geprüft, weil dieser Durchgang genau dafür da war (Arbeitsplan-Schritt 7):

- **UX-01** (Zweck, Zustand, nächster Schritt je Ansicht): auf Start, Katalog, Check, Tagebuch
  bestätigt — jede Ansicht hat Eyebrow, Überschrift und erklärenden Lead-Satz vor dem Inhalt.
- **DEPTH-02** (Risiken am Handlungspunkt sichtbar): auf der Pilz-Detailseite steht die
  „Sicherheit“-Karte direkt neben Kaufen/Dosierung, nicht hinter einem Klick versteckt; der
  Check zeigt seinen Einschränkungshinweis dauerhaft, nicht nur einmalig.
- **CONTENT-01** (Zweck/Grenzen sichtbar): auf Start, Check und Detailseite bestätigt (Fußzeile:
  „ersetzt keine ärztliche Beratung“; Check: eigener Hinweistext).
  Nicht auf jeder einzelnen Unterseite einzeln nachgeprüft.

## 11. Kennzahlen-Zielwerte — Vorschlag (Stand: 25. September 2026, nicht bestätigt)

Regel PROD-04. Die Werte stehen als `ZIELE` oben in `tools/kennzahlen.js`, das Skript zeigt je
Kennzahl „Ziel erreicht/verfehlt“. **Bestätigen:** dort `bestaetigt: true` setzen (Zahlen dürfen
vorher geändert werden).

| Kennzahl | Vorschlag | Heute | Begründung |
|---|---|---|---|
| Quellen je Pilz | mindestens 2 | 11 von 21 Pilzen haben nur 1 | Eine einzelne Quelle ist nicht gegenzuprüfen. Betroffen sind fast alle Pilze ab Rang 10; die bekannten (Reishi, Shiitake, Hericium …) liegen bei 3–6. Realistisch als Jahresziel, nicht sofort. |
| Alter der Radar-Abfrage | höchstens 45 Tage | 1 Tag | Monatlicher Pflegeplan (§5/OPS-06) plus zwei Wochen Puffer. |
| Gemeldete Fehler | höchstens 3 offen, Ø höchstens 14 Tage bis zur Korrektur | 0 / – | Für ein Gesundheitsangebot sollte ein gemeldeter Fehler nicht monatelang stehen bleiben. |

**Bewusst ohne Zielwert:** die Zahl der Studien-Radar-Treffer (heute 77). `studien-radar.js`
merkt sich nicht, welche Treffer schon gesichtet wurden, die Zahl sinkt also nicht durch
Arbeit. Ein Zielwert darauf würde nur Frust erzeugen. Wenn das gewünscht ist, wäre die kleine
Erweiterung: eine Liste gesichteter PubMed-Nummern, die das Radar ausblendet.

## 12. Handtest Barrierefreiheit — Checkliste zum Abhaken (ca. 15 Minuten)

Holt die drei offenen Punkte aus §10 nach. Braucht ein iPhone (oder Android) und einen Rechner
mit Tastatur. Bei jedem „Nein“: kurz notieren, auf welcher Seite, und Claude geben.

**A. iPhone mit VoiceOver** (Einstellungen → Bedienungshilfen → VoiceOver an; Wischen nach
rechts = nächstes Element, Doppeltippen = auswählen). App im Safari öffnen.

- [ ] Startseite: VoiceOver liest zuerst „Zum Inhalt springen“, dann Logo und Suche — nichts wird als „Taste“ ohne Namen vorgelesen.
- [ ] Einen Pilz öffnen: Nach dem Seitenwechsel beginnt das Vorlesen oben bei der neuen Seite, nicht irgendwo mitten im alten Inhalt.
- [ ] Herz-Knopf auf einer Pilzkarte: wird als „Merken“ o. ä. mit Pilznamen vorgelesen; nach dem Doppeltippen wird der neue Zustand angesagt.
- [ ] Check: zwei Medikamente auswählen, dann „Auswahl leeren“. Die Meldung mit „Rückgängig“ wird vorgelesen und „Rückgängig“ ist direkt erreichbar.
- [ ] Tagebuch: Die Felder Präparat, Menge, Notiz werden mit ihrem Namen vorgelesen, nicht nur mit dem grauen Beispieltext.

**B. iPhone mit großer Schrift** (VoiceOver wieder aus; in der App oben die Anzeige-Einstellungen
öffnen und die größte Textstufe wählen).

- [ ] Startseite, Pilz-Detailseite, Check, Tagebuch, Impressum: kein Text abgeschnitten oder überlappend, nichts ragt seitlich aus dem Bildschirm.
- [ ] Die Leiste unten (Start, Pilze, Check, Merkliste, Kaufen) verdeckt keine Knöpfe; der letzte Inhalt einer Seite lässt sich über die Leiste hinaus scrollen.
- [ ] Querformat drehen: Seite bleibt benutzbar.

**C. Rechner, nur Tastatur** (Maus weglegen; Tab = weiter, Umschalt+Tab = zurück, Enter = auslösen).

- [ ] Vom Seitenanfang mit Tab durch die obere Leiste: Reihenfolge ist links nach rechts, jeder Schritt hat einen sichtbaren Rahmen.
- [ ] Anzeige-Einstellungen mit Enter öffnen, mit Tab durch, mit Escape schließen — der Fokus landet wieder auf dem Einstellungs-Knopf.
- [ ] Suche: Begriff tippen, mit Pfeil runter einen Vorschlag wählen, Enter öffnet den Pilz.
- [ ] Nirgends „hängt“ der Fokus fest oder verschwindet unsichtbar.
