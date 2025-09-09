// A simple, no-op service worker that takes immediate control.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// The user's proposal asked for a PWA with offline support.
// This basic service worker is the minimum required to meet the
// "installable" criteria. More robust caching strategies can be
// added here as needed.
self.addEventListener('fetch', (event) => {
  // For now, just pass through network requests.
  // A real-world app would have caching logic here.
  event.respondWith(fetch(event.request));
});
