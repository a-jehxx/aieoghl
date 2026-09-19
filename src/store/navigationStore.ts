import { create } from 'zustand';

export type Screen =
  | { type: 'main' }
  | { type: 'house'; houseId: string; name: string }
  | { type: 'floor'; floorId: string; name: string; houseId: string; houseName: string }
  | { type: 'room'; roomId: string; name: string }
  | { type: 'furniture'; furnitureId: string; name: string }
  | { type: 'bin'; binId: string; name: string }
  | { type: 'share'; houseId: string; houseName: string };

interface NavigationState {
  stack: Screen[];
  /** 새 화면으로 이동한다 (히스토리에 새 항목을 쌓는다). */
  push: (screen: Screen) => void;
  /** 지금까지의 이동 스택을 버리고 [메인 → screen] 두 단계로 곧장 이동한다(검색 결과 이동용). */
  jumpTo: (screen: Screen) => void;
  /** 뒤로가기 버튼(상단바)과 폰의 뒤로가기가 동일하게 이 함수만 호출한다. */
  goBack: () => void;
  /** 어디서든 메인 화면으로 이동한다. */
  goHome: () => void;
  /** popstate(폰 뒤로가기 포함) 발생 시 호출된다. */
  handlePopState: () => void;
}

const mainScreen: Screen = { type: 'main' };

export const useNavigationStore = create<NavigationState>((set, get) => ({
  stack: [mainScreen],

  push: (screen) => {
    const newStack = [...get().stack, screen];
    set({ stack: newStack });
    window.history.pushState({ depth: newStack.length }, '');
  },

  jumpTo: (screen) => {
    set({ stack: [mainScreen, screen] });
    window.history.pushState({ depth: 2 }, '');
  },

  goBack: () => {
    if (get().stack.length <= 1) return;
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
    }
    // 메인 화면에서 더 뒤로 가면(폰 뒤로가기 포함) 별도 확인 없이 브라우저(또는
    // 설치된 앱)의 기본 동작에 맡긴다 — 웹은 스스로를 닫을 수 없어서, 종료 확인
    // 팝업을 띄워도 실제로는 아무 일도 일어나지 않아 혼란만 줬다.
  },
}));
