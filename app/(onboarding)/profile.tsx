import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/auth/SessionProvider';
import { useI18n } from '@/i18n';
import { FormScreen } from '@/shell/FormScreen';
import { space } from '@/theme/tokens';
import { Button, TextField } from '@/ui';

export default function ProfileStep() {
  const { t } = useI18n();
  const router = useRouter();
  const { session, saveProfile } = useSession();
  const [name, setName] = useState(session?.profile?.name ?? '');
  const [barangay, setBarangay] = useState(session?.profile?.barangay ?? '');
  const [showErrors, setShowErrors] = useState(false);

  async function onContinue() {
    if (!name.trim() || !barangay.trim()) {
      setShowErrors(true);
      return;
    }
    await saveProfile({ name: name.trim(), barangay: barangay.trim() });
    router.replace('/plot');
  }

  const required = (value: string) => (showErrors && !value.trim() ? t('profileRequired') : null);

  return (
    <FormScreen
      title={t('profileTitle')}
      canGoBack={false}
      footer={<Button label={t('continue')} onPress={onContinue} block />}
    >
      <View style={{ gap: space.xl }}>
        <TextField
          label={t('profileName')}
          error={required(name)}
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          autoFocus
        />
        <TextField
          label={t('profileBarangay')}
          hint={t('profileBarangayHint')}
          error={required(barangay)}
          value={barangay}
          onChangeText={setBarangay}
          autoCapitalize="words"
        />
      </View>
    </FormScreen>
  );
}
