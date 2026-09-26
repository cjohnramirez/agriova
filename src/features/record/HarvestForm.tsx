import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery, useWriter } from '@/db/live';
import { listCycles } from '@/db/read';
import type { Unit } from '@/db/schema';
import {
  cleanDecimalInput,
  parsePositive,
  quantityToMilli,
  todayLocal,
  unitName,
  UNITS,
} from '@/db/units';
import { recordHarvest } from '@/db/write';
import { useI18n } from '@/i18n';
import { ChoicePills, Field, TextField } from '@/ui';

import { CyclePicker, NoCycle } from './CyclePicker';
import { DayPicker } from './DayPicker';
import { RecordForm } from './RecordForm';

type Errors = Partial<Record<'quantity' | 'cycle' | 'save', string>>;

/**
 * Produce picked: from which planting, how much, and when. The unit starts at
 * the crop's usual one (sacks for rice, bundles for moringa) and can change.
 */
export function HarvestForm() {
  const { t, language } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();
  const writer = useWriter();
  const cycles = useLiveQuery((db) => listCycles(db, ownerId), [ownerId]);

  const [picked, setPicked] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [chosenUnit, setUnit] = useState<Unit | null>(null);
  const [day, setDay] = useState(todayLocal());
  const [errors, setErrors] = useState<Errors>({});

  const cycleId = picked ?? (cycles.length === 1 ? cycles[0].id : null);
  const cycle = cycles.find((c) => c.id === cycleId);
  const unit = chosenUnit ?? cycle?.defaultUnit ?? 'kg';

  function save() {
    const amount = parsePositive(quantity);
    setErrors({
      quantity: amount ? undefined : t('formInvalidAmount'),
      cycle: cycleId ? undefined : t('formPickOne'),
    });
    if (!amount || !cycleId) return;

    try {
      recordHarvest(
        writer.db,
        ownerId,
        { cycleId, quantityMilli: quantityToMilli(amount), unit, harvestedOn: day },
        writer.clock,
      );
    } catch {
      setErrors({ save: t('formSaveFailed') });
      return;
    }
    router.back();
  }

  if (cycles.length === 0) {
    return (
      <RecordForm title={t('harvestTitle')}>
        <NoCycle />
      </RecordForm>
    );
  }

  return (
    <RecordForm title={t('harvestTitle')} onSave={save} error={errors.save}>
      <CyclePicker
        label={t('harvestCycle')}
        cycles={cycles}
        selected={cycleId}
        onSelect={(id) => {
          setPicked(id);
          setUnit(null);
        }}
        error={errors.cycle}
      />
      <TextField
        label={t('harvestQuantity')}
        size="large"
        keyboardType="decimal-pad"
        placeholder="0"
        value={quantity}
        error={errors.quantity}
        onChangeText={(text) => setQuantity(cleanDecimalInput(text, 3))}
      />
      <Field label={t('harvestUnit')}>
        <ChoicePills
          label={t('harvestUnit')}
          selected={unit}
          onSelect={setUnit}
          options={UNITS.map((key) => ({ key, label: unitName(key, language) }))}
        />
      </Field>
      <DayPicker value={day} onChange={setDay} />
    </RecordForm>
  );
}
