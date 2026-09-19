import { DEMO_ZONES, FLOOR_COLORS, VIEWBOX_H, VIEWBOX_W, zoneCenter, zoneLabelSize } from './floorLayout';

/**
 * 84㎡ 3룸 아파트 체험용 도면 SVG. 방 채우기·이름표는 floorLayout.ts의 DEMO_ZONES를 읽어서 그리고,
 * 벽·문·통로·창문은 (방 목록에서 자동으로 뽑아내지 않고) 여기에 좌표를 직접 적는다.
 */

const WALL_COLOR = '#222222';
const LABEL_COLOR = '#4A4A4A';
const FIXTURE_FILL = '#B9C4CC';
const FIXTURE_STROKE = '#6B7280';

type Seg = [number, number, number, number];

function wallLine([x1, y1, x2, y2]: Seg, thickness: number): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${WALL_COLOR}" stroke-width="${thickness}" stroke-linecap="square" />`;
}

const EXTERIOR_WALLS: Seg[] = [
  [40, 20, 700, 20],
  [700, 20, 700, 60],
  [700, 60, 960, 60],
  [960, 60, 960, 720],
  [960, 720, 40, 720],
  [40, 720, 40, 20],
];

const INTERIOR_WALLS: Seg[] = [
  [40, 60, 100, 60],
  [260, 60, 330, 60],
  [330, 60, 400, 60],
  [640, 60, 700, 60],
  [330, 60, 330, 190],
  [330, 250, 330, 330],
  [40, 330, 70, 330],
  [120, 330, 170, 330],
  [170, 330, 230, 330],
  [280, 330, 330, 330],
  [170, 330, 170, 450],
  [330, 330, 330, 450],
  [700, 60, 700, 110],
  [700, 270, 700, 450],
  [430, 450, 470, 450],
  [650, 450, 700, 450],
  [700, 340, 730, 340],
  [780, 340, 830, 340],
  [830, 340, 870, 340],
  [920, 340, 960, 340],
  [830, 340, 830, 450],
  [40, 450, 330, 450],
  [700, 450, 960, 450],
  [300, 450, 300, 580],
  [300, 580, 300, 620],
  [300, 680, 300, 720],
  [430, 450, 430, 490],
  [430, 540, 430, 580],
  [300, 580, 430, 580],
  [430, 580, 430, 620],
  [430, 690, 430, 720],
  [430, 580, 460, 580],
  [540, 580, 570, 580],
  [570, 580, 600, 580],
  [650, 580, 700, 580],
  [570, 580, 570, 720],
];

/** 여닫이문: 가로벽 틈(x1~x2, 높이 y)에 hinge를 x1에 두고 side 방향(1=+y, -1=-y)으로 연다. */
function doorH(x1: number, x2: number, y: number, side: 1 | -1): string {
  const len = x2 - x1;
  const leafY = y + side * len;
  const sweep = side === 1 ? 1 : 0;
  return `<path d="M ${x1} ${y} L ${x1} ${leafY} A ${len} ${len} 0 0 ${sweep} ${x2} ${y}" fill="none" stroke="#8A8A8A" stroke-width="1.5" />`;
}

/** 여닫이문: 세로벽 틈(y1~y2, x)에 hinge를 y1에 두고 side 방향(1=+x, -1=-x)으로 연다. */
function doorV(y1: number, y2: number, x: number, side: 1 | -1): string {
  const len = y2 - y1;
  const leafX = x + side * len;
  const sweep = side === 1 ? 0 : 1;
  return `<path d="M ${x} ${y1} L ${leafX} ${y1} A ${len} ${len} 0 0 ${sweep} ${x} ${y2}" fill="none" stroke="#8A8A8A" stroke-width="1.5" />`;
}

/** 문·통로가 없는 순수 개구부(통로): 문틀 표시 없이 문턱 점선만 긋는다. */
function passageH(x1: number, x2: number, y: number): string {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#B8B8B8" stroke-width="1" stroke-dasharray="4,3" />`;
}
function passageV(y1: number, y2: number, x: number): string {
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#B8B8B8" stroke-width="1" stroke-dasharray="4,3" />`;
}

/** 미닫이창(발코니 쪽): 얇은 유리 이중선. */
function slidingGlassH(x1: number, x2: number, y: number): string {
  return `
    <rect x="${x1}" y="${y - 3}" width="${x2 - x1}" height="6" fill="#DCEFFB" stroke="#5B8CA8" stroke-width="1" />
    <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#5B8CA8" stroke-width="1" />
  `;
}

function windowH(x1: number, x2: number, y: number, thickness = 8): string {
  return `<rect x="${x1}" y="${y - thickness / 2}" width="${x2 - x1}" height="${thickness}" fill="#DCEFFB" stroke="#334155" stroke-width="1" />`;
}
function windowV(y1: number, y2: number, x: number, thickness = 8): string {
  return `<rect x="${x - thickness / 2}" y="${y1}" width="${thickness}" height="${y2 - y1}" fill="#DCEFFB" stroke="#334155" stroke-width="1" />`;
}

// ---- 가구·기구 기호(회색 톤, 단순하게) ----

function toiletIcon(cx: number, cy: number): string {
  return `<g fill="${FIXTURE_FILL}" stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <ellipse cx="${cx}" cy="${cy + 9}" rx="14" ry="17" />
    <rect x="${cx - 12}" y="${cy - 20}" width="24" height="12" rx="3" />
  </g>`;
}
function sinkIcon(cx: number, cy: number): string {
  return `<g fill="${FIXTURE_FILL}" stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <rect x="${cx - 16}" y="${cy - 9}" width="32" height="18" rx="8" />
    <circle cx="${cx}" cy="${cy}" r="2.5" fill="${FIXTURE_STROKE}" />
  </g>`;
}
function tubIcon(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#C7D3DA" stroke="${FIXTURE_STROKE}" stroke-width="1.5" />`;
}
function showerIcon(x: number, y: number, w: number, h: number): string {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${FIXTURE_STROKE}" stroke-width="1.5" stroke-dasharray="3,2" />
    <circle cx="${x + w / 2}" cy="${y + h / 2}" r="3" fill="${FIXTURE_STROKE}" />
  </g>`;
}
function kitchenCounterIcon(x: number, y: number, w: number, h: number, legW: number): string {
  return `<g fill="#D9CBB4" stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <rect x="${x}" y="${y}" width="${w}" height="30" />
    <rect x="${x}" y="${y}" width="${legW}" height="${h}" />
    <circle cx="${x + w - 40}" cy="${y + 15}" r="9" fill="none" stroke="${FIXTURE_STROKE}" />
    <circle cx="${x + w - 70}" cy="${y + 15}" r="9" fill="none" stroke="${FIXTURE_STROKE}" />
  </g>`;
}
function fridgeIcon(x: number, y: number, w: number, h: number): string {
  return `<g fill="#E6E9EC" stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" />
    <line x1="${x}" y1="${y + h * 0.35}" x2="${x + w}" y2="${y + h * 0.35}" />
  </g>`;
}
function diningIcon(cx: number, cy: number): string {
  const chairs = [
    [cx - 34, cy - 34],
    [cx + 34, cy - 34],
    [cx - 34, cy + 34],
    [cx + 34, cy + 34],
  ];
  const chairSvg = chairs.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${FIXTURE_FILL}" stroke="${FIXTURE_STROKE}" stroke-width="1" />`).join('');
  return `<g>
    <rect x="${cx - 30}" y="${cy - 20}" width="60" height="40" rx="4" fill="#D9CBB4" stroke="${FIXTURE_STROKE}" stroke-width="1.5" />
    ${chairSvg}
  </g>`;
}
function sofaIcon(x: number, y: number, w: number, h: number): string {
  return `<g fill="#B7C3E0" stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" />
    <rect x="${x}" y="${y}" width="${w}" height="12" rx="6" fill="#9BABD6" />
  </g>`;
}
function lowTableIcon(cx: number, cy: number, w: number, h: number): string {
  return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="4" fill="#D9CBB4" stroke="${FIXTURE_STROKE}" stroke-width="1" />`;
}
function tvStandIcon(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#9CA3AF" stroke="${FIXTURE_STROKE}" stroke-width="1.5" />`;
}
function bedIcon(x: number, y: number, w: number, h: number): string {
  return `<g fill="#D8C7E8" stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" />
    <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h * 0.22}" rx="4" fill="#EDE4F5" />
  </g>`;
}
function deskIcon(x: number, y: number, w: number, h: number): string {
  return `<g fill="#D9CBB4" stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" />
    <rect x="${x}" y="${y}" width="${Math.min(28, w * 0.3)}" height="${h}" fill="#C7B492" />
  </g>`;
}
function wardrobeOutlineIcon(x: number, y: number, w: number, h: number): string {
  return `<g fill="none" stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" />
    <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" />
  </g>`;
}
function shoeCabinetIcon(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#D9CBB4" stroke="${FIXTURE_STROKE}" stroke-width="1.5" />`;
}

function bathPattern(id: string): string {
  return `
    <pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="${FLOOR_COLORS.bath}" />
      <path d="M0 24 L24 0" stroke="#C7D8DE" stroke-width="1" />
      <path d="M0 0 L24 24" stroke="#C7D8DE" stroke-width="1" />
    </pattern>
  `;
}

function roomFillAndLabel(): string {
  const parts: string[] = [];
  for (const zone of DEMO_ZONES) {
    const [x1, y1, x2, y2] = zone.rect;
    const w = x2 - x1;
    const h = y2 - y1;
    const fill = zone.material === 'bath' ? 'url(#bathGrid)' : FLOOR_COLORS[zone.material];
    parts.push(`<rect x="${x1}" y="${y1}" width="${w}" height="${h}" fill="${fill}" />`);
    const center = zoneCenter(zone);
    const labelSize = zoneLabelSize(zone);
    const labelY = y1 + labelSize + 6;
    parts.push(
      `<text x="${center.x}" y="${labelY}" font-family="sans-serif" font-size="${labelSize}" fill="${LABEL_COLOR}" text-anchor="middle">${zone.label}</text>`,
    );
  }
  return parts.join('\n');
}

function fixtures(): string {
  const parts: string[] = [];

  // 안방 욕실 (40,330,170,450)
  parts.push(toiletIcon(65, 420));
  parts.push(sinkIcon(65, 355));
  parts.push(showerIcon(115, 355, 40, 85));

  // 공용 욕실 (300,450,430,580)
  parts.push(toiletIcon(325, 560));
  parts.push(sinkIcon(325, 495));
  parts.push(tubIcon(365, 495, 50, 75));

  // 주방/식당 (700,60,960,340) — ㄱ자 싱크대 + 냉장고 + 식탁
  parts.push(kitchenCounterIcon(715, 95, 220, 120, 30));
  parts.push(fridgeIcon(895, 95, 50, 70));
  parts.push(diningIcon(800, 260));

  // 팬트리 (700,340,830,450) — 선반 3단 느낌의 얇은 선반 라인
  parts.push(`<g stroke="${FIXTURE_STROKE}" stroke-width="1.5">
    <line x1="715" y1="380" x2="815" y2="380" />
    <line x1="715" y1="410" x2="815" y2="410" />
  </g>`);

  // 다용도실 (830,340,960,450)
  parts.push(`<rect x="845" y="375" width="100" height="55" fill="#D9CBB4" stroke="${FIXTURE_STROKE}" stroke-width="1.5" />`);

  // 거실 (330,60,700,450) — 소파 + 낮은 테이블 + TV장
  parts.push(sofaIcon(350, 300, 160, 60));
  parts.push(lowTableIcon(500, 340, 70, 40));
  parts.push(tvStandIcon(560, 100, 120, 26));

  // 안방 (40,60,330,330) — 침대
  parts.push(bedIcon(60, 150, 140, 150));

  // 드레스룸 (170,330,330,450) — 옷장 윤곽선
  parts.push(wardrobeOutlineIcon(190, 380, 120, 55));

  // 아이방 (40,450,300,720) — 침대 + 책상
  parts.push(bedIcon(55, 630, 110, 75));
  parts.push(deskIcon(190, 630, 90, 60));

  // 서재 (570,580,700,720) — 책상
  parts.push(deskIcon(585, 660, 100, 45));

  // 현관 (430,580,570,720) — 신발장
  parts.push(shoeCabinetIcon(445, 600, 30, 100));

  // 작은방 (700,450,960,720, 도면에만) — 침대 기호만
  parts.push(bedIcon(870, 560, 70, 130));

  return parts.join('\n');
}

export function buildDemoFloorPlanSvg(): string {
  const doors = [
    doorH(470, 530, 720, -1), // 현관 바깥문
    doorV(190, 250, 330, 1), // 거실-안방
    doorH(70, 120, 330, 1), // 안방-안방욕실
    doorH(230, 280, 330, 1), // 안방-드레스룸
    doorH(730, 780, 340, 1), // 주방-팬트리
    doorH(870, 920, 340, 1), // 주방-다용도실
    doorV(620, 680, 300, 1), // 아이방-복도왼쪽
    doorV(490, 540, 430, -1), // 공용욕실-복도가운데
    doorH(600, 650, 580, 1), // 서재-복도가운데
    doorV(490, 540, 700, 1), // 작은방-복도가운데
  ].join('\n');

  const passages = [
    passageH(460, 540, 580), // 현관-복도가운데
    passageV(620, 690, 430), // 현관-복도왼쪽
    passageH(470, 650, 450), // 복도가운데-거실
    passageV(110, 270, 700), // 거실-주방/식당
  ].join('\n');

  const slidingGlass = [slidingGlassH(100, 260, 60), slidingGlassH(400, 640, 60)].join('\n');

  const windows = [
    windowV(520, 640, 40), // 아이방 서쪽
    windowV(520, 650, 960), // 작은방 동쪽
    windowV(130, 250, 960), // 주방 동쪽
    windowH(760, 900, 60), // 주방 북쪽
    windowH(600, 670, 720), // 서재 남쪽
    windowV(370, 410, 40), // 안방욕실 서쪽
    windowV(370, 420, 960), // 다용도실 동쪽
  ].join('\n');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" width="${VIEWBOX_W}" height="${VIEWBOX_H}">
  <defs>${bathPattern('bathGrid')}</defs>
  <rect width="${VIEWBOX_W}" height="${VIEWBOX_H}" fill="#FAFAF8" />
  ${roomFillAndLabel()}
  ${fixtures()}
  ${passages}
  ${slidingGlass}
  ${EXTERIOR_WALLS.map((s) => wallLine(s, 8)).join('\n')}
  ${INTERIOR_WALLS.map((s) => wallLine(s, 5)).join('\n')}
  ${windows}
  ${doors}
</svg>
`.trim();

  return svg;
}

export function demoFloorPlanDataUrl(): string {
  return `data:image/svg+xml,${encodeURIComponent(buildDemoFloorPlanSvg())}`;
}
