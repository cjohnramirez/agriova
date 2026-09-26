import { addDays } from './units';
import type { SqlRunner, SqlValue } from './write';

/**
 * A believable small farm: two plots, tomatoes and corn growing, an eggplant
 * cycle already closed, five months of expenses, harvests and sales, and
 * tomatoes on hand close to spoiling.
 *
 * Used by the screen tests and, in development builds only, from Settings, so
 * every screen can be looked at with data in it before the record forms exist.
 *
 * Rows skip the outbox on purpose: sample data must never sync to a real
 * account.
 */
export function seedDemoFarm(
  db: SqlRunner,
  ownerId: string,
  today: string,
  uuid: () => string,
  now = Date.now(),
): void {
  const day = (offset: number) => addDays(today, offset);
  let tick = now;
  // Strictly increasing timestamps keep same-day records in insertion order.
  const stamp = () => ++tick;

  const insert = (table: string, row: Record<string, SqlValue>) => {
    const t = stamp();
    const full = { ...row, owner_id: ownerId, created_at: t, updated_at: t, deleted_at: null };
    const columns = Object.keys(full);
    db.run(
      `insert into ${table} (${columns.join(', ')}) values (${columns.map(() => '?').join(', ')})`,
      Object.values(full),
    );
  };

  db.transaction(() => {
    const river = uuid();
    const hill = uuid();
    insert('plot', { id: river, name: 'Duol sa suba', area_sqm: 2500, photo_uri: null });
    insert('plot', { id: hill, name: 'Luna sa bungtod', area_sqm: 8000, photo_uri: null });

    const tomato = uuid();
    const corn = uuid();
    const eggplant = uuid();
    insert('cycle', {
      id: eggplant,
      plot_id: river,
      crop_id: 'crop-eggplant',
      planted_on: day(-240),
      expected_harvest_on: day(-150),
      status: 'closed',
    });
    insert('cycle', {
      id: tomato,
      plot_id: river,
      crop_id: 'crop-tomato',
      planted_on: day(-120),
      expected_harvest_on: day(-45),
      status: 'harvested',
    });
    insert('cycle', {
      id: corn,
      plot_id: hill,
      crop_id: 'crop-corn',
      planted_on: day(-60),
      expected_harvest_on: day(40),
      status: 'growing',
    });

    const expense = (cycleId: string, category: string, pesos: number, offset: number) =>
      insert('expense', {
        id: uuid(),
        cycle_id: cycleId,
        category,
        amount_centavos: pesos * 100,
        spent_on: day(offset),
        note: null,
        photo_uri: null,
      });

    expense(eggplant, 'seed', 600, -240);
    expense(tomato, 'seed', 850, -120);
    expense(tomato, 'fertilizer', 2400, -100);
    expense(tomato, 'labor', 1500, -95);
    expense(tomato, 'pesticide', 780, -70);
    expense(corn, 'seed', 1200, -60);
    expense(corn, 'fertilizer', 3100, -40);
    expense(corn, 'labor', 1800, -20);
    expense(tomato, 'transport', 350, -1);

    const harvest = (id: string, kg: number, offset: number) =>
      insert('harvest', {
        id,
        cycle_id: tomato,
        quantity_milli: kg * 1000,
        unit: 'kg',
        harvested_on: day(offset),
        quality: 'good',
        photo_uri: null,
      });
    const sale = (
      harvestId: string,
      channel: string,
      kg: number,
      pesosPerKg: number,
      offset: number,
    ) =>
      insert('sale', {
        id: uuid(),
        harvest_id: harvestId,
        channel,
        buyer_name: channel === 'middleman' ? 'Manong Ben' : null,
        quantity_milli: kg * 1000,
        unit_price_centavos: pesosPerKg * 100,
        total_centavos: kg * pesosPerKg * 100,
        sold_on: day(offset),
      });

    const first = uuid();
    const second = uuid();
    const third = uuid();
    harvest(first, 120, -45);
    sale(first, 'middleman', 120, 38, -44);
    harvest(second, 150, -20);
    sale(second, 'direct', 90, 45, -18);
    sale(second, 'middleman', 60, 40, -17);
    // On hand today: 80 kg picked five days ago, 30 sold. Two days left.
    harvest(third, 80, -5);
    sale(third, 'direct', 30, 50, -3);
  });
}
