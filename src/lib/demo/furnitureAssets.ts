/**
 * 체험 모드용 가구 정면 사진(SVG, viewBox 320x240) + 그 사진 위에 보이는 칸(서랍·문·선반)에
 * 맞춘 보관함 좌표를 한 항목에 같이 둔다 — 그림과 좌표가 따로 놀지 않게 하려는 목적.
 * 색은 전부 나무결 톤으로 코드에서 직접 그린다(외부 이미지 없음).
 */

export interface DemoFurniturePiece {
  key: string;
  name: string;
  svg: string;
  /** [x, y, w, h] — 사진 기준 0~1 비율 */
  bins: { name: string; rect: [number, number, number, number] }[];
}

const WOOD = '#C9A876';
const WOOD_DARK = '#A47C4E';
const WOOD_LINE = '#7A5C36';
const HANDLE = '#5B4636';
const BG = '#F4EEE3';

function frame(inner: string, bg = BG): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <rect width="320" height="240" fill="${bg}" />
  ${inner}
</svg>`.trim();
}

function bodyRect(x: number, y: number, w: number, h: number, fill = WOOD): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${WOOD_LINE}" stroke-width="2" />`;
}

function handleBar(cx: number, y: number, w = 28): string {
  return `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="6" rx="3" fill="${HANDLE}" />`;
}

function handleKnob(cx: number, cy: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="5" fill="${HANDLE}" />`;
}

function drawerFront(x: number, y: number, w: number, h: number): string {
  return `
    ${bodyRect(x, y, w, h, WOOD_DARK)}
    <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="none" stroke="${WOOD_LINE}" stroke-width="1.5" opacity="0.5" />
    ${handleBar(x + w / 2, y + h / 2 - 3)}
  `;
}

function doorFront(x: number, y: number, w: number, h: number, handleSide: 'left' | 'right' = 'right'): string {
  const hx = handleSide === 'right' ? x + w - 14 : x + 14;
  return `
    ${bodyRect(x, y, w, h, WOOD)}
    <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="none" stroke="${WOOD_LINE}" stroke-width="1.5" opacity="0.5" />
    ${handleKnob(hx, y + h / 2)}
  `;
}

function shelfSlot(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#EFE4CE" stroke="${WOOD_LINE}" stroke-width="1.5" />`;
}

function legs(x: number, w: number, y: number): string {
  return `
    <rect x="${x + 6}" y="${y}" width="8" height="16" fill="${WOOD_LINE}" />
    <rect x="${x + w - 14}" y="${y}" width="8" height="16" fill="${WOOD_LINE}" />
  `;
}

// 1. 현관 — 신발장 (문 3칸 + 아래 서랍)
const shoeCabinet: DemoFurniturePiece = {
  key: 'shoeCabinet',
  name: '신발장',
  svg: frame(`
    ${bodyRect(16, 16, 288, 208)}
    ${doorFront(24, 24, 88, 156, 'right')}
    ${doorFront(116, 24, 88, 156, 'right')}
    ${doorFront(208, 24, 88, 156, 'left')}
    ${drawerFront(24, 184, 272, 32)}
    ${legs(16, 288, 224)}
  `),
  bins: [
    { name: '위 칸', rect: [24 / 320, 24 / 240, 272 / 320, 160 / 240] },
    { name: '서랍', rect: [24 / 320, 184 / 240, 272 / 320, 32 / 240] },
  ],
};

// 2. 거실 — TV장 (서랍 2 + 오픈 선반)
const tvStand: DemoFurniturePiece = {
  key: 'tvStand',
  name: 'TV장',
  svg: frame(`
    <rect x="60" y="20" width="100" height="70" rx="4" fill="#3A3A3A" />
    <rect x="66" y="26" width="88" height="58" rx="2" fill="#1F1F1F" />
    ${bodyRect(20, 110, 280, 110)}
    ${drawerFront(28, 118, 85, 94)}
    ${drawerFront(121, 118, 85, 94)}
    ${shelfSlot(214, 118, 78, 94)}
    <line x1="214" y1="150" x2="292" y2="150" stroke="${WOOD_LINE}" stroke-width="1.5" />
    <rect x="222" y="126" width="16" height="20" fill="#9CA3AF" />
    <rect x="246" y="160" width="24" height="14" fill="#6B7280" />
    ${legs(20, 280, 220)}
  `),
  bins: [
    { name: '서랍 1', rect: [28 / 320, 118 / 240, 85 / 320, 94 / 240] },
    { name: '서랍 2', rect: [121 / 320, 118 / 240, 85 / 320, 94 / 240] },
    { name: '선반', rect: [214 / 320, 118 / 240, 78 / 320, 94 / 240] },
  ],
};

// 3. 거실 — 서랍장 (2칸)
const drawerChest: DemoFurniturePiece = {
  key: 'drawerChest',
  name: '서랍장',
  svg: frame(`
    ${bodyRect(60, 30, 200, 190)}
    ${drawerFront(68, 38, 184, 82)}
    ${drawerFront(68, 128, 184, 82)}
    ${legs(60, 200, 220)}
  `),
  bins: [
    { name: '위 칸', rect: [68 / 320, 38 / 240, 184 / 320, 82 / 240] },
    { name: '아래 칸', rect: [68 / 320, 128 / 240, 184 / 320, 82 / 240] },
  ],
};

// 4. 주방/식당 — 주방 수납장 (상부장 문 2 + 하부 서랍 2 + 하부문)
const kitchenCabinet: DemoFurniturePiece = {
  key: 'kitchenCabinet',
  name: '주방 수납장',
  svg: frame(`
    ${bodyRect(16, 16, 288, 210)}
    ${doorFront(24, 24, 132, 62, 'right')}
    ${doorFront(164, 24, 132, 62, 'left')}
    ${drawerFront(24, 94, 88, 128)}
    ${drawerFront(116, 94, 88, 128)}
    ${doorFront(208, 94, 88, 128, 'left')}
  `),
  bins: [
    { name: '서랍 1', rect: [24 / 320, 94 / 240, 88 / 320, 128 / 240] },
    { name: '서랍 2', rect: [116 / 320, 94 / 240, 88 / 320, 128 / 240] },
    { name: '하부문', rect: [208 / 320, 94 / 240, 88 / 320, 128 / 240] },
  ],
};

// 5. 팬트리 — 선반 (3단)
const pantryShelf: DemoFurniturePiece = {
  key: 'pantryShelf',
  name: '선반',
  svg: frame(`
    ${bodyRect(30, 20, 260, 200, '#EFE4CE')}
    ${shelfSlot(38, 28, 244, 60)}
    ${shelfSlot(38, 94, 244, 60)}
    ${shelfSlot(38, 160, 244, 52)}
    <rect x="38" y="88" width="244" height="6" fill="${WOOD_DARK}" />
    <rect x="38" y="154" width="244" height="6" fill="${WOOD_DARK}" />
  `),
  bins: [
    { name: '위 단', rect: [38 / 320, 28 / 240, 244 / 320, 60 / 240] },
    { name: '가운데 단', rect: [38 / 320, 94 / 240, 244 / 320, 60 / 240] },
    { name: '아래 단', rect: [38 / 320, 160 / 240, 244 / 320, 52 / 240] },
  ],
};

// 6. 다용도실 — 수납장 (문 2 + 서랍)
const utilityCabinet: DemoFurniturePiece = {
  key: 'utilityCabinet',
  name: '수납장',
  svg: frame(`
    ${bodyRect(40, 20, 240, 200)}
    ${drawerFront(48, 28, 92, 184)}
    ${doorFront(148, 28, 84, 184, 'right')}
    ${doorFront(232, 28, 40, 184, 'left')}
  `),
  bins: [
    { name: '서랍', rect: [48 / 320, 28 / 240, 92 / 320, 184 / 240] },
    { name: '문칸', rect: [148 / 320, 28 / 240, 140 / 320, 184 / 240] },
  ],
};

// 7. 안방 — 옷장 (문 2 + 서랍 2)
const wardrobe: DemoFurniturePiece = {
  key: 'wardrobe',
  name: '옷장',
  svg: frame(`
    ${bodyRect(20, 20, 280, 200)}
    ${doorFront(28, 28, 132, 122, 'right')}
    ${doorFront(160, 28, 132, 122, 'left')}
    ${drawerFront(28, 158, 130, 54)}
    ${drawerFront(162, 158, 130, 54)}
  `),
  bins: [
    { name: '서랍 1', rect: [28 / 320, 158 / 240, 130 / 320, 54 / 240] },
    { name: '서랍 2', rect: [162 / 320, 158 / 240, 130 / 320, 54 / 240] },
  ],
};

// 8. 안방 — 화장대 (서랍 1)
const vanity: DemoFurniturePiece = {
  key: 'vanity',
  name: '화장대',
  svg: frame(`
    <rect x="120" y="20" width="80" height="120" rx="36" fill="#EAF2F5" stroke="${WOOD_LINE}" stroke-width="3" />
    <rect x="132" y="32" width="56" height="96" rx="26" fill="#F8FBFC" stroke="${WOOD_LINE}" stroke-width="1" />
    ${bodyRect(40, 150, 240, 70)}
    ${drawerFront(48, 180, 224, 32)}
    ${legs(40, 240, 220)}
  `),
  bins: [{ name: '서랍', rect: [48 / 320, 180 / 240, 224 / 320, 32 / 240] }],
};

// 9. 드레스룸 — 서랍장 (4칸)
const dressChest: DemoFurniturePiece = {
  key: 'dressChest',
  name: '서랍장',
  svg: frame(`
    ${bodyRect(40, 20, 240, 200)}
    ${drawerFront(48, 28, 108, 88)}
    ${drawerFront(164, 28, 108, 88)}
    ${drawerFront(48, 124, 108, 88)}
    ${drawerFront(164, 124, 108, 88)}
  `),
  bins: [
    { name: '1칸', rect: [48 / 320, 28 / 240, 108 / 320, 88 / 240] },
    { name: '2칸', rect: [164 / 320, 28 / 240, 108 / 320, 88 / 240] },
    { name: '3칸', rect: [48 / 320, 124 / 240, 108 / 320, 88 / 240] },
    { name: '4칸', rect: [164 / 320, 124 / 240, 108 / 320, 88 / 240] },
  ],
};

// 10. 아이방 — 책상 서랍장 (3칸)
const kidsDeskChest: DemoFurniturePiece = {
  key: 'kidsDeskChest',
  name: '책상 서랍장',
  svg: frame(`
    ${bodyRect(60, 20, 200, 200, '#D8B98A')}
    ${drawerFront(68, 28, 184, 58)}
    ${drawerFront(68, 92, 184, 58)}
    ${drawerFront(68, 156, 184, 58)}
  `),
  bins: [
    { name: '서랍 1', rect: [68 / 320, 28 / 240, 184 / 320, 58 / 240] },
    { name: '서랍 2', rect: [68 / 320, 92 / 240, 184 / 320, 58 / 240] },
    { name: '서랍 3', rect: [68 / 320, 156 / 240, 184 / 320, 58 / 240] },
  ],
};

// 11. 서재 — 책상 (서랍 3칸)
const studyDesk: DemoFurniturePiece = {
  key: 'studyDesk',
  name: '책상',
  svg: frame(`
    ${bodyRect(20, 20, 280, 50)}
    ${bodyRect(180, 70, 120, 150)}
    ${drawerFront(188, 78, 104, 42)}
    ${drawerFront(188, 128, 104, 42)}
    ${drawerFront(188, 178, 104, 42)}
    ${legs(20, 160, 210)}
  `),
  bins: [
    { name: '서랍 1', rect: [188 / 320, 78 / 240, 104 / 320, 42 / 240] },
    { name: '서랍 2', rect: [188 / 320, 128 / 240, 104 / 320, 42 / 240] },
    { name: '서랍 3', rect: [188 / 320, 178 / 240, 104 / 320, 42 / 240] },
  ],
};

// 12. 서재 — 책장 (2칸)
const bookshelf: DemoFurniturePiece = {
  key: 'bookshelf',
  name: '책장',
  svg: frame(`
    ${bodyRect(30, 20, 260, 200, '#EFE4CE')}
    ${shelfSlot(38, 28, 244, 88)}
    ${shelfSlot(38, 124, 244, 88)}
    <rect x="38" y="118" width="244" height="6" fill="${WOOD_DARK}" />
    <rect x="60" y="40" width="10" height="66" fill="#B08968" />
    <rect x="76" y="46" width="10" height="60" fill="#8C6842" />
    <rect x="92" y="36" width="10" height="70" fill="#B08968" />
    <rect x="180" y="42" width="10" height="64" fill="#8C6842" />
    <rect x="196" y="38" width="10" height="68" fill="#B08968" />
  `),
  bins: [
    { name: '위 칸', rect: [38 / 320, 28 / 240, 244 / 320, 88 / 240] },
    { name: '아래 칸', rect: [38 / 320, 124 / 240, 244 / 320, 88 / 240] },
  ],
};

export const DEMO_FURNITURE: DemoFurniturePiece[] = [
  shoeCabinet,
  tvStand,
  drawerChest,
  kitchenCabinet,
  pantryShelf,
  utilityCabinet,
  wardrobe,
  vanity,
  dressChest,
  kidsDeskChest,
  studyDesk,
  bookshelf,
];

export function furnitureDataUrl(piece: DemoFurniturePiece): string {
  return `data:image/svg+xml,${encodeURIComponent(piece.svg)}`;
}
