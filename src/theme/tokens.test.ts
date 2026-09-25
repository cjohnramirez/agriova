/**
 * The user reads this app outdoors in sunlight, so contrast is a requirement,
 * not a nicety. WCAG AA for body text is 4.5:1; every reading pair must pass.
 */
import { contrastRatio, mix } from './contrast';
import { color, gradient, layout, type } from './tokens';

const AA = 4.5;

describe('text contrast', () => {
  it.each([
    ['text on background', color.text, color.background],
    ['muted text on background', color.textMuted, color.background],
    ['muted text on surface', color.textMuted, color.surface],
    ['accent on surface', color.accent, color.surface],
    ['danger on surface', color.danger, color.surface],
    ['white on the action button', color.textOnBrand, color.action],
    ['white on the pressed action button', color.textOnBrand, color.actionPressed],
    ['accent on a selected chip', color.accent, color.accentSoft],
  ])('%s passes AA', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  // Card text sits in the upper-left three quarters of a gradient card; the
  // glow corner holds only icons and buttons.
  it.each(Object.entries(gradient))('white text holds AA across the %s gradient', (_n, stops) => {
    for (const t of [0, 0.25, 0.5, 0.75]) {
      expect(contrastRatio(color.textOnBrand, mix(stops[0], stops[1], t))).toBeGreaterThanOrEqual(
        AA,
      );
    }
  });
});

describe('type floor', () => {
  it('keeps every reading style at 18 or above', () => {
    const { label, ...reading } = type;
    for (const style of Object.values(reading)) expect(style.fontSize).toBeGreaterThanOrEqual(18);
    expect(label.fontSize).toBeGreaterThanOrEqual(15);
  });

  // Tighter than body text only for the big figures, where extra leading would
  // push the number away from its label.
  it('gives every style a line height of at least 1.15x', () => {
    for (const style of Object.values(type)) {
      expect(style.lineHeight / style.fontSize).toBeGreaterThanOrEqual(1.15);
    }
  });

  it('keeps touch targets at 56', () => expect(layout.minTouch).toBe(56));
});
