#!/usr/bin/env node
/** Regenerate assets/icon-1024.png — run from mobile/: node scripts/generate-icon.mjs */
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const size = 1024;
const png = new PNG({ width: size, height: size });
const bg = { r: 12, g: 14, b: 18, a: 255 };
const accent = { r: 201, g: 162, b: 39, a: 255 };
const set = (x, y, c) => {
  const i = (size * y + x) * 4;
  png.data[i] = c.r;
  png.data[i + 1] = c.g;
  png.data[i + 2] = c.b;
  png.data[i + 3] = c.a;
};
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, bg);
const inRR = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  for (const [cx, cy, cr] of [
    [x0 + r, y0 + r, r],
    [x1 - r, y0 + r, r],
    [x0 + r, y1 - r, r],
    [x1 - r, y1 - r, r],
  ]) {
    if ((x < x0 + r || x > x1 - r) && (y < y0 + r || y > y1 - r)) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > cr * cr) return false;
    }
  }
  return true;
};
const m = 180;
const f = 24;
for (let y = 0; y < size; y++)
  for (let x = 0; x < size; x++) {
    if (inRR(x, y, m, m, size - m, size - m, 120) && !inRR(x, y, m + f, m + f, size - m - f, size - m - f, 100))
      set(x, y, accent);
  }
const cx = size / 2;
const cy = size / 2 + 40;
for (let y = 0; y < size; y++)
  for (let x = 0; x < size; x++) {
    const head = (x - cx) ** 2 + (y - (cy - 80)) ** 2 < 115 ** 2;
    const shaft = x > cx - 70 && x < cx + 70 && y > cy - 140 && y < cy + 60;
    const hole = (x - cx) ** 2 + (y - (cy - 120)) ** 2 < 55 ** 2;
    if ((head || shaft) && !hole) set(x, y, accent);
  }
const out = path.join(__dirname, '../assets/icon-1024.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, PNG.sync.write(png));
console.log('Wrote', out);
