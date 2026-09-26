import { randomUUID } from 'expo-crypto';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { useOwnerId } from '@/auth/SessionProvider';
import { deviceRunner } from '@/db/client';
import { createPlot } from '@/db/write';
import { useI18n } from '@/i18n';
import { FormScreen } from '@/shell/FormScreen';
import { space } from '@/theme/tokens';
import { Button, TextField } from '@/ui';

type PlotFormProps = {
  title: string;
  subtitle: string;
  canGoBack: boolean;
  onSaved: () => void;
  /** A second footer button, e.g. onboarding's "Skip for now". */
  secondary?: ReactNode;
};

/** Name and size of a plot. Used by onboarding and by Fields' "Add plot". */
export function PlotForm({ title, subtitle, canGoBack, onSaved, secondary }: PlotFormProps) {
  const { t } = useI18n();
  const ownerId = useOwnerId();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSave() {
    if (!ownerId) return;
    if (!name.trim()) {
      setError(t('profileRequired'));
      return;
    }
    try {
      createPlot(
        deviceRunner,
        ownerId,
        { name, areaSqm: area ? Number(area) : null },
        { now: Date.now, uuid: randomUUID },
      );
    } catch {
      setError(t('plotSaveFailed'));
      return;
    }
    onSaved();
  }

  return (
    <FormScreen
      title={title}
      subtitle={subtitle}
      canGoBack={canGoBack}
      footer={
        <>
          <Button label={t('plotSave')} onPress={onSave} block />
          {secondary}
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
