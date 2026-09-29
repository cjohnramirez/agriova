/**
 * Renders the tab bar icons for iOS as PNGs, from the same Lucide icons the
 * Android bar draws, at the same hairline stroke. iOS's system tab bar (the
 * Liquid Glass one) takes images rather than React components; passed with
 * renderingMode "template", iOS tints them like its own symbols.
 *
 * Re-run after changing an icon: npm run gen:tab-icons
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ICONS = {
  home: 'house',
  fields: 'map',
  activity: 'text-align-center',
  assistant: 'bot-message-square',
  shop: 'shopping-bag',
};

/** Apple's tab bar glyph size, in points. */
const POINTS = 25;
/** Stroke in points, matching the app's LucideProvider (1, absolute). */
const STROKE = 1;

const OUT = 'assets/tab-icons';
mkdirSync(OUT, { recursive: true });

/** Reads Lucide's `iconData.node` list of [tag, attrs] out of its module. */
function nodesOf(name) {
  const source = readFileSync(
    `node_modules/lucide-react-native/dist/esm/icons/${name}.mjs`,
    'utf8',
  );
  const literal =
    source.match(/node:\s*(\[[\s\S]*?\])\s*,\s*aliases/)?.[1] ??
    source.match(/node:\s*(\[[\s\S]*?\])\s*\n\s*\};/)[1];
  return Function(`return ${literal}`)();
}

function svgFor(nodes, px) {
  // Scale the 24-unit icon to the target size, and set the stroke so it lands
  // at STROKE points whatever the scale.
  const scale = px / 24;
  const pointScale = px / POINTS;
  const body = nodes
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
    <g transform="scale(${scale})" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round"
       stroke-width="${(STROKE * pointScale) / scale}">${body}</g></svg>`;
}

for (const [tab, lucide] of Object.entries(ICONS)) {
  const nodes = nodesOf(lucide);
  for (const [suffix, factor] of [
    ['', 1],
    ['@2x', 2],
    ['@3x', 3],
  ]) {
    const px = POINTS * factor;
    const file = `${OUT}/${tab}${suffix}.png`;
    writeFileSync(file, new Resvg(svgFor(nodes, px)).render().asPng());
    console.log(`wrote ${file}`);
  }
}
