import { create } from 'zustand';
import { enterDemoMode, exitDemoMode } from '@/repository';
import { createDemoRepository } from '@/lib/demoSeed';
import { useNavigationStore } from './navigationStore';

interface DemoState {
  active: boolean;
  starting: boolean;
  enter: () => Promise<void>;
  exit: () => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  active: false,
  starting: false,

  async enter() {
    set({ starting: true });
    try {
      const demo = await createDemoRepository();
      enterDemoMode(demo.repository);
      set({ active: true, starting: false });
      useNavigationStore.getState().push({
        type: 'floor',
        floorId: demo.floorId,
        name: demo.floorName,
        houseId: demo.houseId,
        houseName: demo.houseName,
      });
    } catch {
      set({ starting: false });
    }
  },

  exit() {
    exitDemoMode();
    set({ active: false });
    useNavigationStore.getState().goHome();
  },
}));
