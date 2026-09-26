import { useRouter } from 'expo-router';
import { useState } from 'react';

import { formatPhone, isValidPhone, normalizePhone } from '@/auth/phone';
import { useI18n } from '@/i18n';
import { FormScreen } from '@/shell/FormScreen';
import { Button, TextField } from '@/ui';

export default function Phone() {
  const { t } = useI18n();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onContinue() {
    if (!isValidPhone(phone)) {
      setError(t('loginInvalidPhone'));
      return;
    }
    // Step 7 sends the OTP here, through Supabase, before moving on.
    router.push({ pathname: '/code', params: { phone } });
  }

  return (
    <FormScreen
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      footer={<Button label={t('continue')} onPress={onContinue} block />}
    >
      <TextField
        label={t('loginPhoneLabel')}
        hint={t('loginPhoneHint')}
        error={error}
        size="large"
        prefix="+63"
        value={formatPhone(phone)}
        onChangeText={(text) => {
          setPhone(normalizePhone(text));
          setError(null);
        }}
        placeholder="9XX XXX XXXX"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoFocus
        returnKeyType="next"
        onSubmitEditing={onContinue}
      />
    </FormScreen>
  );
}
