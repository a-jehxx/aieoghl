import { createMemoryRepository } from './memoryRepository';
import { createFirebaseRepository } from './firebaseRepository';
import { hasFirebaseConfig } from '@/firebase/app';

export type { Repository } from './types';
export { createMemoryRepository } from './memoryRepository';

// .env에 Firebase 설정값이 있으면 Firebase로, 없으면 메모리 구현으로 동작한다.
// (메모리 구현은 "체험하기" 모드가 쓸 용도로 남겨둔다. 설정 없이도 앱이 오류 없이 열려야 하므로
// 여기서 자동으로 대신 쓴다.)
export const repository = hasFirebaseConfig() ? createFirebaseRepository() : createMemoryRepository();
