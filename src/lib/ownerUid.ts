import { generateId } from '@/lib/id';
import { getAuthReady, hasFirebaseConfig } from '@/firebase/app';

const STORAGE_KEY = 'hsm.ownerUid';

/**
 * 집의 소유자를 구분하는 id. Firebase가 연결되어 있으면 익명 로그인 uid를 쓰고,
 * (설정값이 없어 메모리 구현으로 동작할 때는) 기기에 저장해둔 임시 로컬 id를 쓴다.
 */
export async function getOwnerUid(): Promise<string> {
  if (hasFirebaseConfig()) {
    return getAuthReady();
  }
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = generateId();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return 'local-owner';
  }
}
