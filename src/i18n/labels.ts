import { cropName, type LedgerEntry } from '@/db/read';
import type { CycleStatus, ExpenseCategory } from '@/db/schema';
import { formatPesos, formatQuantity } from '@/db/units';

import type { Translate } from './index';
import type { Language, StringKey } from './strings';

/**
 * Words for database values. Screens never show a raw enum like "fertilizer"
 * or "harvested"; they go through here so both languages stay complete.
 */

const CATEGORY: Record<ExpenseCategory, StringKey> = {
  seed: 'categorySeed',
  fertilizer: 'categoryFertilizer',
  pesticide: 'categoryPesticide',
  labor: 'categoryLabor',
  fuel: 'categoryFuel',
  transport: 'categoryTransport',
  rent: 'categoryRent',
  other: 'categoryOther',
};

const STATUS: Record<CycleStatus, StringKey> = {
  growing: 'statusGrowing',
  harvested: 'statusHarvested',
  closed: 'statusClosed',
};

export const categoryLabel = (t: Translate, category: ExpenseCategory) => t(CATEGORY[category]);

export const statusLabel = (t: Translate, status: CycleStatus) => t(STATUS[status]);

/** "3 days left", "1 day left", "Last day". */
export function countdownLabel(t: Translate, daysLeft: number): string {
  if (daysLeft <= 0) return t('produceLastDay');
  if (daysLeft === 1) return t('produceOneDay');
  return t('produceDaysLeft', { days: daysLeft });
}

/**
 * A ledger row as a title, a where-line and a signed value. Money out carries
 * a minus and money in a plus, so direction never depends on color.
 */
export function describeEntry(t: Translate, language: Language, entry: LedgerEntry) {
  const crop = cropName(entry, language);
  const where = t('ledgerWhere', { crop, plot: entry.plotName });

  switch (entry.kind) {
    case 'expense':
      return {
        title: categoryLabel(t, entry.category ?? 'other'),
        where,
        value: formatPesos(-(entry.amountCentavos ?? 0)),
      };
    case 'sale':
      return {
        title: t('ledgerSale', { crop }),
        where: entry.plotName,
        value: `+${formatPesos(entry.amountCentavos ?? 0)}`,
      };
    case 'harvest':
      return {
        title: t('ledgerHarvest', { crop }),
        where: entry.plotName,
        value: formatQuantity(entry.quantityMilli ?? 0, entry.unit ?? 'kg', language),
      };
  }
}
