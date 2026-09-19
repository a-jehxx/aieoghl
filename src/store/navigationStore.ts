import { create } from 'zustand';

export type Screen =
  | { type: 'main' }
  | { type: 'house'; houseId: string; name: string }
  | { type: 'floor'; floorId: string; name: string; houseId: string; houseName: string }
  | { type: 'room'; roomId: string; name: string }
  | { type: 'furniture'; furnitureId: string; name: string }
  | { type: 'bin'; binId: string; name: string };

interface NavigationState {
  stack: Screen[];
  exitConfirmOpen: boolean;
  /** 새 화면으로 이동한다 (히스토리에 새 항목을 쌓는다). */
  push: (screen: Screen) => void;
  /** 뒤로가기 버튼(상단바)과 폰의 뒤로가기가 동일하게 이 함수만 호출한다. */
  goBack: () => void;
  /** 어디서든 메인 화면으로 이동한다. */
  goHome: () => void;
  /** popstate(폰 뒤로가기 포함) 발생 시 호출된다. */
  handlePopState: () => void;
  confirmExit: () => void;
  cancelExit: () => void;
}

const mainScreen: Screen = { type: 'main' };

export const useNavigationStore = create<NavigationState>((set, get) => ({
  stack: [mainScreen],
  exitConfirmOpen: false,

  push: (screen) => {
    const newStack = [...get().stack, screen];
    set({ stack: newStack });
    window.history.pushState({ depth: newStack.length }, '');
  },

  goBack: () => {
    window.history.back();
  },

  goHome: () => {
    if (get().stack.length <= 1) return;
    set({ stack: [mainScreen] });
    window.history.pushState({ depth: 1 }, '');
  },

  handlePopState: () => {
    const { stack } = get();
    if (stack.length > 1) {
      set({ stack: stack.slice(0, -1) });
      return;
    }
    // 메인 화면에서 한 번 더 뒤로가면 종료 확인 팝업을 띄우고,
    // 실제 이탈은 사용자가 "예"를 눌렀을 때만 허용한다.
    window.history.pushState({ depth: 1 }, '');
    set({ exitConfirmOpen: true });
  },

  confirmExit: () => {
    set({ exitConfirmOpen: false });
    window.history.back();
  },

  cancelExit: () => {
    set({ exitConfirmOpen: false });
  },
}));
