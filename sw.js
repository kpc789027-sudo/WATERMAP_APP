// 물지도 전자야장 Service Worker
// 새 버전 배포 시 CACHE_NAME 숫자 올릴 것 (예: watermap_V101)
const CACHE_NAME = 'watermap_V100';

const PRECACHE_URLS = [
  './watermap_V100.html',
  './manifest.json'
];

// 설치: 핵심 파일 선캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 버전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 요청 처리
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google API (Apps Script / Sheets / Drive) → 항상 네트워크
  if (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('sheets.googleapis.com') ||
    url.hostname.includes('drive.googleapis.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 앱 파일 → Cache-First, 실패 시 네트워크
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('./watermap_V100.html');
      }
    })
  );
});
