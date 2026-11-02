// Offline app shell. Data is not cached here: Firestore keeps its own offline cache.
//   pages:        network first, cached index.html when offline
//   /assets/*:    cache first (file names change with every build)
//   other files:  served from cache, refreshed in the background
//   fonts:        same, for Google Fonts
const CACHE = 'cost-tracker-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];

// Also cache the build's JS/CSS that index.html points to, so the very first install already works offline.
async function precache() {
  const c = await caches.open(CACHE);
  await c.addAll(SHELL);
  const html = await (await c.match('/index.html')).text();
  await c.addAll([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]));
}

self.addEventListener('install', (e) => { e.waitUntil(precache().then(() => self.skipWaiting())); });

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => { if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone())); return res; };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  // Leave Firebase sign-in and everything cross-origin (Firestore, Google) to the network.
  if ((url.origin !== location.origin && !fonts) || url.pathname.startsWith('/__/')) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => put('/index.html', res)).catch(() => caches.match('/index.html')));
  } else if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
  } else {
    e.respondWith(caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => put(req, res)).catch(() => hit);
      return hit || fresh;
    }));
  }
});
