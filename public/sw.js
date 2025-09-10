// A robust service worker based on the "stale-while-revalidate" and "cache-first" strategies.

const CACHE_NAME = 'moneyhive-cache-v1';
const OFFLINE_URL = 'offline.html';

// The list of files to be cached on install
const PRECACHE_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/badge-72x72.png',
    // Add other critical assets like CSS, JS, fonts if they are not dynamically loaded
];

// 1. Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Pre-caching the assets is important for the app to work offline.
      await cache.addAll(PRECACHE_ASSETS);
    })()
  );
  self.skipWaiting();
});

// 2. Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preloading if it's supported.
      // https://developers.google.com/web/updates/2017/02/navigation-preload
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
          cacheNames.map(name => {
              if (name !== CACHE_NAME) {
                  return caches.delete(name);
              }
          })
      );

    })()
  );
  self.clients.claim();
});


// 3. Intercept fetch requests and serve from cache or network
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, use a network-first strategy.
  // If the network fails, fall back to the offline page.
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
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
    return;
  }
  
  // For other assets (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If the resource is not in the cache, try to fetch it from the network.
      try {
        const networkResponse = await fetch(event.request);
        // If the fetch is successful, clone the response and store it in the cache.
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
         // If the network request fails and it's an image, return a placeholder.
         if (event.request.destination === 'image') {
            // You can return a placeholder image from the cache here if you have one.
         }
        // For other failed requests, you might want to return a more generic error response.
        return null;
      }
    })()
  );

});


// Listen for the 'message' event to handle periodic sync registrations from the client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'REGISTER_PERIODIC_SYNC') {
        if (self.registration.periodicSync) {
            self.registration.periodicSync.register('check-reminders', {
                minInterval: 12 * 60 * 60 * 1000, // 12 hours
            }).then(() => {
                console.log('Periodic sync for reminders registered.');
            }).catch((error) => {
                console.error('Periodic sync registration failed:', error);
            });
        }
    }
});


// Handle periodic sync events for reminders
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-reminders') {
        event.waitUntil(
            // Here you would fetch reminders from IndexedDB and show a notification.
            // This requires access to IndexedDB from the service worker, which is possible.
            // For simplicity, this is a placeholder.
            console.log('Periodic sync event for reminders fired.')
        );
    }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      const hadWindowToFocus = clientsArr.some((windowClient) =>
        windowClient.url === event.notification.data.url
          ? (windowClient.focus(), true)
          : false
      );
      if (!hadWindowToFocus)
        self.clients.openWindow(event.notification.data.url).then((windowClient) => (windowClient ? windowClient.focus() : null));
    })
  );
});
