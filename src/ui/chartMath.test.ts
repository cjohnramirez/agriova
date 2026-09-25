import { buildSmoothLine, buildSteps } from './chartMath';

const box = { width: 100, height: 50, pad: 5 };

describe('buildSteps', () => {
  it('draws one segment per value across the inner width', () => {
    const steps = buildSteps([1, 2, 3, 4], box);
    expect(steps).toHaveLength(4);
    expect(steps[0].x1).toBe(5);
    expect(steps[3].x2).toBe(95);
  });

  it('puts the highest value at the top and the lowest at the bottom', () => {
    const [low, high] = buildSteps([10, 20], box);
    expect(high.y).toBe(5);
    expect(low.y).toBe(45);
  });

  // A bad week must read as bad at a glance, not just as a lower line.
  it('marks only periods lower than the one before as falling', () => {
    expect(buildSteps([5, 7, 6, 6, 3], box).map((s) => s.falling)).toEqual([
      false,
      false,
      true,
      false,
      true,
    ]);
  });

  // On the floor it would read as "earned nothing".
  it('draws a flat series at mid-height', () => {
    for (const s of buildSteps([4, 4, 4], box)) expect(s.y).toBe(25);
  });

  it('returns nothing for no data', () => expect(buildSteps([], box)).toEqual([]));
});

describe('buildSmoothLine', () => {
  it('starts at the first point and ends the marker on the last', () => {
    const { d, end } = buildSmoothLine([36, 40, 43, 41], box);
    expect(d.startsWith('M5,')).toBe(true);
    expect(end).toEqual({ x: 95, y: expect.any(Number) });
  });

  it('uses one curve per gap between points', () => {
    expect(buildSmoothLine([1, 2, 3, 4], box).d.match(/C/g)).toHaveLength(3);
  });

  it('handles a single reading', () => {
    expect(buildSmoothLine([41], box)).toEqual({ d: 'M5,25', end: { x: 5, y: 25 } });
  });
});
