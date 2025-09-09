const CACHE_NAME = 'pennypincher-cache-v1';
const urlsToCache = [
  '/',
  '/add-expense',
  '/expenses',
  '/reports',
  '/settings',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});


self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                        return preloadResponse;
                    }
                    const networkResponse = await fetch(event.request);
                    return networkResponse;
                } catch (error) {
                    console.log('Fetch failed; returning offline page instead.', error);
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(event.request.url);
                    return cachedResponse || cache.match('/');
                }
            })()
        );
    } else if (urlsToCache.some(url => event.request.url.includes(url))) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    } else {
         event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                const networkResponse = await fetch(event.request);
                // Only cache successful GET requests
                if (event.request.method === 'GET' && networkResponse.ok) {
                  await cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            })
        );
    }
});
