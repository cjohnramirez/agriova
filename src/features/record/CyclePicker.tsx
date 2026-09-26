import { useRouter } from 'expo-router';
import { Sprout } from 'lucide-react-native';

import { cropName, type CycleSummary } from '@/db/read';
import { useI18n } from '@/i18n';
import { ChoiceCard, EmptyState, Field } from '@/ui';

/**
 * "For which planting?" as big radio cards: crop on top, plot beneath. With a
 * single open planting the form preselects it, but the card still shows, so
 * the farmer sees where the record is going.
 */
export function CyclePicker({
  label,
  cycles,
  selected,
  onSelect,
  error,
}: {
  label: string;
  cycles: readonly CycleSummary[];
  selected: string | null;
  onSelect: (id: string) => void;
  error?: string | null;
}) {
  const { language } = useI18n();
  return (
    <Field label={label} error={error}>
      {cycles.map((cycle) => (
        <ChoiceCard
          key={cycle.id}
          title={cropName(cycle, language)}
          hint={cycle.plotName}
          selected={cycle.id === selected}
          onPress={() => onSelect(cycle.id)}
        />
      ))}
    </Field>
  );
}

/** Shown in place of a form that needs a planting when there is none yet. */
export function NoCycle() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <EmptyState
      icon={Sprout}
      title={t('noCycleTitle')}
      body={t('noCycleBody')}
      action={{
        label: t('noCycleAction'),
        onPress: () => router.replace({ pathname: '/record/[kind]', params: { kind: 'planting' } }),
      }}
    />
  );
}
