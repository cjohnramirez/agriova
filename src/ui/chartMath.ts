/**
 * Geometry for the small charts, kept free of React so it can be tested.
 * Coordinates are in the chart's own box: y grows downward, as in SVG.
 */

export type Box = { width: number; height: number; pad: number };

function scaleY(values: readonly number[], box: Box) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const inner = box.height - box.pad * 2;
  // A flat series has no range to scale; draw it across the middle rather than
  // on the floor, where it would read as "zero".
  if (max === min) return () => box.pad + inner / 2;
  return (v: number) => box.pad + inner - ((v - min) / (max - min)) * inner;
}

export type Step = { x1: number; x2: number; y: number; falling: boolean };

/**
 * The prototype's "Finances Tracker": one flat segment per period, stepped up
 * or down. A segment lower than the one before is a falling period and is drawn
 * in the danger color, so a bad week is visible at a glance.
 */
export function buildSteps(values: readonly number[], box: Box): Step[] {
  if (values.length === 0) return [];
  const y = scaleY(values, box);
  const inner = box.width - box.pad * 2;
  const width = inner / values.length;
  return values.map((v, i) => ({
    x1: box.pad + i * width,
    x2: box.pad + (i + 1) * width,
    y: y(v),
    falling: i > 0 && v < values[i - 1],
  }));
}

/**
 * A smooth line through the points (Catmull-Rom as cubic Béziers), for the
 * temperature and moisture cards. Returns an SVG path and the last point, where
 * the marker dot goes.
 */
export function buildSmoothLine(values: readonly number[], box: Box) {
  if (values.length === 0) return { d: '', end: null };
  const y = scaleY(values, box);
  const inner = box.width - box.pad * 2;
  const step = values.length > 1 ? inner / (values.length - 1) : 0;
  const pts = values.map((v, i) => ({ x: box.pad + i * step, y: y(v) }));

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return { d, end: pts[pts.length - 1] };
}
