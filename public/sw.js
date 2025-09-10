// Choose a cache name
const CACHE_NAME = 'moneyhive-pwa-cache-v1';

// List the files to precache
const precacheFiles = [
  '/',
  '/add-expense',
  '/expenses',
  '/reminders',
  '/scan',
  '/settings',
  '/offline.html'
];

// The install event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Get the paths of all the static assets from the build manifest
      return fetch('/_next/static/chunks/build-manifest.json')
        .then(response => response.json())
        .then(manifest => {
            const allFiles = Object.values(manifest).flat();
            // Add other static assets you might want to cache
            const staticAssets = [
                '/_next/static/css/',
                '/_next/static/media/'
            ];
            const filesToCache = [...precacheFiles, ...allFiles, ...staticAssets];
            return cache.addAll(filesToCache);
        });
    })
  );
});

// The activate event is fired when the service worker is activated.
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
});


// The fetch event is fired for every network request.
self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // If the request is in the cache, return it.
          if (response) {
            return response;
          }
  
          // Otherwise, fetch the request from the network.
          return fetch(event.request).then((response) => {
            // If the request is successful, cache it and return it.
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          });
        })
        .catch(() => {
            // If the fetch fails (i.e., user is offline), return the offline fallback page.
            if (event.request.mode === 'navigate') {
                 return caches.match('/offline.html');
            }
        })
    );
  });

  // Handle periodic background sync for checking reminders
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-reminders') {
      event.waitUntil(
        // This is a placeholder for the logic to check reminders and show notifications.
        // The actual logic lives in the client-side code, but this ensures the
        // service worker can be woken up to perform the check.
        console.log("Periodic sync for reminders triggered.")
      );
    }
  });
  
  // Handle notification click
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  });
  
