// Erzeugt pilzhandel/data.js aus der Basis-Datenbank (heilpilze.html) plus App-Zusätzen.
// Aufruf: node pilzhandel/tools/build-data.js
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "..");
const html = fs.readFileSync(path.join(root, "heilpilze.html"), "utf8");
const start = html.indexOf("const LEVELS");
const end = html.indexOf("/* ============ RENDERING");
if (start < 0 || end < 0) throw new Error("Datenblock in heilpilze.html nicht gefunden");
const base = new Function(html.slice(start, end) + ";return {MUSHROOMS,REFERENCE,TAGS,LEVELS,SCORE_LBL};")();

/* shape: Form der Illustration, falls das Foto nicht lädt
   color: Hutfarbe · imgs: Wikimedia-Commons-Dateinamen (erster = bevorzugt)
   flags: 2 = dokumentierte Fälle · 1 = theoretisch/beachten
   buy: frisch | zucht | extrakt | apotheke */
const EXTRA = {
  reishi:     {shape:"bracket", color:"#8E3B1F", imgs:["Ganoderma_lucidum.jpg","Ganoderma_lucidum_01.jpg"], flags:{gerinnung:2,diabetes:1,blutdruck:1,leber:2,immun:1,op:2}, buy:["extrakt","apotheke"]},
  shiitake:   {shape:"cap",     color:"#7A4A2C", imgs:["Lentinula_edodes.jpg","Wild_Shiitake-Mushroom_Japan.JPG"], flags:{immun:1,allergie:2,roh:2,gicht:1}, buy:["frisch","zucht","extrakt","apotheke"]},
  coriolus:   {shape:"bracket", color:"#5C6B7A", imgs:["Trametes_versicolor.JPG","Turkey_Tail_(Trametes_versicolor)_(2188447891).jpg"], flags:{immun:1,chemo:1}, buy:["extrakt","apotheke"]},
  pleurotus:  {shape:"cap",     color:"#8C8A86", imgs:["Pleurotus_ostreatus_JPG7.jpg","Pleurotus ostreatus - Pleurote en huître.jpg"], flags:{allergie:1,roh:1}, buy:["frisch","zucht","extrakt","apotheke"]},
  hericium:   {shape:"cluster", color:"#E9E1D2", imgs:["Igelstachelbart,_Hericium_erinaceus.jpg","Hericium_erinaceus_116231101.jpg"], flags:{gerinnung:1,diabetes:1,allergie:1}, buy:["frisch","zucht","extrakt","apotheke"]},
  cordyceps:  {shape:"club",    color:"#E27A2B", imgs:["Puppenkernkeule_Cordyceps_militaris.JPG","Cordyceps_Militaris.jpg"], flags:{gerinnung:1,diabetes:1,immun:2,autoimmun:1}, buy:["extrakt","apotheke"]},
  agaricus:   {shape:"cap",     color:"#9A7B5A", imgs:["Agaricus_subrufescens.jpg","Agaricus_subrufescens_annulus.jpg"], flags:{leber:2,diabetes:2,roh:1}, buy:["extrakt"]},
  maitake:    {shape:"cluster", color:"#6E5A48", imgs:["Maitake_mushrooms_(hen_of_the_woods)_-_Boston,_MA_-_20180602_142901.jpg","Eikhaas.JPG"], flags:{diabetes:1,gerinnung:2}, buy:["frisch","extrakt","apotheke"]},
  chaga:      {shape:"bracket", color:"#2B211C", imgs:["Chaga_Mushroom_-_Inonotus_obliquus_(40358524662).jpg","Chaga_in_alder.jpg"], flags:{niere:2,gerinnung:1,diabetes:1}, buy:["extrakt"]},
  auricularia:{shape:"ear",     color:"#6B3A2E", imgs:["Judasohr_Auricularia_auricula_judae.jpg","Auricularia_auricula-judae_64485.JPG"], flags:{gerinnung:2,op:2,roh:1}, buy:["frisch","extrakt"]},
  polyporus:  {shape:"cluster", color:"#B49A7C", imgs:["Polyporus_umbellatus.jpg","Polyporus_umbellatus_4931091.jpg"], flags:{diuretika:1,blutdruck:1}, buy:["extrakt"]},
  coprinus:   {shape:"club",    color:"#EDE7DC", imgs:["Shaggy_inkcap_(Coprinus_comatus).JPG","Schopftintling-Coprinus-comatus.jpg"], flags:{diabetes:1}, buy:["extrakt"]},
  tremella:   {shape:"cluster", color:"#F1EBDD", imgs:["Tremella_fuciformis_99413998.jpg","Tremella_fuciformis_54604208.jpg"], flags:{}, buy:["extrakt"]},
  phellinus:  {shape:"bracket", color:"#A5651F", imgs:["Sanghuangporus_sanghuang.jpg"], flags:{gerinnung:1,immun:1}, buy:["extrakt"]},
  poria:      {shape:"sclerotium", color:"#6A4E3A", imgs:["Poria_cocos.jpg"], flags:{diuretika:1}, buy:["extrakt"]},
  antrodia:   {shape:"bracket", color:"#C8672F", imgs:["牛樟芝1.jpg"], flags:{gerinnung:1}, buy:["extrakt"]},
  sparassis:  {shape:"cluster", color:"#E5D3A8", imgs:["Krause_Glucke_Sparassis_crispa.JPG","Sparassis_crispa_JPG1.jpg"], flags:{}, buy:["extrakt"]},
  enoki:      {shape:"club",    color:"#E8DFC8", imgs:["Flammulina_velutipes_(Enokitake,_winter_mushroom).jpg","Flammulina_velutipes,_Velvet_Shank,_Enfield,_UK.JPG"], flags:{roh:2}, buy:["frisch"]},
  champignon: {shape:"cap",     color:"#E6DDD0", imgs:["Agaricus_bisporus_Zuchtchampignon.JPG","Agaricus_bisporus_mushroom.jpg"], flags:{roh:1,gicht:1}, buy:["frisch","zucht"]},
  fomes:      {shape:"bracket", color:"#8C8378", imgs:["Fomes_fomentarius_Zunderschwamm.jpg","Fomes_fomentarius_(46906865784).jpg"], flags:{allergie:1}, buy:["extrakt"]},
  agarikon:   {shape:"bracket", color:"#E9E0CC", imgs:["Fomitopsis_officinalis_32014.JPG","Fomitopsis_officinalis_OPN.jpg"], flags:{}, buy:["extrakt"]}
};

/* pubmed: Suchbegriff für Studien-Radar und PubMed-Links (Titel/Abstract) */
const PUBMED = {
  "reishi": "\"Ganoderma lucidum\" OR \"Ganoderma lingzhi\" OR reishi OR lingzhi",
  "shiitake": "\"Lentinula edodes\" OR shiitake OR lentinan",
  "coriolus": "\"Trametes versicolor\" OR \"Coriolus versicolor\" OR \"polysaccharide-K\" OR \"polysaccharide K\"",
  "pleurotus": "\"Pleurotus ostreatus\" OR \"oyster mushroom\"",
  "hericium": "\"Hericium erinaceus\" OR \"lion's mane\"",
  "cordyceps": "Cordyceps OR Ophiocordyceps",
  "agaricus": "\"Agaricus blazei\" OR \"Agaricus subrufescens\" OR \"Agaricus brasiliensis\"",
  "maitake": "\"Grifola frondosa\" OR maitake",
  "chaga": "\"Inonotus obliquus\" OR chaga",
  "auricularia": "Auricularia",
  "polyporus": "\"Polyporus umbellatus\"",
  "coprinus": "\"Coprinus comatus\"",
  "tremella": "\"Tremella fuciformis\"",
  "phellinus": "\"Phellinus linteus\" OR Sanghuangporus",
  "poria": "\"Wolfiporia\" OR \"Poria cocos\"",
  "antrodia": "\"Antrodia cinnamomea\" OR \"Antrodia camphorata\" OR \"Taiwanofungus\"",
  "sparassis": "\"Sparassis crispa\"",
  "enoki": "\"Flammulina velutipes\" OR \"Flammulina filiformis\" OR enoki",
  "champignon": "\"Agaricus bisporus\" OR \"button mushroom\"",
  "fomes": "\"Fomes fomentarius\"",
  "agarikon": "\"Fomitopsis officinalis\" OR \"Laricifomes officinalis\""
};

const FLAGS = {
  gerinnung: {label:"Gerinnungs\u00adhemmer", sub:"ASS, Clopidogrel, Marcumar, DOAK", icon:"🩸"},
  op:        {label:"Operation geplant", sub:"in den nächsten 2–3 Wochen", icon:"🏥"},
  diabetes:  {label:"Diabetes-Medi\u00adkamente", sub:"Metformin, Insulin, Sulfonylharnstoffe", icon:"🍬"},
  blutdruck: {label:"Blutdruck\u00adsenker", sub:"ACE-Hemmer, Betablocker u. a.", icon:"💓"},
  diuretika: {label:"Entwässerungs\u00admittel", sub:"Diuretika, Elektrolytprobleme", icon:"💧"},
  immun:     {label:"Immun\u00adsuppressiva", sub:"nach Transplantation, Kortison hochdosiert, Biologika", icon:"🛡️"},
  autoimmun: {label:"Autoimmun\u00aderkrankung", sub:"Rheuma, MS, Hashimoto, Lupus …", icon:"🔄"},
  chemo:     {label:"Laufende Krebs\u00adtherapie", sub:"Chemo, Bestrahlung, Immuntherapie", icon:"🎗️"},
  leber:     {label:"Leber\u00aderkrankung", sub:"erhöhte Leberwerte, Hepatitis, Fettleber", icon:"🟤"},
  niere:     {label:"Nieren\u00aderkrankung / Nieren\u00adsteine", sub:"eingeschränkte Nierenfunktion, Oxalatsteine", icon:"🫘"},
  allergie:  {label:"Pilz- oder Schimmel\u00adallergie", sub:"Sporen, Pilzproteine", icon:"🤧"},
  gicht:     {label:"Gicht / Harnsäure", sub:"purinreiche Kost", icon:"🦶"},
  roh:       {label:"Ich esse Pilze roh", sub:"Salat, Bowl, Smoothie", icon:"🥗"},
  schwanger: {label:"Schwanger oder stillend", sub:"", icon:"🤰"}
};

const TAG_ICONS = {
  "Immunsystem":"🛡️","Krebs-Begleitung":"🎗️","Herz & Gefäße":"❤️","Blutzucker & Stoffwechsel":"🩸",
  "Gehirn & Nerven":"🧠","Stimmung & Schlaf":"🌙","Magen & Darm":"🌿","Leber":"🍂","Atemwege":"🌬️",
  "Energie & Sport":"⚡","Haut":"✨","Niere & Harnwege":"💧","Hormone":"⚖️"
};

const BUY = {
  frisch:{label:"Frisch", icon:"🧺"}, zucht:{label:"Zuchtset", icon:"🌱"},
  extrakt:{label:"Extrakt / Pulver", icon:"🧪"}, apotheke:{label:"Apotheke", icon:"⚕️"}
};

const SHOPS = [
  {cat:"extrakt", name:"MycoVital", url:"https://www.mycovital.de/", place:"Hessen, Deutschland",
   why:"Eigene Bio-Zucht und Verarbeitung in Deutschland seit Jahrzehnten, ganze Fruchtkörper, keine Füllstoffe.", note:"Überwiegend Pulver, kaum Extrakte."},
  {cat:"extrakt", name:"Hawlik Vitalpilze", url:"https://www.hawlik-vitalpilze.de/", place:"Deutschland",
   why:"Polysaccharide werden in einem GMP-zertifizierten Labor in Deutschland analysiert, Bio-Ware, große Auswahl an Pulvern und Extrakten.", note:"Rohware überwiegend aus China."},
  {cat:"extrakt", name:"Hifas da Terra", url:"https://hifasdaterra.com/", place:"Galicien, Spanien",
   why:"Biotech-Firma mit eigener Forschung und klinischen Kooperationen, standardisierte Extrakte mit deklariertem Wirkstoffgehalt.", note:"Höherpreisig."},
  {cat:"extrakt", name:"smaints", url:"https://smaints.de/", place:"Thüringen, Deutschland",
   why:"Bio-Pilze aus der EU (Österreich, Finnland, Slowenien, Estland), laborgeprüft, Dualextrakte mit deklariertem Polysaccharidgehalt. Alltagsprodukte statt Kapseln.", note:"Mischprodukte mit Kräutern und Vitaminen, Dosis pro Pilz prüfen."},
  {cat:"frisch", name:"Pilzmännchen", url:"https://www.pilzmaennchen.de/", place:"Deutschland",
   why:"Bio-zertifizierte Frischpilze aus eigener Zucht, außerdem Zuchtsets.", note:""},
  {cat:"frisch", name:"Lebe Gesund Versand", url:"https://www.lebegesund.de/gemuese-und-obst/gemuese-und-pilze/pilze", place:"Deutschland",
   why:"Bio-Edelpilze aus eigener Zucht (Igelstachelbart, Shiitake, Kräuterseitling), morgens geerntet, am selben Tag verschickt.", note:""},
  {cat:"frisch", name:"Edelpilzzucht Saarbrücken", url:"https://xn--edelpilzzucht-saarbrcken-ftc.de/Pilz-Shop/", place:"Saarland",
   why:"Regionale Bio-Edelpilze aus Stollen, täglich frisch geerntet.", note:"Eher regionaler Versand."},
  {cat:"zucht", name:"Hawlik Pilzbrut", url:"https://www.pilzbrut.de/", place:"Deutschland",
   why:"Spezialist für Pilzbrut und Zuchtsets, u. a. Shiitake, Austernpilz, Hericium.", note:""},
  {cat:"zucht", name:"meine ernte", url:"https://www.meine-ernte.de/shop/pilzzuchtsets/", place:"Deutschland",
   why:"Einsteigerfreundliche Zuchtsets für Austernpilz, Shiitake und Limonenpilz.", note:""},
  {cat:"zucht", name:"Schöllis Biohof", url:"https://www.xn--schllihof-27a.at/produkt-kategorie/bio-pilzzucht-sets/", place:"Österreich",
   why:"Bio-Zuchtsets, auch für Igelstachelbart.", note:""},
  {cat:"apotheke", name:"Versandapotheken", url:"https://www.shop-apotheke.com/marken/smaints/", place:"",
   why:"Mehrere Marken (u. a. smaints) sind über Apotheken erhältlich, dort gelten strengere Rücknahme- und Beratungsstandards.", note:"Apotheke ≠ Arzneimittel: es bleiben Nahrungsergänzungsmittel."}
];

const LINKS = [
  {group:"Unabhängige Information (deutsch)", items:[
    {name:"Krebsinformationsdienst (DKFZ): Heilpilze – kein Krebsmittel", url:"https://www.krebsinformationsdienst.de/aktuelles/detail/heilpilze-kein-krebsmittel"},
    {name:"Verbraucherzentrale: Vitalpilze für die Krebstherapie?", url:"https://www.verbraucherzentrale.de/wissen/lebensmittel/nahrungsergaenzungsmittel/vitalpilze-fuer-die-krebstherapie-21060"},
    {name:"Klartext Nahrungsergänzung (Verbraucherzentrale)", url:"https://www.klartext-nahrungsergaenzung.de/wissen/lebensmittel/nahrungsergaenzungsmittel/vitalpilze-fuer-die-krebstherapie-21060"},
    {name:"BVL: Vitalpilze – Lebensmittel oder Arznei?", url:"https://www.bvl.bund.de/SharedDocs/Pressemitteilungen/01_lebensmittel/2015/2015_02_06_pi_Vitalpilze.html"},
    {name:"Krebsgesellschaft NRW: Vitalpilze", url:"https://www.krebsgesellschaftnrw.de/komplementarmethoden/stichwortverzeichnis/vitalpilze/"},
    {name:"BARMER: Vitalpilze – wirklich ein Superfood?", url:"https://www.barmer.de/gesundheit-verstehen/leben/ernaehrung/vitalpilze-1239464"},
    {name:"Deutsche Gesellschaft für Mykologie: Helfen Heilpilze?", url:"https://www.dgfm-ev.de/pilzesammeln-und-vergiftungen/heilpilze"}
  ]},
  {group:"Fachdatenbanken (englisch)", items:[
    {name:"Memorial Sloan Kettering: About Herbs (Reishi, Shiitake, Chaga, Coriolus …)", url:"https://www.mskcc.org/cancer-care/integrative-medicine/herbs/reishi-mushroom"},
    {name:"National Cancer Institute: Medicinal Mushrooms (PDQ)", url:"https://www.cancer.gov/about-cancer/treatment/cam/patient/mushrooms-pdq"},
    {name:"NIH LiverTox: Lingzhi / Reishi", url:"https://www.ncbi.nlm.nih.gov/books/NBK609014/"},
    {name:"NIH Office of Dietary Supplements: Botanical Fact Sheets", url:"https://ods.od.nih.gov/factsheets/list-Botanicals/"},
    {name:"Cochrane: Ganoderma lucidum bei Krebs", url:"https://doi.org/10.1002/14651858.CD007731.pub3"}
  ]},
  {group:"Pilze bestimmen & sammeln", items:[
    {name:"DGfM: Pilzsachverständige in deiner Nähe", url:"https://www.dgfm-ev.de/"},
    {name:"MSKCC: Oyster Mushroom (Austernpilz)", url:"https://www.mskcc.org/cancer-care/integrative-medicine/herbs/oyster-mushroom"}
  ]}
];

/* Rezepte mit Speisepilzen. Küchenideen, keine Therapie: bewusst ohne Wirkversprechen.
   safe: Sicherheitshinweis aus den Pilzdaten, der beim Kochen zählt */
const RECIPES = [
  {id:"shiitake-pakchoi", title:"Shiitake-Pfanne mit Pak Choi und Ingwer", pilze:["shiitake"], zeit:20, portionen:2, art:"Hauptgericht",
   zutaten:["250 g frische Shiitake","2 kleine Pak Choi","1 Stück Ingwer (daumengroß)","2 Knoblauchzehen","2 EL Sojasauce","1 TL geröstetes Sesamöl","1 EL neutrales Öl","Reis oder Nudeln als Beilage"],
   schritte:["Harte Stiele der Shiitake abschneiden (für eine Brühe aufheben), Hüte in Streifen schneiden.","Ingwer und Knoblauch fein hacken, Pak Choi längs vierteln.","Öl stark erhitzen, Shiitake 5–6 Minuten unter Wenden braten, bis sie gebräunt und durchgegart sind.","Ingwer und Knoblauch 1 Minute mitbraten, dann Pak Choi dazu und 2–3 Minuten garen.","Mit Sojasauce ablöschen, Sesamöl darüber, mit Reis servieren."],
   tipp:"Shiitake nicht waschen, nur mit Küchenpapier abreiben. Sie saugen sonst Wasser und werden zäh.",
   safe:"Shiitake immer vollständig durchgaren. Roh oder halbgar kann er einen stark juckenden, streifigen Ausschlag auslösen (Shiitake-Dermatitis)."},
  {id:"shiitake-bruehe", title:"Shiitake-Brühe aus getrockneten Pilzen", pilze:["shiitake"], zeit:50, portionen:4, art:"Grundrezept",
   zutaten:["30 g getrocknete Shiitake (oder Stiele frischer Shiitake)","1 Stück Kombu-Alge (optional)","1 Zwiebel","1 Stück Ingwer","1,5 l Wasser","Sojasauce oder Salz"],
   schritte:["Getrocknete Shiitake 30 Minuten in 300 ml kaltem Wasser einweichen, Einweichwasser aufheben.","Pilze, Einweichwasser, restliches Wasser, halbierte Zwiebel, Ingwer und Kombu aufsetzen.","Kombu vor dem Kochen herausnehmen, alles 30–40 Minuten leise köcheln lassen.","Abseihen, mit Sojasauce oder Salz abschmecken. Pilze in Streifen schneiden und in die Suppe zurückgeben."],
   tipp:"Langes Köcheln ist nichts anderes als eine Heißwasser-Extraktion, so wie sie auch Pilzextrakte nutzen. Die Brühe lässt sich portionsweise einfrieren.",
   safe:"Eingeweichte Pilze am selben Tag verarbeiten und nicht lange bei Raumtemperatur stehen lassen."},
  {id:"austernpilz-gyros", title:"Austernpilz-Gyros mit Joghurtsoße", pilze:["pleurotus"], zeit:25, portionen:2, art:"Hauptgericht",
   zutaten:["400 g Austernpilze","1 rote Zwiebel","2 EL Olivenöl","1 TL Paprika edelsüß","1 TL Oregano","½ TL Kreuzkümmel","2 Knoblauchzehen","150 g Joghurt","½ Gurke","Salz, Pfeffer, Zitrone","Fladenbrot"],
   schritte:["Austernpilze mit den Händen in Streifen reißen, Zwiebel in Ringe schneiden.","Pilze in Öl bei hoher Hitze ohne Rühren anbraten, bis sie kross sind, dann wenden (8–10 Minuten).","Zwiebel, Gewürze und 1 gehackte Knoblauchzehe dazugeben, 2 Minuten weiterbraten, salzen.","Gurke raspeln, ausdrücken, mit Joghurt, der zweiten Knoblauchzehe, Salz und Zitrone verrühren.","Pilze mit Soße im warmen Fladenbrot servieren."],
   tipp:"Die Pfanne nicht überfüllen. Liegen die Pilze zu eng, dünsten sie im eigenen Saft statt zu bräunen.",
   safe:"Gut durchbraten. Austernpilze sind roh schwer verdaulich."},
  {id:"igelstachelbart-butter", title:"Igelstachelbart in Salbeibutter", pilze:["hericium"], zeit:15, portionen:2, art:"Vorspeise",
   zutaten:["250 g frischer Igelstachelbart (Hericium)","2 EL Butter","1 EL Öl","6 Salbeiblätter","1 Knoblauchzehe","Salz, Pfeffer","Zitrone","Baguette oder Risotto"],
   schritte:["Den Pilz in 1,5 cm dicke Scheiben schneiden.","Scheiben in einer trockenen Pfanne bei mittlerer Hitze andrücken, bis Wasser austritt und verdampft (3–4 Minuten).","Öl dazu, Scheiben von beiden Seiten goldbraun braten.","Butter, Salbei und angedrückten Knoblauch zugeben, die Scheiben mit der schäumenden Butter übergießen.","Salzen, pfeffern, mit etwas Zitrone servieren."],
   tipp:"Durch das Andrücken ohne Fett wird die Textur fest, ähnlich wie bei Jakobsmuscheln.",
   safe:"Selten allergische Reaktionen beschrieben. Beim ersten Mal eine kleine Portion probieren."},
  {id:"maitake-ofen", title:"Maitake aus dem Ofen mit Miso-Glasur", pilze:["maitake"], zeit:30, portionen:2, art:"Beilage",
   zutaten:["300 g Maitake (Klapperschwamm)","1 EL helle Misopaste","1 EL Honig oder Ahornsirup","1 EL Reisessig","2 EL Öl","Frühlingszwiebel, Sesam"],
   schritte:["Ofen auf 220 °C (Umluft 200 °C) vorheizen.","Maitake in handgroße Büschel teilen und auf ein Blech mit Backpapier legen.","Miso, Honig, Essig und Öl verrühren und die Büschel damit einpinseln.","20–25 Minuten rösten, bis die Ränder dunkel und knusprig sind.","Mit Frühlingszwiebel und Sesam bestreuen."],
   tipp:"Maitake gibt es frisch im Herbst auf Wochenmärkten und bei Edelpilz-Zuchten.",
   safe:"Kann den Blutzucker senken. Wer Diabetes-Medikamente nimmt, isst ihn als Speisepilz unproblematisch, sollte bei Extrakten aber Rücksprache halten."},
  {id:"miso-enoki-judasohr", title:"Miso-Suppe mit Enoki und Judasohr", pilze:["enoki","auricularia"], zeit:20, portionen:2, art:"Suppe",
   zutaten:["100 g Enoki","5 g getrocknetes Judasohr (Mu-Err)","200 g Tofu","2 EL Misopaste","700 ml Brühe (z. B. Shiitake-Brühe)","1 Frühlingszwiebel","1 Handvoll Spinat"],
   schritte:["Judasohr 15 Minuten in warmem Wasser einweichen, abspülen, harte Stellen entfernen, in Streifen schneiden.","Enoki vom Wurzelballen trennen, Tofu würfeln.","Brühe aufkochen, Judasohr und Enoki darin 4–5 Minuten sprudelnd kochen.","Tofu und Spinat dazu, Hitze reduzieren.","Miso mit etwas Brühe glatt rühren und einrühren, nicht mehr kochen lassen. Mit Frühlingszwiebel servieren."],
   tipp:"Miso zum Schluss einrühren, beim Kochen verliert es Aroma.",
   safe:"Enoki immer durchkochen: Rohe Enoki waren Ursache mehrerer Listeriose-Ausbrüche. Judasohr nach dem Einweichen sofort verwenden, nie über Stunden stehen lassen. Judasohr hemmt die Gerinnung: bei Blutverdünnern oder vor Operationen Rücksprache halten."},
  {id:"champignon-linsen", title:"Champignon-Linsen-Ragout", pilze:["champignon"], zeit:35, portionen:3, art:"Hauptgericht",
   zutaten:["400 g braune Champignons","150 g Berglinsen oder Beluga-Linsen","1 Zwiebel","1 Karotte","2 Zweige Thymian","1 EL Tomatenmark","100 ml Rotwein oder Brühe","400 ml Gemüsebrühe","2 EL Olivenöl","Salz, Pfeffer, Petersilie"],
   schritte:["Linsen abspülen. Zwiebel und Karotte fein würfeln, Champignons vierteln.","Champignons in Öl kräftig anbraten und herausnehmen.","Zwiebel und Karotte anschwitzen, Tomatenmark kurz mitrösten, mit Rotwein ablöschen.","Linsen, Brühe und Thymian dazu, 20–25 Minuten köcheln, bis die Linsen weich sind.","Champignons zurückgeben, 3 Minuten ziehen lassen, abschmecken, mit Petersilie servieren."],
   tipp:"Passt zu Polenta, Kartoffelpüree oder einfach Brot.",
   safe:"Champignons gegart essen, roh nur in kleinen Mengen. Pilze und Linsen sind purinreich: bei Gicht die Portion anpassen."},
  {id:"pilz-risotto", title:"Risotto mit gemischten Edelpilzen", pilze:["pleurotus","shiitake","hericium"], zeit:40, portionen:3, art:"Hauptgericht",
   zutaten:["400 g gemischte Edelpilze (Austernpilz, Shiitake, Igelstachelbart)","250 g Risottoreis","1 Schalotte","100 ml Weißwein","1 l heiße Brühe","40 g Parmesan oder Hefeflocken","2 EL Butter","2 EL Olivenöl","Salz, Pfeffer, Petersilie"],
   schritte:["Pilze putzen, in mundgerechte Stücke schneiden oder reißen und portionsweise in Öl scharf anbraten, salzen, beiseitestellen.","Schalotte fein würfeln und in 1 EL Butter glasig dünsten, Reis dazu und 1 Minute rühren.","Mit Wein ablöschen, dann nach und nach Brühe angießen und unter Rühren 18–20 Minuten garen.","Pilze unterheben, Hitze aus, restliche Butter und Parmesan einrühren, 2 Minuten ruhen lassen.","Mit Pfeffer und Petersilie servieren."],
   tipp:"Die Pilze getrennt braten und erst am Ende dazugeben, dann bleiben sie aromatisch und bissfest.",
   safe:"Alle Pilze vollständig durchgaren (besonders Shiitake)."}
];

const MUSHROOMS = base.MUSHROOMS.map(m => {
  const x = EXTRA[m.id];
  if (!x) throw new Error("Zusatzdaten fehlen für " + m.id);
  if (!PUBMED[m.id]) throw new Error("PubMed-Suchbegriff fehlt für " + m.id);
  return Object.assign({}, m, x, {pubmed: PUBMED[m.id], flags: Object.assign({schwanger:1}, x.flags)});
});

const out = "/* Automatisch erzeugt von tools/build-data.js — nicht von Hand bearbeiten. Stand: September 2026 */\n" +
  "window.PH = " + JSON.stringify({
    LEVELS: base.LEVELS, SCORE_LBL: base.SCORE_LBL, TAGS: base.TAGS, TAG_ICONS, FLAGS, BUY,
    MUSHROOMS, REFERENCE: base.REFERENCE, SHOPS, LINKS, RECIPES
  }) + ";\n";
fs.writeFileSync(path.join(__dirname, "..", "data.js"), out);
console.log("data.js geschrieben:", MUSHROOMS.length, "Pilze,", (out.length/1024).toFixed(0), "KB");
