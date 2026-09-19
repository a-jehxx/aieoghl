const STORAGE_KEY = 'hsm.ownerUid';

/**
 * 계정 로그인이 없는 지금 단계에서 집의 소유자를 구분하기 위한 임시 로컬 id.
 * 이후 Firebase 익명 로그인을 연결하면 이 함수 내부만 실제 인증 uid로 교체한다.
 */
export function getOwnerUid(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return 'local-owner';
  }
}
