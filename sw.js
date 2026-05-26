const CACHE_NAME = 'forest-survey-v3';
const FILENAME = encodeURIComponent('물지도_전자야장') + '.html';
const BASE = '/html_change/';

const CACHE_FILES = [
  BASE + FILENAME,
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

// 설치 - 핵심 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        CACHE_FILES.map(url => cache.add(url).catch(e => console.log('캐시 실패:', url)))
      );
    })
  );
  self.skipWaiting();
});

// 활성화 - 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리 - 오프라인 시 캐시 사용
self.addEventListener('fetch', event => {
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('drive.google.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match(BASE + FILENAME);
        }
      });
    })
  );
});
