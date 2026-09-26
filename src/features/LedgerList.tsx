import { HandCoins, Receipt, Sprout, type LucideIcon } from 'lucide-react-native';

import type { LedgerEntry, LedgerKind } from '@/db/read';
import { useI18n } from '@/i18n';
import { formatDate } from '@/i18n/dates';
import { describeEntry } from '@/i18n/labels';
import { Card, ListRow } from '@/ui';

const ICONS: Record<LedgerKind, LucideIcon> = {
  expense: Receipt,
  harvest: Sprout,
  sale: HandCoins,
};

/**
 * Records as rows: what, where, and the signed amount. The icon repeats the
 * kind so a list of mixed records scans without reading every title.
 */
export function LedgerList({
  entries,
  showDate = false,
}: {
  entries: readonly LedgerEntry[];
  /** On for lists spanning several days, like Home's latest records. */
  showDate?: boolean;
}) {
  const { t, language } = useI18n();

  return (
    <Card gap="none">
      {entries.map((entry) => {
        const { title, where, value } = describeEntry(t, language, entry);
        const subtitle = showDate ? `${formatDate(entry.date, language)} · ${where}` : where;
        return (
          <ListRow
            key={`${entry.kind}-${entry.id}`}
            icon={ICONS[entry.kind]}
            title={title}
            subtitle={subtitle}
            value={value}
          />
        );
      })}
    </Card>
  );
}
