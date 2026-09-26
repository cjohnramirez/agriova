import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { formatPhone, isValidCode } from '@/auth/phone';
import { useSession } from '@/auth/SessionProvider';
import { useI18n } from '@/i18n';
import { FormScreen } from '@/shell/FormScreen';
import { Button, TextField } from '@/ui';

export default function Code() {
  const { t } = useI18n();
  const router = useRouter();
  const { signIn } = useSession();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onVerify() {
    if (!isValidCode(code)) {
      setError(t('loginInvalidCode'));
      return;
    }
    // Step 7 checks the code with Supabase. Until then any six digits pass.
    // No navigation needed: the route guards move the farmer on.
    setBusy(true);
    await signIn(phone);
  }

  return (
    <FormScreen
      title={t('loginCodeTitle')}
      subtitle={t('loginCodeSubtitle', { phone: `+63 ${formatPhone(phone)}` })}
      footer={
        <>
          <Button label={t('loginVerify')} onPress={onVerify} disabled={busy} block />
          <Button
            variant="secondary"
            label={t('loginChangeNumber')}
            onPress={() => router.back()}
            block
          />
        </>
      }
    >
      <TextField
        label={t('loginCodeTitle')}
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
