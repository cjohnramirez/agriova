import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery } from '@/db/live';
import { cropName, unsoldHarvests } from '@/db/read';
import { formatQuantity, todayLocal } from '@/db/units';
import { useI18n } from '@/i18n';
import { countdownLabel } from '@/i18n/labels';
import { produceOnHand, type ProduceOnHand } from '@/rules/spoilage';

export type ProduceItem = ProduceOnHand & {
  /** "50 kilo nga Kamatis" */
  label: string;
  /** "2 ka adlaw na lang" */
  countdown: string;
};

/**
 * Unsold produce with its spoilage countdown, worded for display. Home lists
 * it; Notifications turns the urgent ones into alerts.
 */
export function useProduceOnHand(): ProduceItem[] {
  const { t, language } = useI18n();
  const ownerId = useOwnerId();
  const today = todayLocal();
  const harvests = useLiveQuery((db) => unsoldHarvests(db, ownerId), [ownerId]);

  return produceOnHand(harvests, today).map((item) => ({
    ...item,
    label: t('produceItem', {
      quantity: formatQuantity(item.remainingMilli, item.unit, language),
      crop: cropName(item, language),
    }),
    countdown: countdownLabel(t, item.daysLeft),
  }));
}

/** The alert sentence for one item: "50 kilo nga Kamatis gikan sa Uma. 2 ka adlaw na lang." */
export function sellSoonBody(
  t: ReturnType<typeof useI18n>['t'],
  language: ReturnType<typeof useI18n>['language'],
  item: ProduceItem,
): string {
  return t('sellSoonBody', {
    quantity: formatQuantity(item.remainingMilli, item.unit, language),
    crop: cropName(item, language),
    plot: item.plotName,
    countdown: item.countdown,
  });
}
