import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/auth/SessionProvider';
import { deviceRunner } from '@/db/client';
import { createPlot } from '@/db/write';
import { useI18n } from '@/i18n';
import { FormScreen } from '@/shell/FormScreen';
import { space } from '@/theme/tokens';
import { Button, TextField } from '@/ui';

export default function FirstPlotStep() {
  const { t } = useI18n();
  const { session, finishOnboarding } = useSession();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (!session) return;
    if (!name.trim()) {
      setError(t('profileRequired'));
      return;
    }
    const areaSqm = area ? Number(area) : null;
    try {
      createPlot(
        deviceRunner,
        session.userId,
        { name, areaSqm },
        { now: Date.now, uuid: randomUUID },
      );
    } catch {
      setError(t('plotSaveFailed'));
      return;
    }
    await finishOnboarding();
  }

  return (
    <FormScreen
      title={t('plotTitle')}
      subtitle={t('plotBody')}
      canGoBack={false}
      footer={
        <>
          <Button label={t('plotSave')} onPress={onSave} block />
          <Button variant="secondary" label={t('plotSkip')} onPress={finishOnboarding} block />
        </>
      }
    >
      <View style={{ gap: space.xl }}>
        <TextField
          label={t('plotName')}
          placeholder={t('plotNamePlaceholder')}
          error={error}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          autoCapitalize="sentences"
          autoFocus
        />
        <TextField
          label={t('plotArea')}
          hint={t('plotAreaHint')}
          value={area}
          onChangeText={(text) => setArea(text.replace(/\D/g, '').replace(/^0+/, ''))}
          keyboardType="number-pad"
          placeholder="2500"
        />
      </View>
    </FormScreen>
  );
}
