/**
 * Renders the app icon, Android adaptive icon layers, splash image and favicon
 * from the Figma logo mark, so every launcher and store surface shows the same
 * leaf on the brand gradient.
 *
 * Re-run after replacing assets/brand/agriova-mark.svg: npm run gen:icons
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const BRAND_DARK = '#123F2E';
const BRAND_GLOW = '#548E3D';
const WHITE = '#FFFFFF';

const markSvg = readFileSync('assets/brand/agriova-mark.svg', 'utf8');
const [, , MW, MH] = markSvg
  .match(/viewBox="([^"]+)"/)[1]
  .split(' ')
  .map(Number);
const paths = [...markSvg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);

/** The mark, scaled to `height` and centred in a square canvas of `size`. */
function mark(size, height, fill) {
  const scale = height / MH;
  const x = (size - MW * scale) / 2;
  const y = (size - height) / 2;
  const d = paths.map((p) => `<path d="${p}" fill="${fill}"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${scale})">${d}</g>`;
}

const gradient = (size) =>
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0" stop-color="${BRAND_DARK}"/><stop offset="1" stop-color="${BRAND_GLOW}"/>
   </linearGradient></defs><rect width="${size}" height="${size}" fill="url(#g)"/>`;

function render(file, size, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;
  writeFileSync(file, new Resvg(svg).render().asPng());
  console.log(`wrote ${file}`);
}

// iOS and store icon: opaque, no transparency allowed.
render('assets/icon.png', 1024, gradient(1024) + mark(1024, 520, WHITE));

// Android adaptive icon. Launchers crop to a circle or squircle and may zoom,
// so the mark stays inside the central 66% safe zone.
render('assets/android-icon-background.png', 1024, gradient(1024));
render('assets/android-icon-foreground.png', 1024, mark(1024, 400, WHITE));
render('assets/android-icon-monochrome.png', 1024, mark(1024, 400, WHITE));

// Splash: white mark on transparent; the background color comes from app.json.
render('assets/splash-icon.png', 512, mark(512, 400, WHITE));

render('assets/favicon.png', 48, gradient(48) + mark(48, 30, WHITE));
