import { createMemoryRepository } from './memoryRepository';

export type { Repository } from './types';

// 지금은 메모리 구현만 사용한다. Firebase 연결은 이후 단계에서 이 부분만 교체한다.
export const repository = createMemoryRepository();
