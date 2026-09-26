// Holt Urheber und Lizenz aller verwendeten Fotos von der Wikimedia-Commons-API und
// schreibt tools/image-credits.json. build-data.js liest nur diese Datei; die API wird
// nicht bei jedem Build aufgerufen.
//
// Aufruf: node pilzhandel/tools/fetch-image-credits.js
// Danach: node pilzhandel/tools/build-data.js
//
// Nötig, wenn ein Foto in tools/build-data.js (EXTRA[...].imgs oder HERO) neu dazukommt
// oder sich entfernt — build-data.js warnt dann auf fehlende Einträge.
const fs = require("fs");
const path = require("path");
const { EXTRA, HERO } = require("./build-data.js");

const CACHE_PATH = path.join(__dirname, "image-credits.json");
const API = "https://commons.wikimedia.org/w/api.php";

const files = [...new Set([...Object.values(EXTRA).flatMap(x => x.imgs || []), ...HERO])].sort();

function stripHtml(s){
  return String(s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Commons-Artist-Felder sind oft ein ganzer Satz Vorlagentext mit dem eigentlichen Namen
// nur im ersten Link ("Diese Datei wurde erstellt von <a>Name</a> bei …"). Wir nehmen den
// Text des ersten Links, wenn vorhanden, sonst den ganzen (dann meist kurzen) Text.
function extractArtist(html){
  if(!html) return "";
  const m = String(html).match(/<a[^>]*>([^<]*)<\/a>/);
  return stripHtml(m ? m[1] : html);
}

function chunk(arr, size){
  const out = [];
  for(let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchChunk(names){
  const titles = names.map(n => "File:" + n).join("|");
  const url = `${API}?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=extmetadata&format=json&formatversion=2`;
  const res = await fetch(url, { headers: { "User-Agent": "PilzHandel/1.0 (privates Informationsprojekt; https://stephandel.github.io/heilpilze/)" } });
  if(!res.ok) throw new Error(`Commons-API antwortet mit ${res.status} für ${names.length} Datei(en)`);
  const data = await res.json();
  const pages = (data.query && data.query.pages) || [];
  // normalized: API kann "File:Foo_bar.jpg" auf "File:Foo bar.jpg" abbilden; wir matchen zurück per Titel ohne "File:"
  const norm = new Map((data.query.normalized || []).map(n => [n.to, n.from]));
  const result = {};
  for(const page of pages){
    if(!page.title) continue;
    const canonicalTitle = page.title; // "File:Foo bar.jpg"
    const originalTitle = norm.get(canonicalTitle) || canonicalTitle; // wie im Aufruf verwendet
    const origName = originalTitle.replace(/^File:/, "");
    if(page.missing){ console.warn(`  fehlt auf Commons: ${origName}`); continue; }
    const info = page.imageinfo && page.imageinfo[0];
    const meta = (info && info.extmetadata) || {};
    const artist = extractArtist(meta.Artist && meta.Artist.value);
    const license = stripHtml(meta.LicenseShortName && meta.LicenseShortName.value);
    const licenseUrl = meta.LicenseUrl && meta.LicenseUrl.value;
    if(!artist && !license){ console.warn(`  keine Urheber-/Lizenzangabe gefunden: ${origName}`); continue; }
    result[origName] = { artist: artist || "", license: license || "", licenseUrl: licenseUrl || "" };
  }
  return result;
}

async function main(){
  console.log(`Frage Urheber und Lizenz für ${files.length} Foto(s) bei Wikimedia Commons ab …`);
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")); } catch(e){ /* erster Lauf */ }
  const merged = {};
  for(const batch of chunk(files, 50)){
    try{
      Object.assign(merged, await fetchChunk(batch));
    }catch(err){
      console.warn(`  Abfrage fehlgeschlagen (${err.message}) — behalte vorhandene Einträge für diesen Stapel.`);
      for(const f of batch) if(cache[f]) merged[f] = cache[f];
    }
  }
  const missing = files.filter(f => !merged[f]);
  if(missing.length){
    console.warn(`${missing.length} Foto(s) ohne Nachweis geblieben: ${missing.join(", ")}`);
    console.warn("Diese Fotos zeigen weiter nur den Link zur Dateiseite, keinen Urheber/Lizenz-Text.");
  }
  const sorted = Object.fromEntries(Object.keys(merged).sort().map(k => [k, merged[k]]));
  fs.writeFileSync(CACHE_PATH, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`image-credits.json geschrieben: ${Object.keys(sorted).length} von ${files.length} Foto(s). Jetzt: node pilzhandel/tools/build-data.js`);
}

main().catch(err => { console.error(err); process.exit(1); });
