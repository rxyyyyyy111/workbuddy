const CACHE = 'workbuddy-v102';
const ASSETS = [
  './workbuddy.html',
  './manifest.json',
  './图标.png',
  './狮狮.jpg',
  './花生酱.png',
  './蛋小黄.png',
  './邪恶大耳狗.png',
  './小智.png',
  'https://cdn.tailwindcss.com/',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch: network-first for HTML, cache-first for others
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Don't cache API calls
  if (url.pathname.includes('/v1/chat/completions')) return;

  // HTML: ALWAYS fetch from network, never cache (to avoid stale code)
  if (e.request.destination === 'document' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Everything else: cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
