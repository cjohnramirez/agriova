import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { color, type, type TypeVariant } from '@/theme/tokens';

const tones = {
  default: color.text,
  muted: color.textMuted,
  onBrand: color.textOnBrand,
  accent: color.accent,
  danger: color.danger,
} as const;

export type TextTone = keyof typeof tones;

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  /** Equal-width digits, so a changing peso total does not jitter sideways. */
  numeric?: boolean;
};

/**
 * Hero figures honour the OS font size setting, but only up to 1.3x. Past that
 * a peso total wraps mid-number, which is harder to read than a smaller one.
 */
const CAPPED: Partial<Record<TypeVariant, number>> = { display: 1.3, figure: 1.3 };

/** The only way text is drawn in this app. Styles come from the type ramp. */
export function Text({
  variant = 'body',
  tone = 'default',
  numeric,
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? CAPPED[variant]}
      style={[
        type[variant],
        { color: tones[tone] },
        numeric && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
