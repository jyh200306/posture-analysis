import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public');

const BG = '#D85A30';
const FG = '#FAF6EF';

function makeSvg(size) {
  const pad = Math.round(size * 0.04);
  const rx = Math.round(size * 0.22);
  const cx = size / 2;
  const headR = Math.round(size * 0.13);
  const headCy = Math.round(size * 0.30);
  const bodyTop = Math.round(size * 0.46);
  const bodyBot = Math.round(size * 0.71);
  const legW = Math.round(size * 0.22);
  const legBot = Math.round(size * 0.88);
  const sw = Math.round(size * 0.09);
  const sw2 = Math.round(size * 0.075);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${rx}" fill="${BG}"/>
  <circle cx="${cx}" cy="${headCy}" r="${headR}" fill="${FG}"/>
  <path d="M${cx} ${bodyTop}v${bodyBot - bodyTop}" stroke="${FG}" stroke-width="${sw}" stroke-linecap="round"/>
  <path d="M${cx - legW} ${legBot}h${legW * 2}" stroke="${FG}" stroke-width="${sw2}" stroke-linecap="round"/>
</svg>`;
}

for (const size of [192, 512]) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg)
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}
