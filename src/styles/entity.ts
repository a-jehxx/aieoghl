/**
 * 방/가구/보관함 색 규칙을 한 곳에 모아둔다. 화면 파일마다 fill-blue-500/25 같은 클래스가
 * 흩어져 있던 걸 여기로 모으고, 화면은 이 상수를 가져다 쓴다.
 * Tailwind가 클래스명을 정적으로 스캔해서 인식해야 하므로, 조각을 이어붙이지 않고
 * 항상 완성된 클래스 문자열 그대로 적는다.
 */

/** 도면 위 방 폴리곤(SVG) */
export const ROOM_SHAPE = {
  normal: 'fill-room/25 stroke-room',
  selected: 'fill-room-selected/25 stroke-room-selected',
} as const;

/** 가구 사진 위 보관함 사각형(SVG) */
export const BIN_SHAPE = {
  normal: 'fill-bin/25 stroke-bin',
  selected: 'fill-bin/40 stroke-bin',
} as const;

/** 방 화면의 가구 카드(SVG가 아닌 카드형 DOM 요소) */
export const FURNITURE_CARD = {
  normal: 'border-furniture bg-furniture/10',
} as const;
