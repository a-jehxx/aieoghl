// 체험 모드용 샘플 도면·가구 사진. 외부 이미지 없이 코드로 그린 SVG만 쓴다.

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const DEMO_FLOOR_PLAN = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="#f8fafc" />
  <rect x="16" y="16" width="368" height="268" fill="none" stroke="#334155" stroke-width="4" />
  <line x1="270" y1="16" x2="270" y2="284" stroke="#334155" stroke-width="4" />
  <line x1="16" y1="145" x2="270" y2="145" stroke="#334155" stroke-width="4" />
</svg>
`);

export const DEMO_TV_STAND_PHOTO = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <rect width="320" height="240" fill="#ecfdf5" />
  <rect x="60" y="150" width="200" height="50" rx="8" fill="#059669" />
  <rect x="90" y="60" width="140" height="80" rx="6" fill="#0f172a" />
  <rect x="150" y="140" width="20" height="14" fill="#0f172a" />
</svg>
`);

export const DEMO_SOFA_PHOTO = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <rect width="320" height="240" fill="#eff6ff" />
  <rect x="40" y="110" width="240" height="80" rx="16" fill="#2563eb" />
  <rect x="30" y="90" width="40" height="100" rx="12" fill="#1d4ed8" />
  <rect x="250" y="90" width="40" height="100" rx="12" fill="#1d4ed8" />
  <rect x="60" y="80" width="200" height="40" rx="12" fill="#3b82f6" />
</svg>
`);

export const DEMO_CABINET_PHOTO = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <rect width="320" height="240" fill="#fffbeb" />
  <rect x="50" y="40" width="220" height="160" rx="6" fill="#f59e0b" />
  <line x1="160" y1="40" x2="160" y2="200" stroke="#78350f" stroke-width="4" />
  <line x1="50" y1="120" x2="270" y2="120" stroke="#78350f" stroke-width="4" />
  <circle cx="140" cy="80" r="4" fill="#78350f" />
  <circle cx="180" cy="80" r="4" fill="#78350f" />
  <circle cx="140" cy="160" r="4" fill="#78350f" />
  <circle cx="180" cy="160" r="4" fill="#78350f" />
</svg>
`);

export const DEMO_WARDROBE_PHOTO = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <rect width="320" height="240" fill="#fdf4ff" />
  <rect x="70" y="30" width="180" height="190" rx="6" fill="#7e22ce" />
  <line x1="160" y1="30" x2="160" y2="220" stroke="#4c1d95" stroke-width="4" />
  <circle cx="145" cy="120" r="4" fill="#f5f3ff" />
  <circle cx="175" cy="120" r="4" fill="#f5f3ff" />
</svg>
`);

export const DEMO_DESK_PHOTO = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <rect width="320" height="240" fill="#f0fdf4" />
  <rect x="40" y="90" width="240" height="20" fill="#065f46" />
  <rect x="55" y="110" width="16" height="90" fill="#065f46" />
  <rect x="249" y="110" width="16" height="90" fill="#065f46" />
  <rect x="110" y="110" width="100" height="60" rx="4" fill="#34d399" />
</svg>
`);
