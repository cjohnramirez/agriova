import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { color } from '@/theme/tokens';
import { buildSmoothLine, buildSteps, type Box } from './chartMath';

const PAD = 8;
const MARKER = 5;
/** Space between two periods, so each reads as its own bar, as in the prototype. */
const STEP_GAP = 3;

/** Measures its own width, so charts fill whatever card they sit in. */
function useWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return { width, onLayout };
}

type ChartProps = {
  values: readonly number[];
  height?: number;
  /** Charts are decorative next to their figure, but still get a spoken summary. */
  accessibilityLabel: string;
};

/**
 * The stepped finance chart from the Dashboard: one short bar per period with
 * a gap between, falling periods in orange, a ring on the latest.
 */
export function StepChart({ values, height = 64, accessibilityLabel }: ChartProps) {
  const { width, onLayout } = useWidth();
  const box: Box = { width, height, pad: PAD };
  const steps = width ? buildSteps(values, box) : [];
  const last = steps[steps.length - 1];

  return (
    <View
      onLayout={onLayout}
      style={{ height }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {width ? (
        <Svg width={width} height={height}>
          {steps.map((s) => (
            <Line
              key={s.x1}
              x1={s.x1 + STEP_GAP}
              x2={s.x2 - STEP_GAP}
              y1={s.y}
              y2={s.y}
              stroke={s.falling ? color.loss : color.accent}
              strokeWidth={2}
              strokeLinecap="butt"
            />
          ))}
          {last ? (
            <Circle
              cx={last.x2 - STEP_GAP - MARKER * 2}
              cy={last.y}
              r={MARKER}
              fill={color.surface}
              stroke={color.accent}
              strokeWidth={2}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

type SparklineProps = ChartProps & { tint?: string };

/** The smooth line from the temperature and moisture cards. */
export function Sparkline({
  values,
  height = 72,
  accessibilityLabel,
  tint = color.accent,
}: SparklineProps) {
  const { width, onLayout } = useWidth();
  const { d, end } = width
    ? buildSmoothLine(values, { width, height, pad: PAD })
    : { d: '', end: null };

  return (
    <View
      onLayout={onLayout}
      style={{ height }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {width ? (
        <Svg width={width} height={height}>
          <Path d={d} stroke={tint} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          {end ? (
            <Circle
              cx={end.x}
              cy={end.y}
              r={MARKER}
              fill={color.surface}
              stroke={tint}
              strokeWidth={2.5}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}
