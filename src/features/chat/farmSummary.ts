import {
  expensesByCategory,
  listCycles,
  salePrices,
  seasonTotals,
  unsoldHarvests,
  type SqlReader,
} from '@/db/read';
import { addDays, formatPesos, formatQuantity } from '@/db/units';
import { produceOnHand } from '@/rules/spoilage';

/** Enough for the assistant to answer about the season; small enough to be cheap. */
const MAX_CHARS = 3_500;
const PRICE_WINDOW_DAYS = 90;

/**
 * The farmer's records as short plain text, sent with each question so the
 * assistant can answer from their own numbers. English labels on purpose:
 * the model reads them either way and answers in the farmer's language.
 *
 * Only this summary leaves the phone, never the raw ledger, and it holds no
 * name, phone or email.
 */
export function buildFarmSummary(db: SqlReader, ownerId: string, today: string): string {
  const lines: string[] = [`Today: ${today}.`];

  const season = seasonTotals(db, ownerId);
  lines.push(
    `This season: sold ${formatPesos(season.revenueCentavos)}, spent ${formatPesos(season.expenseCentavos)}, net ${formatPesos(season.netCentavos)}.`,
  );

  const cycles = listCycles(db, ownerId);
  if (cycles.length) {
    lines.push('Plantings now:');
    for (const c of cycles) {
      lines.push(
        `- ${c.cropEn} on "${c.plotName}", planted ${c.plantedOn}, ${c.status}, net so far ${formatPesos(c.netCentavos)}.`,
      );
    }
  } else {
    lines.push('No plantings recorded yet.');
  }

  const produce = produceOnHand(unsoldHarvests(db, ownerId), today);
  if (produce.length) {
    lines.push('Unsold produce:');
    for (const p of produce) {
      lines.push(
        `- ${formatQuantity(p.remainingMilli, p.unit, 'en')} ${p.cropEn} from "${p.plotName}", ${p.daysLeft} days before it spoils.`,
      );
    }
  }

  const spending = expensesByCategory(db, ownerId);
  if (spending.length) {
    lines.push(
      `Spending this season: ${spending.map((s) => `${s.category} ${formatPesos(s.amountCentavos)}`).join(', ')}.`,
    );
  }

  const prices = salePrices(db, ownerId, addDays(today, -PRICE_WINDOW_DAYS));
  if (prices.length) {
    lines.push(
      `Average prices the farmer got (last ${PRICE_WINDOW_DAYS} days): ${prices
        .map((p) => `${p.cropEn} ${formatPesos(p.avgCentavos)} per ${p.unit} (${p.sales} sales)`)
        .join(', ')}.`,
    );
  }

  const text = lines.join('\n');
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n(more records not shown)` : text;
}
