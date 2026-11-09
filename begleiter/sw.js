/* Pilz-Begleiter · Service Worker (Muster wie pilzhandel/sw.js)
   App-Dateien: zuerst aus dem Cache, im Hintergrund aktualisieren. Nach jeder Änderung VERSION hochzählen. */
const VERSION = "pb-v1";
const SHELL = ["./", "index.html", "begleiter.css", "app.js", "logik.js", "manifest.webmanifest",
  "../pilzhandel/data.js", "../pilzhandel/icon.svg", "../pilzhandel/icons/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("pb-v") && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
