import { create } from 'zustand';
import { onValue, ref } from 'firebase/database';
import { getFirebaseDb } from './app';

interface ConnectionState {
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connected: true,
  setConnected: (connected) => set({ connected }),
}));

let watching = false;

/** Firebase의 .info/connected를 구독해 연결 상태 스토어를 갱신한다. firebaseRepository 생성 시 한 번 호출한다. */
export function watchFirebaseConnection() {
  if (watching) return;
  watching = true;
  const db = getFirebaseDb();
  onValue(ref(db, '.info/connected'), (snap) => {
    useConnectionStore.getState().setConnected(snap.val() === true);
  });
}

/** repository 내부에서 쓰기 전 동기적으로 확인하기 위한 헬퍼. */
export function isConnected(): boolean {
  return useConnectionStore.getState().connected;
}
