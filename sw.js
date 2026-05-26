const CACHE_NAME = 'forest-survey-v1';
const URLS_TO_CACHE = [
  '/html_change/',
  '/html_change/index.html',
  '/html_change/forest_survey_app_v21.html'
];

// 설치 시 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 요청 처리 - 오프라인 시 캐시에서 응답
self.addEventListener('fetch', event => {
  // Google Sheets API 요청은 캐시 안 함
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('drive.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // HTML/JS/CSS만 캐시
        if (response && response.status === 200 &&
            ['document','script','style'].includes(event.request.destination)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 오프라인이고 캐시도 없으면 오프라인 페이지
        if (event.request.destination === 'document') {
          return caches.match('/html_change/forest_survey_app_v21.html');
        }
      });
    })
  );
});
