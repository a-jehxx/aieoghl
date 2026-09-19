// 운영 빌드에서만 서비스 워커를 등록한다(개발 서버에서는 등록하지 않는다).
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // 등록 실패해도 앱 사용에는 지장이 없으므로 조용히 무시한다.
    });
  });
}
