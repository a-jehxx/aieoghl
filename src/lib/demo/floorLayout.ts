import type { Point } from '@/types';

/**
 * 체험 모드 샘플 도면(84㎡ 3룸 아파트)의 방 목록. 여기 하나에만 적어두고,
 * 도면 그림(floorPlanSvg.ts, 방 채우기·이름표)과 앱에 등록하는 방의 다각형 좌표(demoData.ts)가
 * 모두 이 배열을 읽어서 만든다 — 따로 적으면 두 그림이 어긋날 수 있어서다.
 */

export const VIEWBOX_W = 1000;
export const VIEWBOX_H = 740;

export type FloorMaterial = 'wood' | 'tile' | 'bath' | 'beige';

export const FLOOR_COLORS: Record<FloorMaterial, string> = {
  wood: '#EBD8B5',
  tile: '#EFE9DF',
  bath: '#DCE8EC',
  beige: '#F1E9DC',
};

export interface DemoZone {
  /** 방 화면 등에서 쓰는 안정적인 key. 등록된 방은 demoData.ts의 furniture 트리가 이 key로 찾는다. */
  key: string;
  /** 도면에 적는 이름(예: 안방욕실·공용욕실은 둘 다 "욕실") */
  label: string;
  /** [x1, y1, x2, y2] — 1000x740 기준 절대 좌표 */
  rect: [number, number, number, number];
  /** 앱에 방(Room)으로 등록할지. false면 도면 그림에만 나온다. */
  registered: boolean;
  material: FloorMaterial;
}

export const DEMO_ZONES: DemoZone[] = [
  { key: 'balcony', label: '발코니', rect: [40, 20, 700, 60], registered: false, material: 'tile' },
  { key: 'mainRoom', label: '안방', rect: [40, 60, 330, 330], registered: true, material: 'wood' },
  { key: 'mainBath', label: '욕실', rect: [40, 330, 170, 450], registered: false, material: 'bath' },
  { key: 'dressRoom', label: '드레스룸', rect: [170, 330, 330, 450], registered: true, material: 'beige' },
  { key: 'livingRoom', label: '거실', rect: [330, 60, 700, 450], registered: true, material: 'wood' },
  { key: 'kitchen', label: '주방/식당', rect: [700, 60, 960, 340], registered: true, material: 'tile' },
  { key: 'pantry', label: '팬트리', rect: [700, 340, 830, 450], registered: true, material: 'beige' },
  { key: 'utility', label: '다용도실', rect: [830, 340, 960, 450], registered: true, material: 'beige' },
  { key: 'kidsRoom', label: '아이방', rect: [40, 450, 300, 720], registered: true, material: 'wood' },
  { key: 'commonBath', label: '욕실', rect: [300, 450, 430, 580], registered: false, material: 'bath' },
  { key: 'hallLeft', label: '복도', rect: [300, 580, 430, 720], registered: false, material: 'wood' },
  { key: 'hallMid', label: '복도', rect: [430, 450, 700, 580], registered: false, material: 'wood' },
  { key: 'entrance', label: '현관', rect: [430, 580, 570, 720], registered: true, material: 'tile' },
  { key: 'study', label: '서재', rect: [570, 580, 700, 720], registered: true, material: 'wood' },
  { key: 'smallRoom', label: '작은방', rect: [700, 450, 960, 720], registered: false, material: 'wood' },
];

export function zoneByKey(key: string): DemoZone {
  const zone = DEMO_ZONES.find((z) => z.key === key);
  if (!zone) throw new Error(`알 수 없는 방 key: ${key}`);
  return zone;
}

/** 등록 대상 구역의 사각형을 이미지 기준 0~1 비율 다각형(꼭짓점 4개)으로 바꾼다. */
export function zoneToUnitPolygon(zone: DemoZone): Point[] {
  const [x1, y1, x2, y2] = zone.rect;
  return [
    { x: x1 / VIEWBOX_W, y: y1 / VIEWBOX_H },
    { x: x2 / VIEWBOX_W, y: y1 / VIEWBOX_H },
    { x: x2 / VIEWBOX_W, y: y2 / VIEWBOX_H },
    { x: x1 / VIEWBOX_W, y: y2 / VIEWBOX_H },
  ];
}

/** 방 이름표 글자 크기 — 좁은 방(가로·세로 중 짧은 쪽이 150 미만)은 작게 쓴다. */
export function zoneLabelSize(zone: DemoZone): number {
  const [x1, y1, x2, y2] = zone.rect;
  const shortSide = Math.min(x2 - x1, y2 - y1);
  return shortSide < 150 ? 16 : 22;
}

export function zoneCenter(zone: DemoZone): { x: number; y: number } {
  const [x1, y1, x2, y2] = zone.rect;
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}
