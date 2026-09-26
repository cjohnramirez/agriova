import { useRouter } from 'expo-router';

import { PlotForm } from '@/features/PlotForm';
import { useI18n } from '@/i18n';

export default function NewPlot() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <PlotForm
      title={t('plotAddTitle')}
      subtitle={t('plotAddBody')}
      canGoBack
      onSaved={() => router.back()}
    />
  );
}
