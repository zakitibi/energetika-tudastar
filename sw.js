/* Energetika — service worker.
 *
 * Szabály:
 *  - AZ OLDAL (HTML, navigáció): HÁLÓZAT ELŐSZÖR. Online mindig a legfrissebb változat jön;
 *    ha 4 s alatt nincs válasz vagy nincs net, a gyorsítótárban lévő utolsó példány.
 *    (Korábban az oldal is cache-ből jött — telepített PWA-ban ez beragasztotta a régi
 *    változatot, lásd lent.)
 *  - MINDEN MÁS (ikonok, manifest stb.): 1 napig a gyorsítótárból, a háttérben frissítve;
 *    24 óra fölött hálózat először; offline a lejárt példány is kimegy.
 *
 * Miért URL-lel kérünk a hálózattól: egy 'navigate' módú Request + nem üres init egyes
 * böngészőkben (régebbi WebKit/Chrome) TypeError-t dob — így a háttérfrissítés csendben
 * elbukott, és a PWA örökre a régi oldalt kapta.
 *
 * A fiók ↻ gombja a CLEAR üzenettel üríti az egészet, és utána hálózatról tölt újra.
 * A letöltés idejét az "x-cached-at" fejléc hordozza a bemásolt válaszon — ebből írja ki
 * a fiók lábrésze, hogy mikori állapotot látsz. Ha a CACHE név változik, a shell
 * cacheAge() függvényében is át kell írni.
 */
const CACHE    = 'energetika-v2';          /* v1 → v2: a beragadt régi példányok törlése */
const MAX_AGE  = 24 * 60 * 60 * 1000;      /* kiegészítő fájlok: 1 nap */
const PAGE_WAIT = 4000;                    /* ennyit vár a hálózatra, mielőtt a cache-hez nyúl */

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))   /* régi változatok el */
    .then(() => self.clients.claim())
));

self.addEventListener('message', e => {
  if (e.data !== 'CLEAR') return;
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => { if (e.source) e.source.postMessage('CLEARED'); })
  );
});

/* a gyorsítótár kulcsa query nélkül (a ↻ ?v=<ts> paramétere ne szaporítsa a bejegyzéseket) */
function keyOf(req) { const u = new URL(req.url); u.search = ''; u.hash = ''; return u.toString(); }

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
  const res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });   /* URL-lel, ld. fent */
  if (res && res.ok && res.type === 'basic') await cache.put(keyOf(req), await stamped(res));
  return res;
}

function isPage(req) {
  if (req.mode === 'navigate' || req.destination === 'document') return true;
  const p = new URL(req.url).pathname;
  return p.endsWith('.html') || p.endsWith('/');
}

/* oldal: hálózat először, időkorláttal; a cache csak tartalék */
async function page(e, cache, req) {
  const hit = await cache.match(keyOf(req));
  const net = fromNetwork(cache, req);
  e.waitUntil(net.catch(() => {}));                           /* lassú hálózatnál is frissüljön a cache */
  if (!hit) return net;
  try {
    const res = await Promise.race([net, new Promise(r => setTimeout(() => r(null), PAGE_WAIT))]);
    if (res && res.ok) return res;
  } catch (err) { /* offline: marad a cache */ }
  return hit;
}

/* kiegészítő fájl: 1 napig cache, háttérfrissítéssel */
async function asset(e, cache, req) {
  const hit = await cache.match(keyOf(req));
  if (hit && age(hit) < MAX_AGE) {
    e.waitUntil(fromNetwork(cache, req).catch(() => {}));
    return hit;
  }
  try { return await fromNetwork(cache, req); }
  catch (err) { if (hit) return hit; throw err; }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;   /* idegen hosztot nem tárolunk */
  e.respondWith(caches.open(CACHE).then(cache => isPage(req) ? page(e, cache, req) : asset(e, cache, req)));
});
