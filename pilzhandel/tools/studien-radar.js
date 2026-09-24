// Studien-Radar: sucht in PubMed nach neuen Humanstudien pro Pilz und schreibt pilzhandel/radar.js.
// Aufruf: node pilzhandel/tools/studien-radar.js [Tage]   (Standard: 365)
// Halbautomatisch gedacht: Skript laufen lassen, Treffer sichten, relevante Studien von Hand
// in heilpilze.html einstufen, dann radar.js mit committen. Die App zeigt die Treffer
// ausdrücklich als „noch nicht eingestuft“.
const fs = require("fs");
const path = require("path");
global.window = {};
require(path.join(__dirname, "..", "data.js"));
const M = window.PH.MUSHROOMS;

const DAYS = Math.max(1, parseInt(process.argv[2] || "365", 10));
const MAX = 8; // Treffer pro Pilz in radar.js
const FETCH = 30; // so viele neueste Treffer werden geholt und nach Studientyp sortiert
const RANK = [/Meta-Analysis/, /Systematic Review/, /Randomized Controlled Trial/, /Clinical Trial/, /Review/];
const rank = t => { const i = RANK.findIndex(r => r.test(t)); return i < 0 ? RANK.length : i; };
const EU = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
// Neue Artikel tragen Publikationstypen oft erst Monate später, deshalb zusätzlich Stichwörter
const TYPES = '(randomized controlled trial[pt] OR meta-analysis[pt] OR systematic review[pt] OR clinical trial[pt]' +
  ' OR randomized[tiab] OR randomised[tiab] OR placebo[tiab] OR meta-analysis[tiab] OR "systematic review"[tiab]' +
  ' OR "clinical trial"[tiab] OR "pilot study"[tiab] OR "healthy adults"[tiab] OR volunteers[tiab])';
const NOT_ANIMAL = ' NOT (mice[ti] OR mouse[ti] OR rats[ti] OR rat[ti] OR murine[ti] OR "in vitro"[ti] OR zebrafish[ti] OR broiler*[ti] OR piglets[ti])';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// "A B" OR C  →  ("A B"[tiab] OR C[tiab])
const tiab = q => "(" + q.split(/\s+OR\s+/).map(t => t.trim() + "[tiab]").join(" OR ") + ")";

async function get(url){
  for(let i = 0; i < 3; i++){
    const res = await fetch(url, {headers: {"User-Agent": "pilzhandel-studienradar/1.0"}});
    if(res.ok) return res.json();
    await sleep(1500);
  }
  throw new Error("PubMed antwortet nicht: " + url);
}

(async () => {
  const items = {};
  let total = 0;
  for(const m of M){
    const term = tiab(m.pubmed) + " AND " + TYPES + NOT_ANIMAL;
    const s = await get(`${EU}esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&datetype=pdat&reldate=${DAYS}&retmax=${FETCH}&term=${encodeURIComponent(term)}`);
    const ids = s.esearchresult.idlist;
    const count = +s.esearchresult.count;
    await sleep(400); // ohne API-Schlüssel max. 3 Anfragen pro Sekunde
    let list = [];
    if(ids.length){
      const sum = await get(`${EU}esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`);
      list = ids.map(id => sum.result[id]).filter(Boolean).map(r => ({
        pmid: r.uid,
        title: r.title.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
        journal: r.source,
        date: r.sortpubdate ? r.sortpubdate.slice(0, 10).replace(/\//g, "-") : r.pubdate,
        type: (r.pubtype || []).slice().sort((a, b) => rank(a) - rank(b)).find(t => rank(t) < RANK.length) || ""
      })).sort((a, b) => rank(a.type) - rank(b.type) || b.date.localeCompare(a.date)).slice(0, MAX);
      await sleep(400);
    }
    items[m.id] = {count, list};
    total += count;
    console.log(m.name.padEnd(34), String(count).padStart(3), "Treffer");
  }
  const out = "/* Automatisch erzeugt von tools/studien-radar.js — nicht von Hand bearbeiten. */\n" +
    "window.PH_RADAR = " + JSON.stringify({stand: new Date().toISOString().slice(0, 10), tage: DAYS, items}) + ";\n";
  fs.writeFileSync(path.join(__dirname, "..", "radar.js"), out);
  console.log(`radar.js geschrieben: ${total} Treffer in den letzten ${DAYS} Tagen`);
})().catch(e => { console.error(e.message); process.exit(1); });
