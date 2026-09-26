import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery, useWriter } from '@/db/live';
import { listCycles } from '@/db/read';
import type { ExpenseCategory } from '@/db/schema';
import { cleanDecimalInput, parsePositive, pesosToCentavos, todayLocal } from '@/db/units';
import { recordExpense } from '@/db/write';
import { useI18n } from '@/i18n';
import { categoryLabel, EXPENSE_CATEGORIES } from '@/i18n/labels';
import { ChoicePills, Field, TextField } from '@/ui';

import { CyclePicker, NoCycle } from './CyclePicker';
import { DayPicker } from './DayPicker';
import { RecordForm } from './RecordForm';

type Errors = Partial<Record<'amount' | 'category' | 'cycle' | 'save', string>>;

/** Money spent: how much, on what, for which planting, and when. */
export function ExpenseForm() {
  const { t } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();
  const writer = useWriter();
  const cycles = useLiveQuery((db) => listCycles(db, ownerId), [ownerId]);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [day, setDay] = useState(todayLocal());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const cycleId = picked ?? (cycles.length === 1 ? cycles[0].id : null);

  function save() {
    const pesos = parsePositive(amount);
    const next: Errors = {
      amount: pesos ? undefined : t('formInvalidAmount'),
      category: category ? undefined : t('formPickOne'),
      cycle: cycleId ? undefined : t('formPickOne'),
    };
    setErrors(next);
    if (!pesos || !category || !cycleId) return;

    try {
      recordExpense(
        writer.db,
        ownerId,
        { cycleId, category, amountCentavos: pesosToCentavos(pesos), spentOn: day, note },
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
      <RecordForm title={t('expenseTitle')}>
        <NoCycle />
      </RecordForm>
    );
  }

  return (
    <RecordForm title={t('expenseTitle')} onSave={save} error={errors.save}>
      <TextField
        label={t('expenseAmount')}
        size="large"
        prefix="₱"
        keyboardType="decimal-pad"
        placeholder="0.00"
        value={amount}
        error={errors.amount}
        onChangeText={(text) => setAmount(cleanDecimalInput(text))}
      />
      <Field label={t('expenseCategory')} error={errors.category}>
        <ChoicePills
          label={t('expenseCategory')}
          selected={category}
          onSelect={setCategory}
          options={EXPENSE_CATEGORIES.map((key) => ({ key, label: categoryLabel(t, key) }))}
        />
      </Field>
      <CyclePicker
        label={t('expenseCycle')}
        cycles={cycles}
        selected={cycleId}
        onSelect={setPicked}
        error={errors.cycle}
      />
      <DayPicker value={day} onChange={setDay} />
      <TextField label={t('expenseNote')} value={note} onChangeText={setNote} />
    </RecordForm>
  );
}
