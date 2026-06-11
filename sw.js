// 물지도 전자야장 Service Worker
// CACHE_NAME을 배포할 때마다 증가시켜 캐시 갱신
const CACHE_NAME = 'watermap-v100';

const PRECACHE_URLS = [
  './watermap_V100.html',
  './manifest.json'
];

// 설치: 핵심 파일 선캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 요청 처리: Cache-First (앱 파일) / Network-First (API)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Apps Script / Sheets / Drive API → 항상 네트워크
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
        // 정상 응답만 캐시에 저장
        if (
          response &&
          response.status === 200 &&
          response.type !== 'opaque'
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    }).catch(() => {
      // 오프라인 + 캐시 없음 → HTML 폴백
      if (event.request.destination === 'document') {
        return caches.match('./watermap_V100.html');
      }
    })
  );
});
