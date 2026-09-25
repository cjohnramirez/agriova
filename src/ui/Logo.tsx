import Svg, { Path } from 'react-native-svg';

import { color } from '@/theme/tokens';
import { brandPaths } from './brandPaths';

type LogoProps = {
  /** `mark` is the leaf alone; `wordmark` adds AGRIOVA and the TM. */
  variant?: 'mark' | 'wordmark';
  /** Rendered height. Width follows the artwork's proportions. */
  height?: number;
  tint?: string;
};

/** The Agriova logo, drawn from the exact vectors exported from Figma. */
export function Logo({ variant = 'mark', height = 40, tint = color.brandDark }: LogoProps) {
  const art = brandPaths[variant];
  const [, , w, h] = art.viewBox.split(' ').map(Number);

  return (
    <Svg
      width={(height * w) / h}
      height={height}
      viewBox={art.viewBox}
      accessibilityRole="image"
      accessibilityLabel="Agriova"
    >
      {art.paths.map((d) => (
        <Path key={d.slice(0, 24)} d={d} fill={tint} />
      ))}
    </Svg>
  );
}
