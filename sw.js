const CACHE_VERSION = 'v68';
const CACHE_NAME = 'watermap-' + CACHE_VERSION;
const CACHE_FILES = [
  './watermap_V68.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(CACHE_FILES); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys.filter(function(key) { return key !== CACHE_NAME; })
              .map(function(key) { return caches.delete(key); })
        );
      })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  if (url.includes('script.google.com') || url.includes('googleapis.com')) return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, response);
            });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(event.request).catch(function() {
        return new Response(
          '<h2 style="font-family:sans-serif;text-align:center;margin-top:40px;">📵 오프라인 상태입니다.<br><small>앱을 다시 열어주세요.</small></h2>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
