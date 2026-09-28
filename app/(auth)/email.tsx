import { useRouter } from 'expo-router';
import { useState } from 'react';

import { isValidEmail, normalizeEmail } from '@/auth/email';
import { useSession } from '@/auth/SessionProvider';
import { useI18n } from '@/i18n';
import { FormScreen } from '@/shell/FormScreen';
import { Button, TextField } from '@/ui';

export default function Email() {
  const { t } = useI18n();
  const router = useRouter();
  const { sendCode } = useSession();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onContinue() {
    if (busy) return;
    const address = normalizeEmail(email);
    if (!isValidEmail(address)) {
      setError(t('loginInvalidEmail'));
      return;
    }
    setBusy(true);
    try {
      await sendCode(address);
      router.push({ pathname: '/code', params: { email: address } });
    } catch {
      setError(t('loginSendFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      footer={<Button label={t('continue')} onPress={onContinue} disabled={busy} block />}
    >
      <TextField
        label={t('loginEmailLabel')}
        hint={t('loginEmailHint')}
        error={error}
        size="large"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError(null);
        }}
        placeholder="nena@gmail.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={onContinue}
      />
    </FormScreen>
  );
}
