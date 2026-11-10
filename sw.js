/* BoneUp offline cache.
   The page (index.html, ~29 MB) is kept in the cache after the first visit, so it opens without internet
   and is not downloaded again on every visit. version.json is always read from the network; when it
   shows a newer build, the page offers an update and refreshes this cache itself. */
const CACHE = 'boneup-v1';
const PAGE = './';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.match(PAGE).then(hit => hit || c.add(PAGE))).catch(() => {}));
});

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const path = url.pathname.replace(/\/+$/, '/');
  const isPage = req.mode === 'navigate' || path.endsWith('/index.html') || path === new URL(PAGE, location).pathname;
  if (!isPage) return;                       // version.json, icons, manifest: normal network
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(PAGE);
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok) c.put(PAGE, r.clone());
      return r;
    } catch (err) {
      return new Response('<h2 dir="rtl" style="font-family:sans-serif;text-align:center;margin-top:30vh">افتح BoneUp مرة واحدة وإنت متصل بالنت، وبعد كده هيشتغل من غير نت.</h2>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
  })());
});
