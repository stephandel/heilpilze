/* Pilz Handel · Service Worker
   App-Dateien: zuerst aus dem Cache, im Hintergrund aktualisieren.
   Schriften liegen lokal im App-Cache. Fotos: nach dem ersten Laden aus dem Cache (offline verfügbar). */
const VERSION = "ph-v9";
const SHELL = ["./", "index.html", "app.css", "app.js", "logic.js", "betreiber.js", "data.js", "radar.js", "icon.svg", "logo.svg", "manifest.webmanifest", "icons/icon-192.png",
  "fonts/fonts.css", "fonts/DMSans-normal-latin.woff2", "fonts/DMSans-italic-latin.woff2", "fonts/Fraunces-normal-latin.woff2", "fonts/Fraunces-italic-latin.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== "ph-media").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const media = /commons\.wikimedia\.org|upload\.wikimedia\.org/.test(url.hostname);
  if (media) {
    e.respondWith(caches.open("ph-media").then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }
      catch (err) { return hit || Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
