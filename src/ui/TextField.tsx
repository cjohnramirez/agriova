import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { color, layout, radius, space, type } from '@/theme/tokens';
import { Text } from './Text';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  hint?: string;
  /** Replaces the hint and turns the border red. Always text, never color alone. */
  error?: string | null;
  /** Fixed text before the input, e.g. "+63". */
  prefix?: ReactNode;
  /** `large` for the one field a screen is about, like a phone number. */
  size?: 'normal' | 'large';
};

export function TextField({
  label,
  hint,
  error,
  prefix,
  size = 'normal',
  onFocus,
  onBlur,
  ...input
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const textStyle = size === 'large' ? styles.large : type.body;
  const focusInput = () => inputRef.current?.focus();

  return (
    <View style={styles.field}>
      {/* Tapping the label focuses the field, as on paper forms. Older users
          often aim at the big text rather than the box. The input carries the
          label for screen readers, so this copy is hidden from them. */}
      <Pressable onPress={focusInput} accessible={false} importantForAccessibility="no">
        <Text variant="bodyStrong">{label}</Text>
      </Pressable>
      <Pressable
        onPress={focusInput}
        accessible={false}
        style={[styles.box, focused && styles.focused, !!error && styles.invalid]}
      >
        {prefix ? (
          <Text tone="muted" style={textStyle}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          {...input}
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={color.textFaint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, textStyle]}
        />
      </Pressable>
      {error ? (
        <Text tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text tone="muted">{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.sm },
  box: {
    minHeight: layout.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
  },
  focused: { borderColor: color.accent, borderWidth: 2 },
  invalid: { borderColor: color.danger, borderWidth: 2 },
  input: { flex: 1, color: color.text, paddingVertical: space.md },
  large: { ...type.title, fontFamily: type.bodyStrong.fontFamily },
});
