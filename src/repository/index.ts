import { createMemoryRepository } from './memoryRepository';
import { createFirebaseRepository } from './firebaseRepository';
import { hasFirebaseConfig } from '@/firebase/app';
import type { Repository } from './types';

export type { Repository } from './types';
export { createMemoryRepository } from './memoryRepository';

// .env에 Firebase 설정값이 있으면 Firebase로, 없으면 메모리 구현으로 동작한다.
// 설정 없이도 앱이 오류 없이 열려야 하므로 여기서 자동으로 대신 쓴다.
const realRepository: Repository = hasFirebaseConfig() ? createFirebaseRepository() : createMemoryRepository();

let activeRepository: Repository = realRepository;
let demoActive = false;

export function isDemoMode(): boolean {
  return demoActive;
}

/** 체험 모드로 전환한다. 화면들은 여전히 `repository`만 쓰므로, 이 전환을 알 필요가 없다. */
export function enterDemoMode(demoRepository: Repository) {
  activeRepository = demoRepository;
  demoActive = true;
}

/** 체험 모드를 끝내고 실제 저장소(Firebase 또는 로컬)로 되돌린다. */
export function exitDemoMode() {
  activeRepository = realRepository;
  demoActive = false;
}

// 화면 코드는 항상 이 하나의 객체(repository)만 참조한다. 실제로 어떤 구현이 호출될지는
// 매 호출 시점의 activeRepository에 따라 정해진다 — 체험 모드 전환이 화면 코드에 보이지 않게 하기 위함이다.
export const repository: Repository = new Proxy({} as Repository, {
  get(_target, prop: string) {
    return (...args: unknown[]) => (activeRepository as unknown as Record<string, (...a: unknown[]) => unknown>)[prop](...args);
  },
}) as Repository;
