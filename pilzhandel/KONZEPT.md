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

- **Farben:** Creme `#F7F1E8` als Grund, Erdbraun `#3A2A1F` für Marke und Knöpfe, Terrakotta `#B4602E` als Akzent, Moosgrün für „belegt“. Im Dunkelmodus warme Braun-Schwarztöne statt kaltem Grau.
- **Schrift:** Fraunces, eine weiche Serifenschrift, für Überschriften und das Logo. DM Sans, eine gut lesbare Grotesk, für Text.
- **Name:** Handel ist der Nachname. Die Marke ist damit persönlich, wie ein Familienbetrieb. Das Wortspiel mit „handeln“ trägt die Idee: Hier wird Wissen weitergegeben, keine Ware verkauft.
- **Logo:** Brauner Pilz im Stil von 🍄‍🟫 mit Moos am Fuß. Schriftzug „Pilz“ gerade, „Handel“ kursiv in Terrakotta, das wirkt wie eine Unterschrift unter dem Pilz. Untertitel: Heilpilze · Evidenz · Einkauf. Dateien: `logo.svg`, `icon.svg`, PNG-Icons in `icons/`.
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

**Nächste Stufen, nach Aufwand sortiert**

| Stufe | Idee | Aufwand |
|---|---|---|
| 1 | Eigene Fotos oder lizenzierte Bildserie statt Commons, einheitlicher Look | klein, braucht Fotos |
| 2 | Produktdatenbank: konkrete Produkte mit β-Glucan-Gehalt, Herkunft, Preis pro Studiendosis | mittel |
| 2 | Studien-Radar als GitHub Action, die monatlich läuft und einen Pull Request öffnet | klein |
| 2 | Treffer aus dem Radar lesen und in `heilpilze.html` einstufen (Handarbeit, fachlich) | laufend |
| 3 | Eigener Shop oder Affiliate-Links, klar gekennzeichnet | groß, rechtlich prüfen |
| 3 | Konto mit Synchronisierung über Geräte | groß |

## 6. Falls später doch verkauft wird

„Handel“ ist der Nachname, die App verkauft nichts. Solange sie ein privates Informationsprojekt ohne Werbung bleibt, reicht der jetzige Stand. Kämen später Affiliate-Links oder ein eigener Shop dazu, gelten zusätzliche Pflichten:

- **Impressum und Datenschutzerklärung** sind Pflicht, sobald die Seite geschäftsmäßig ist.
- **Health-Claims-Verordnung:** Keine Wirkversprechen bei eigenen Produkten. Die Evidenzseite muss vom Shop klar getrennt sein, sonst wird sie rechtlich zur Werbung.
- **Lebensmittelrecht:** Registrierung als Lebensmittelunternehmer, Kennzeichnung nach der Lebensmittelinformations-Verordnung, Novel-Food-Status einzelner Arten prüfen.
- **Affiliate-Links** müssen als Werbung gekennzeichnet sein.

## 7. Technik

- Reines HTML, CSS und JavaScript ohne Framework und ohne Build. Läuft auf GitHub Pages.
- Datenquelle ist `heilpilze.html`. `tools/build-data.js` erzeugt daraus `data.js` und ergänzt Bilder, Farben, Wechselwirkungen und Shops.
- Alle Einstellungen, Merkliste, Check-Auswahl, Tagebuch und Arzt-Karte liegen nur im Browser (`localStorage`). Kein Tracking.
- Schriften liegen in `fonts/` (SIL Open Font License). Einziger externer Abruf: Fotos von Wikimedia Commons.
- `tools/studien-radar.js` braucht Node 18 oder neuer (eingebautes `fetch`) und fragt die öffentliche PubMed-Schnittstelle ohne Schlüssel ab.
