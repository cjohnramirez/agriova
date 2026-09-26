import { StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme/tokens';
import { Text } from './Text';

type ChatBubbleProps = {
  text: string;
  from: 'farmer' | 'assistant';
  /** A line under the bubble, e.g. that the question is waiting for signal. */
  note?: string;
};

/**
 * One chat message. The farmer's own messages sit right in brand green, the
 * assistant's left in white, so who said what never depends on color alone.
 */
export function ChatBubble({ text, from, note }: ChatBubbleProps) {
  const mine = from === 'farmer';
  return (
    <View style={[styles.wrap, mine ? styles.right : styles.left]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text tone={mine ? 'onBrand' : 'default'}>{text}</Text>
      </View>
      {note ? <Text tone="muted">{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '85%', gap: space.xs },
  right: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  left: { alignSelf: 'flex-start' },
  bubble: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.card,
  },
  mine: { backgroundColor: color.brand },
  theirs: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
});
