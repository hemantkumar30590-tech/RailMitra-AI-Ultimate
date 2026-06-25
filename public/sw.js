const CACHE_NAME = 'railmitra-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching essential app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing older cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin GET requests
  const isSameOrigin = event.request.url.startsWith(self.location.origin);
  const isGet = event.request.method === 'GET';
  
  if (!isSameOrigin || !isGet) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache for performance, but fetch background update for assets (Stale-While-Revalidate)
        if (!event.request.url.includes('/api/')) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Only cache successful assets, do not cache API calls to index.json or live scraping
        const isApi = event.request.url.includes('/api/');
        if (networkResponse.status === 200 && !isApi) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback: return the app shell home if offline and requesting HTML/assets
      if (event.request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/');
      }
    })
  );
});
