import { seedDemoFarm } from '@/db/demo';
import { openTestDb, readerFor, runnerFor, seedCrops } from '@/db/testing/openTestDb';

import { buildFarmSummary } from './farmSummary';

const TODAY = '2026-09-28';

describe('buildFarmSummary', () => {
  it('describes the sample farm from its records', () => {
    const db = openTestDb();
    seedCrops(db);
    let n = 0;
    seedDemoFarm(runnerFor(db), 'owner-1', TODAY, () => `id-${++n}`);
    const text = buildFarmSummary(readerFor(db), 'owner-1', TODAY);

    expect(text).toContain('This season: sold ₱12,510, spent ₱11,980, net ₱530.00.');
    expect(text).toContain('- Corn on "Luna sa bungtod"');
    expect(text).toContain('50 kg Tomato from "Duol sa suba", 2 days before it spoils.');
    expect(text).toContain('fertilizer ₱5,500.00');
    expect(text).toMatch(/Tomato ₱4\d\.\d\d per kg \(4 sales\)/);
    db.close();
  });

  it('says so when there is nothing recorded', () => {
    const db = openTestDb();
    seedCrops(db);
    const text = buildFarmSummary(readerFor(db), 'owner-1', TODAY);
    expect(text).toContain('No plantings recorded yet.');
    expect(text).not.toContain('Unsold produce');
    db.close();
  });

  it('never includes who the farmer is', () => {
    const db = openTestDb();
    seedCrops(db);
    const text = buildFarmSummary(readerFor(db), 'owner-1', TODAY);
    expect(text).not.toMatch(/owner-1|@/);
    db.close();
  });
});
