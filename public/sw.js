// في ملف public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('devices-v1').then(cache => {
      return cache.addAll(['/api/devices']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/devices')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});