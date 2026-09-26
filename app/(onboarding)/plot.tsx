import { useSession } from '@/auth/SessionProvider';
import { PlotForm } from '@/features/PlotForm';
import { useI18n } from '@/i18n';
import { Button } from '@/ui';

export default function FirstPlotStep() {
  const { t } = useI18n();
  const { finishOnboarding } = useSession();

  return (
    <PlotForm
      title={t('plotTitle')}
      subtitle={t('plotBody')}
      canGoBack={false}
      onSaved={finishOnboarding}
      secondary={
        <Button variant="secondary" label={t('plotSkip')} onPress={finishOnboarding} block />
      }
    />
  );
}
