import type { UnsoldHarvest } from '@/db/read';

import { produceOnHand, spoilageStatus } from './spoilage';

describe('spoilageStatus', () => {
  it('counts down from the harvest day', () =>
    expect(spoilageStatus('2026-08-14', 7, '2026-08-16')).toEqual({ daysLeft: 5, level: 'fresh' }));

  it('warns three days out', () =>
    expect(spoilageStatus('2026-08-14', 7, '2026-08-18').level).toBe('soon'));

  it('is urgent on the last day', () =>
    expect(spoilageStatus('2026-08-14', 7, '2026-08-20')).toEqual({
      daysLeft: 1,
      level: 'urgent',
    }));

  // Moringa keeps two days, so it needs selling from the day it is picked.
  it('warns about a two-day crop from harvest day', () =>
    expect(spoilageStatus('2026-08-14', 2, '2026-08-14').level).toBe('soon'));
});

describe('produceOnHand', () => {
  const base: UnsoldHarvest = {
    id: 'h',
    harvestedOn: '2026-08-10',
    remainingMilli: 1000,
    unit: 'kg',
    shelfLifeDays: 7,
    plotName: 'Uma',
    cropBis: 'Kamatis',
    cropEn: 'Tomato',
  };

  it('puts the most urgent first and drops spoiled produce', () => {
    const list = produceOnHand(
      [
        { ...base, id: 'rice', shelfLifeDays: 365 },
        { ...base, id: 'spoiled', harvestedOn: '2026-08-01' },
        { ...base, id: 'tomato' },
      ],
      '2026-08-15',
    );
    expect(list.map((h) => [h.id, h.daysLeft])).toEqual([
      ['tomato', 2],
      ['rice', 360],
    ]);
  });
});
