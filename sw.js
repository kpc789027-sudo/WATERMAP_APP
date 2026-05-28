// =============================================
// Service Worker - 물지도 전자야장 V26
// 버전을 올리면 기존 캐시가 자동 삭제됩니다
// =============================================

const CACHE_VERSION = 'v26';
const CACHE_NAME = 'watermap-' + CACHE_VERSION;

const CACHE_FILES = [
  './watermap_V26.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 필요한 파일 캐시에 저장
self.addEventListener('install', function(event) {
  console.log('[SW] 설치 중... 버전:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(CACHE_FILES);
      })
      .then(function() {
        console.log('[SW] 캐시 완료');
        return self.skipWaiting(); // 즉시 활성화
      })
  );
});

// 활성화: 구버전 캐시 모두 삭제
self.addEventListener('activate', function(event) {
  console.log('[SW] 활성화... 구버전 캐시 정리');
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys
            .filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) {
              console.log('[SW] 구버전 삭제:', key);
              return caches.delete(key);
            })
        );
      })
      .then(function() {
        return self.clients.claim(); // 즉시 모든 탭 제어
      })
  );
});

// 요청 처리: 캐시 우선 + 백그라운드 업데이트
self.addEventListener('fetch', function(event) {
  // POST 요청(구글시트/드라이브 업로드)은 캐시 안 함
  if (event.request.method !== 'GET') return;

  // 구글 API 요청은 캐시 안 함
  const url = event.request.url;
  if (url.includes('script.google.com') || url.includes('googleapis.com')) return;

  event.respondWith(
    caches.match(event.request)
      .then(function(cached) {
        // 캐시 있으면 즉시 반환 + 백그라운드에서 최신 버전 갱신
        if (cached) {
          fetch(event.request)
            .then(function(response) {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then(function(cache) {
                  cache.put(event.request, response);
                });
              }
            })
            .catch(function() {});
          return cached;
        }
        // 캐시 없으면 네트워크 요청
        return fetch(event.request)
          .catch(function() {
            return new Response(
              '<h2 style="font-family:sans-serif;text-align:center;margin-top:40px;">📵 오프라인 상태입니다.<br><small>앱을 다시 열어주세요.</small></h2>',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          });
      })
  );
});
