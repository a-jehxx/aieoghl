import { create } from 'zustand';

export interface GuideTarget {
  itemId: string;
  itemName: string;
  floorId: string;
  floorName: string;
  roomId: string;
  roomName: string;
  furnitureId: string;
  furnitureName: string;
  binId: string;
  binName: string;
}

interface GuideState {
  target: GuideTarget | null;
  start: (target: GuideTarget) => void;
  stop: () => void;
}

export const useGuideStore = create<GuideState>((set) => ({
  target: null,
  start: (target) => set({ target }),
  stop: () => set({ target: null }),
}));
