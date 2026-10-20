// Prüft: Ein Update löscht nur alte eigene App-Speicher (ph-v…), behält die Fotos (ph-media)
// und lässt die Speicher anderer Apps unter stephandel.github.io in Ruhe.
// Aufruf: node --test pilzhandel/tools/sw-speicher.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const FREMDE = ['wpc-v40', 'wedda-v12', 'wedder-v3', 'fuerte-v118'];

test('sw.js: Update löscht nur alte ph-v-Speicher', async () => {
  const code = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const eigen = code.match(/const VERSION = "([^"]+)"/)[1];
  const m = new Map([...FREMDE, 'ph-v1', 'ph-media', eigen].map(n => [n, {}]));
  const caches = { keys: async () => [...m.keys()], delete: async n => m.delete(n) };
  const h = {};
  const self = { addEventListener: (t, f) => { h[t] = f; }, skipWaiting() {}, clients: { claim: async () => {} } };
  vm.runInNewContext(code, { self, caches, location: { origin: 'https://stephandel.github.io' }, URL, Promise });
  let warten; h.activate({ waitUntil: p => { warten = p; } }); await warten;
  assert.deepEqual([...m.keys()].sort(), [...FREMDE, 'ph-media', eigen].sort());
});
