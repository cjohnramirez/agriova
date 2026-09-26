import { useRouter } from 'expo-router';
import { HandCoins } from 'lucide-react-native';
import { useState } from 'react';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery, useWriter } from '@/db/live';
import { cropName, unsoldHarvests } from '@/db/read';
import type { SaleChannel } from '@/db/schema';
import {
  cleanDecimalInput,
  formatPesos,
  formatQuantity,
  parsePositive,
  pesosToCentavos,
  quantityToMilli,
  saleTotalCentavos,
  todayLocal,
  unitName,
} from '@/db/units';
import { recordSale } from '@/db/write';
import { useI18n } from '@/i18n';
import { formatDate } from '@/i18n/dates';
import { channelLabel } from '@/i18n/labels';
import { ChoiceCard, ChoicePills, EmptyState, Field, Text, TextField } from '@/ui';

import { DayPicker } from './DayPicker';
import { RecordForm } from './RecordForm';

const CHANNELS: SaleChannel[] = ['direct', 'middleman', 'marketplace'];

type Errors = Partial<Record<'harvest' | 'quantity' | 'price' | 'channel' | 'save', string>>;

/**
 * Produce sold, always from a recorded harvest, so the profit counts only what
 * was actually picked. The total shows as it is typed, the same figure the
 * farmer agreed with the buyer, rounded once.
 */
export function SaleForm() {
  const { t, language } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();
  const writer = useWriter();
  const harvests = useLiveQuery((db) => unsoldHarvests(db, ownerId), [ownerId]);

  const [picked, setPicked] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [channel, setChannel] = useState<SaleChannel | null>(null);
  const [buyer, setBuyer] = useState('');
  const [day, setDay] = useState(todayLocal());
  const [errors, setErrors] = useState<Errors>({});

  const harvestId = picked ?? (harvests.length === 1 ? harvests[0].id : null);
  const harvest = harvests.find((h) => h.id === harvestId);
  const unit = harvest?.unit ?? 'kg';

  const amount = parsePositive(quantity);
  const pesos = parsePositive(price);
  const total =
    amount && pesos ? saleTotalCentavos(quantityToMilli(amount), pesosToCentavos(pesos)) : null;
  const left = harvest ? formatQuantity(harvest.remainingMilli, harvest.unit, language) : '';

  function save() {
    const tooMuch = !!harvest && !!amount && quantityToMilli(amount) > harvest.remainingMilli;
    setErrors({
      harvest: harvestId ? undefined : t('formPickOne'),
      quantity: !amount ? t('formInvalidAmount') : tooMuch ? t('saleTooMuch', { left }) : undefined,
      price: pesos ? undefined : t('formInvalidAmount'),
      channel: channel ? undefined : t('formPickOne'),
    });
    if (!harvestId || !amount || tooMuch || !pesos || !channel) return;

    try {
      recordSale(
        writer.db,
        ownerId,
        {
          harvestId,
          channel,
          buyerName: buyer,
          quantityMilli: quantityToMilli(amount),
          unitPriceCentavos: pesosToCentavos(pesos),
          soldOn: day,
        },
        writer.clock,
      );
    } catch {
      setErrors({ save: t('formSaveFailed') });
      return;
    }
    router.back();
  }

  if (harvests.length === 0) {
    return (
      <RecordForm title={t('saleTitle')}>
        <EmptyState
          icon={HandCoins}
          title={t('saleNoHarvestTitle')}
          body={t('saleNoHarvestBody')}
          action={{
            label: t('recordHarvest'),
            onPress: () =>
              router.replace({ pathname: '/record/[kind]', params: { kind: 'harvest' } }),
          }}
        />
      </RecordForm>
    );
  }

  return (
    <RecordForm title={t('saleTitle')} onSave={save} error={errors.save}>
      <Field label={t('saleHarvest')} error={errors.harvest}>
        {harvests.map((h) => (
          <ChoiceCard
            key={h.id}
            title={t('saleHarvestOption', {
              crop: cropName(h, language),
              date: formatDate(h.harvestedOn, language),
            })}
            hint={t('saleHarvestLeft', {
              left: formatQuantity(h.remainingMilli, h.unit, language),
              plot: h.plotName,
            })}
            selected={h.id === harvestId}
            onPress={() => setPicked(h.id)}
          />
        ))}
      </Field>
      <TextField
        label={t('saleQuantity')}
        hint={harvest ? t('saleHarvestLeft', { left, plot: harvest.plotName }) : undefined}
        keyboardType="decimal-pad"
        placeholder="0"
        value={quantity}
        error={errors.quantity}
        onChangeText={(text) => setQuantity(cleanDecimalInput(text, 3))}
      />
      <TextField
        label={t('salePrice', { unit: unitName(unit, language) })}
        prefix="₱"
        keyboardType="decimal-pad"
        placeholder="0.00"
        value={price}
        error={errors.price}
        onChangeText={(text) => setPrice(cleanDecimalInput(text))}
      />
      {total !== null ? (
        <Text variant="figure" tone="accent" numeric accessibilityLiveRegion="polite">
          {t('saleTotal', { amount: formatPesos(total) })}
        </Text>
      ) : null}
      <Field label={t('saleChannel')} error={errors.channel}>
        <ChoicePills
          label={t('saleChannel')}
          selected={channel}
          onSelect={setChannel}
          options={CHANNELS.map((key) => ({ key, label: channelLabel(t, key) }))}
        />
      </Field>
      <TextField label={t('saleBuyer')} value={buyer} onChangeText={setBuyer} />
      <DayPicker value={day} onChange={setDay} />
    </RecordForm>
  );
}
