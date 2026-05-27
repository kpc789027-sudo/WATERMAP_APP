// =============================================
// Service Worker - 물지도 전자야장 V21
// 버전을 올리면 캐시가 갱신됩니다
// =============================================

const CACHE_VERSION = 'v21';
const CACHE_NAME = 'watermap-' + CACHE_VERSION;

const CACHE_FILES = [
  './watermap_V21.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 캐시 파일 저장
self.addEventListener('install', function(event) {
  console.log('[SW] 설치 중... 버전:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    }).then(function() {
      console.log('[SW] 캐시 완료');
      return self.skipWaiting();
    })
  );
});

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', function(event) {
  console.log('[SW] 활성화... 구버전 캐시 정리');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          console.log('[SW] 구버전 삭제:', key);
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 요청 처리: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', function(event) {
  // POST 요청(구글시트 업로드)은 캐시 안 함
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        // 백그라운드에서 최신 버전 갱신 시도
        fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, response);
            });
          }
        }).catch(function() {});
        return cached;
      }
      // 캐시 없으면 네트워크
      return fetch(event.request).catch(function() {
        // 오프라인 + 캐시 없음
        return new Response('오프라인 상태입니다.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
