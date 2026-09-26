import type { UnsoldHarvest } from '@/db/read';
import { daysBetween } from '@/db/units';

/**
 * The spoilage countdown: how many days unsold produce has left, from the
 * crop's ambient shelf life. It replaces the prototype's "plant health" card,
 * which needed sensors no smallholder owns.
 *
 * Runs on the phone with no signal. Shelf lives in the seed list are already
 * conservative, so a warning here errs early, never late.
 */

export type SpoilageLevel = 'fresh' | 'soon' | 'urgent';

/**
 * Three days out is a reminder: time to find a buyer. One day out is an alarm,
 * because selling tomorrow means leaving for market today.
 */
const URGENT_DAYS = 1;
const SOON_DAYS = 3;

export type SpoilageStatus = { daysLeft: number; level: SpoilageLevel };

export function spoilageStatus(
  harvestedOn: string,
  shelfLifeDays: number,
  today: string,
): SpoilageStatus {
  const daysLeft = shelfLifeDays - daysBetween(harvestedOn, today);
  const level = daysLeft <= URGENT_DAYS ? 'urgent' : daysLeft <= SOON_DAYS ? 'soon' : 'fresh';
  return { daysLeft, level };
}

export type ProduceOnHand = UnsoldHarvest & SpoilageStatus;

/**
 * Unsold produce that can still be sold, most urgent first. Produce already
 * past its shelf life is dropped: a countdown below zero is not something the
 * farmer can act on, and it would sit on the home screen forever.
 */
export function produceOnHand(harvests: readonly UnsoldHarvest[], today: string): ProduceOnHand[] {
  return harvests
    .map((h) => ({ ...h, ...spoilageStatus(h.harvestedOn, h.shelfLifeDays, today) }))
    .filter((h) => h.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
