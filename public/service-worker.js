// 설치 조건(installability)만 채우는 최소 서비스 워커. 오프라인 캐시는 하지 않는다.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 모든 요청을 그대로 네트워크로 통과시킨다.
self.addEventListener('fetch', () => {});
