import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { isValidCode } from '@/auth/email';
import { useSession } from '@/auth/SessionProvider';
import { AuthError } from '@/backend/auth';
import { useI18n } from '@/i18n';
import { FormScreen } from '@/shell/FormScreen';
import { Button, TextField } from '@/ui';

export default function Code() {
  const { t } = useI18n();
  const router = useRouter();
  const { sendCode, verifyCode } = useSession();
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onVerify() {
    if (!isValidCode(code)) {
      setError(t('loginInvalidCode'));
      return;
    }
    // No navigation on success: the route guards move the farmer on.
    setBusy(true);
    try {
      await verifyCode(email, code);
    } catch (cause) {
      setError(
        cause instanceof AuthError && cause.reason === 'wrongCode'
          ? t('loginWrongCode')
          : t('loginSendFailed'),
      );
      setBusy(false);
    }
  }

  async function onResend() {
    setError(null);
    try {
      await sendCode(email);
      setNotice(t('loginCodeResent'));
    } catch {
      setError(t('loginSendFailed'));
    }
  }

  return (
    <FormScreen
      title={t('loginCodeTitle')}
      subtitle={t('loginCodeSubtitle', { email })}
      footer={
        <>
          <Button label={t('loginVerify')} onPress={onVerify} disabled={busy} block />
          <Button variant="secondary" label={t('loginResend')} onPress={onResend} block />
          <Button
            variant="secondary"
            label={t('loginChangeEmail')}
            onPress={() => router.back()}
            block
          />
        </>
      }
    >
      <TextField
        label={t('loginCodeTitle')}
        hint={notice ?? undefined}
        error={error}
        size="large"
        value={code}
        onChangeText={(text) => {
          setCode(text.replace(/\D/g, '').slice(0, 6));
          setError(null);
        }}
        placeholder="000000"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        autoFocus
        onSubmitEditing={onVerify}
      />
    </FormScreen>
  );
}
