import { useWindowDimensions } from 'react-native';

import { layout } from '@/theme/tokens';

/**
 * Layout decisions that depend on screen width. Figma is drawn at 360; real
 * phones in the pilot run from 320 to about 430, and iPads exist.
 */
export function useBreakpoint() {
  const { width, fontScale } = useWindowDimensions();
  return {
    width,
    /** Two-up tiles stack below this, and also when large text is on. */
    isNarrow: width < layout.narrowWidth || fontScale >= 1.3,
    isTablet: width >= 700,
    contentWidth: Math.min(width, layout.maxContentWidth),
  };
}
