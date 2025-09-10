// Choose a cache name
const CACHE_NAME = 'moneyhive-cache-v1';
// List the files to precache
const PRECACHE_ASSETS = [
  '/',
  '/add-expense',
  '/expenses',
  '/reminders',
  '/settings',
  '/scan',
  '/offline.html' // A fallback page
];

// Listener for the install event - precaches the assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching pre-cache assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Listener for the activate event - cleans up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Become the service worker for currently open tabs.
});

// Listener for the fetch event - serves assets from cache or network
self.addEventListener('fetch', event => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, use a network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline.html')) // Fallback to offline page
    );
    return;
  }

  // For other requests (CSS, JS, images), use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(response => {
        // Cache the new response for future use
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});


// --- Reminder Notification Logic ---

// Listener for periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkRemindersAndNotify());
  }
});

// Listener for when the user clicks on a notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus().then(c => c.navigate(targetUrl));
            }
            return clients.openWindow(targetUrl);
        })
    );
});


async function checkRemindersAndNotify() {
    console.log('Service Worker: Checking reminders in background...');
    const reminders = await getRemindersFromDB();
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    reminders.forEach(reminder => {
        const dueDate = new Date(reminder.dueDate);
        dueDate.setHours(0,0,0,0);
        
        let notificationBody = null;

        if (dueDate.getTime() === today.getTime()) {
             notificationBody = `${reminder.title} is due today.`;
        } else if (dueDate.getTime() === tomorrow.getTime()) {
            notificationBody = `${reminder.title} is due tomorrow.`;
        }

        if (notificationBody) {
             self.registration.showNotification('Upcoming Expense Reminder', {
                body: notificationBody,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                tag: `reminder-${reminder.id}`,
                data: { url: '/reminders' },
            });
        }
    });
}


// --- IndexedDB Access (needed for background check) ---
// This is a simplified version of the db logic to avoid importing complex modules

function getRemindersFromDB() {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('MoneyHiveDB');

        openRequest.onerror = () => {
            console.error("Error opening DB for SW", openRequest.error);
            reject(openRequest.error);
        };

        openRequest.onsuccess = () => {
            const db = openRequest.result;
            if (!db.objectStoreNames.contains('reminders')) {
                console.log('SW: Reminders store not found');
                resolve([]);
                return;
            }
            const transaction = db.transaction('reminders', 'readonly');
            const store = transaction.objectStore('reminders');
            const getAllRequest = store.getAll();

            getAllRequest.onerror = () => {
                console.error("Error getting reminders from DB for SW", getAllRequest.error);
                reject(getAllRequest.error);
            };

            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result);
            };
        };
    });
}
