/* Energetika — service worker: 1 napig érvényes gyorsítótár.
 *
 * Szabály:
 *  - a másolat 24 óránál fiatalabb  → azonnal a cache-ből megy ki, és a háttérben
 *    frissül (stale-while-revalidate), tehát a következő betöltés már a friss;
 *  - a másolat 24 óránál öregebb    → előbb a hálózat, és csak hiba esetén a cache;
 *  - offline                        → a lejárt másolat is jobb a semminél.
 *
 * A fiók ↻ gombja a CLEAR üzenettel üríti az egészet, és utána hálózatról tölt újra.
 * A letöltés idejét az "x-cached-at" fejlécben tároljuk a bemásolt válaszon — ebből
 * írja ki a fiók lábrésze, hogy mikori állapotot látsz.
 */
const CACHE   = 'energetika-v1';
const MAX_AGE = 24 * 60 * 60 * 1000;   /* 1 nap */

self.addEventListener('install',  e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', e => {
  if (e.data !== 'CLEAR') return;
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => { if (e.source) e.source.postMessage('CLEARED'); })
  );
});

/* a cache.put-ra menő másolat megkapja a letöltés idejét */
async function stamped(res) {
  const body = await res.clone().blob();
  const h = new Headers(res.headers);
  h.set('x-cached-at', new Date().toUTCString());
  return new Response(body, { status: res.status, statusText: res.statusText, headers: h });
}

function age(res) {
  const t = Date.parse(res.headers.get('x-cached-at') || '');
  return isNaN(t) ? Infinity : Date.now() - t;
}

async function fromNetwork(cache, req) {
  const res = await fetch(req, { cache: 'no-cache' });
  if (res && res.ok && res.type === 'basic') await cache.put(req, await stamped(res));
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;   /* idegen hosztot nem tárolunk */

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit   = await cache.match(req, { ignoreSearch: true });

    if (hit && age(hit) < MAX_AGE) {
      e.waitUntil(fromNetwork(cache, req).catch(() => {}));   /* friss másolat a következőre */
      return hit;
    }
    try {
      return await fromNetwork(cache, req);
    } catch (err) {
      if (hit) return hit;                                    /* offline: a lejárt is jobb */
      throw err;
    }
  })());
});
