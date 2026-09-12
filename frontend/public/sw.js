/**
 * Inspectra Pro — PWA Service Worker (v3 - Mobile Cloud Resilient)
 * Enables offline audits, asset caching, and background sync
 */

const CACHE_NAME = 'inspectra-cloud-v3';

// Activate Event: Clear ALL Old Legacy Caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Install Event: Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Fetch Event: Network First for all HTML navigation and JS/CSS bundles
self.addEventListener('fetch', (event) => {
  // Never intercept non-GET requests or external APIs
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // For HTML navigations: ALWAYS try Network first to ensure freshest bundle
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/') || caches.match('/200.html');
          });
        })
    );
    return;
  }

  // For static assets: Network First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

