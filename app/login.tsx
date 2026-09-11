import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { color, fontSize, fontWeight, layout, radius, space } from '@/theme/tokens';

type Step = 'phone' | 'code';

/**
 * Phone sign-in. The Supabase OTP calls are not wired yet, so confirming any
 * well-formed 6-digit code enters the app. The two-step shape is final; only
 * the calls behind `onContinue` and `onVerify` change later.
 */
export default function Login() {
  const { t } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onContinue() {
    if (!/^9\d{9}$/.test(phone)) {
      setError(t('loginInvalidPhone'));
      return;
    }
    setError(null);
    setStep('code');
  }

  function onVerify() {
    if (!/^\d{6}$/.test(code)) {
      setError(t('loginInvalidCode'));
      return;
    }
    setError(null);
    router.replace('/(tabs)');
  }

  const isPhoneStep = step === 'phone';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mark}>
            <Text style={styles.markLetter}>A</Text>
          </View>

          <Text style={styles.title}>{isPhoneStep ? t('loginTitle') : t('loginCodeTitle')}</Text>
          <Text style={styles.subtitle}>
            {isPhoneStep ? t('loginSubtitle') : t('loginCodeSubtitle', { phone: `+63 ${phone}` })}
          </Text>

          {isPhoneStep ? (
            <View style={styles.field}>
              <Text style={styles.label}>{t('loginPhoneLabel')}</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.prefix}>+63</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={(next) => setPhone(next.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  placeholder="9XX XXX XXXX"
                  placeholderTextColor={color.textFaint}
                  maxLength={10}
                  autoFocus
                />
              </View>
              <Text style={styles.hint}>{t('loginPhoneHint')}</Text>
            </View>
          ) : (
            <View style={styles.field}>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={(next) => setCode(next.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                placeholder="000000"
                placeholderTextColor={color.textFaint}
                maxLength={6}
                autoFocus
              />
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
            onPress={isPhoneStep ? onContinue : onVerify}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>
              {isPhoneStep ? t('loginContinue') : t('loginVerify')}
            </Text>
          </Pressable>

          {!isPhoneStep && (
            <Pressable
              style={styles.secondary}
              onPress={() => {
                setStep('phone');
                setCode('');
                setError(null);
              }}
              accessibilityRole="button"
            >
              <ArrowLeft size={20} color={color.textMuted} />
              <Text style={styles.secondaryText}>{t('loginBack')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: layout.screenPadding,
    justifyContent: 'center',
    gap: space.md,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.brand,
    marginBottom: space.sm,
  },
  markLetter: {
    fontSize: 40,
    fontWeight: fontWeight.bold,
    color: color.textOnBrand,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: color.textMuted,
    marginBottom: space.lg,
  },
  field: { gap: space.sm },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: color.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    minHeight: layout.minTouch + 8,
  },
  prefix: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.medium,
    color: color.textMuted,
    marginRight: space.sm,
  },
  phoneInput: {
    flex: 1,
    fontSize: fontSize.title,
    color: color.text,
    paddingVertical: space.md,
  },
  codeInput: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    fontSize: fontSize.figure,
    fontWeight: fontWeight.bold,
    color: color.text,
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: space.lg,
    minHeight: layout.minTouch + 16,
  },
  hint: {
    fontSize: fontSize.caption,
    color: color.textMuted,
  },
  error: {
    fontSize: fontSize.body,
    color: color.danger,
  },
  primary: {
    minHeight: layout.minTouch,
    borderRadius: radius.md,
    backgroundColor: color.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.lg,
  },
  primaryPressed: { backgroundColor: color.actionPressed },
  primaryText: {
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.semibold,
    color: color.textOnBrand,
  },
  secondary: {
    minHeight: layout.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  secondaryText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: color.textMuted,
  },
});
