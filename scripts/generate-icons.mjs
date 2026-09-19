// SVG 아이콘 원본(scripts/icons/*.svg)을 public/icons/*.png로 변환한다.
// 실행: node scripts/generate-icons.mjs
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');
const outDir = path.join(root, 'public', 'icons');

mkdirSync(outDir, { recursive: true });

const targets = [
  { source: 'icons/icon-source.svg', size: 192, out: 'icon-192.png' },
  { source: 'icons/icon-source.svg', size: 512, out: 'icon-512.png' },
  { source: 'icons/icon-maskable-source.svg', size: 512, out: 'icon-maskable-512.png' },
];

for (const target of targets) {
  const svg = readFileSync(path.join(dirname, target.source));
  await sharp(svg, { density: 384 })
    .resize(target.size, target.size)
    .png()
    .toFile(path.join(outDir, target.out));
  console.log(`생성됨: public/icons/${target.out}`);
}
