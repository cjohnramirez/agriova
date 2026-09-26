import { useRouter } from 'expo-router';
import { Tractor } from 'lucide-react-native';
import { useState } from 'react';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery, useWriter } from '@/db/live';
import { cropName, listCrops, listPlots } from '@/db/read';
import { todayLocal } from '@/db/units';
import { createCycle } from '@/db/write';
import { useI18n } from '@/i18n';
import { ChoiceCard, ChoicePills, EmptyState, Field } from '@/ui';

import { DayPicker } from './DayPicker';
import { RecordForm } from './RecordForm';

type Errors = Partial<Record<'crop' | 'plot' | 'save', string>>;

/** A new planting: which crop, on which plot, from when. */
export function PlantingForm() {
  const { t, language } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();
  const writer = useWriter();
  const crops = useLiveQuery((db) => listCrops(db), []);
  const plots = useLiveQuery((db) => listPlots(db, ownerId), [ownerId]);

  const [cropId, setCrop] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [day, setDay] = useState(todayLocal());
  const [errors, setErrors] = useState<Errors>({});

  const plotId = picked ?? (plots.length === 1 ? plots[0].id : null);

  function save() {
    setErrors({
      crop: cropId ? undefined : t('formPickOne'),
      plot: plotId ? undefined : t('formPickOne'),
    });
    if (!cropId || !plotId) return;

    try {
      createCycle(writer.db, ownerId, { plotId, cropId, plantedOn: day }, writer.clock);
    } catch {
      setErrors({ save: t('formSaveFailed') });
      return;
    }
    router.back();
  }

  if (plots.length === 0) {
    return (
      <RecordForm title={t('plantingTitle')}>
        <EmptyState
          icon={Tractor}
          title={t('plantingNoPlotTitle')}
          body={t('plantingNoPlotBody')}
          action={{ label: t('fieldsAdd'), onPress: () => router.replace('/plot/new') }}
        />
      </RecordForm>
    );
  }

  return (
    <RecordForm title={t('plantingTitle')} onSave={save} error={errors.save}>
      <Field label={t('plantingCrop')} error={errors.crop}>
        <ChoicePills
          label={t('plantingCrop')}
          selected={cropId}
          onSelect={setCrop}
          options={crops.map((crop) => ({ key: crop.id, label: cropName(crop, language) }))}
        />
      </Field>
      <Field label={t('plantingPlot')} error={errors.plot}>
        {plots.map((plot) => (
          <ChoiceCard
            key={plot.id}
            title={plot.name}
            selected={plot.id === plotId}
            onPress={() => setPicked(plot.id)}
          />
        ))}
      </Field>
      <DayPicker value={day} onChange={setDay} />
    </RecordForm>
  );
}
