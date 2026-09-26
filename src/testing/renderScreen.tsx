import { act, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { seedDemoFarm } from '@/db/demo';
import { DataSourceProvider, type DataSource } from '@/db/live';
import { openTestDb, readerFor, runnerFor, seedCrops } from '@/db/testing/openTestDb';
import { todayLocal } from '@/db/units';
import { I18nProvider } from '@/i18n';

export const TEST_OWNER = 'owner-1';

/**
 * Renders a screen against a real in-memory SQLite database with every
 * migration applied, optionally holding the sample farm. The screen runs its
 * real queries; only the router and the session are mocked, in each test file.
 *
 * `changed()` plays the device's change listener, for tests that write and
 * then expect the screen to update.
 */
export async function renderScreen(ui: ReactElement, { farm = true } = {}) {
  const db = openTestDb();
  seedCrops(db);
  let n = 0;
  const uuid = () => `test-${++n}`;
  if (farm) seedDemoFarm(runnerFor(db), TEST_OWNER, todayLocal(), uuid);

  const listeners = new Set<() => void>();
  let tick = Date.now();
  const source: DataSource = {
    reader: readerFor(db),
    writer: runnerFor(db),
    clock: { now: () => ++tick, uuid },
    subscribe: (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
  };

  await render(
    <I18nProvider>
      <DataSourceProvider source={source}>{ui}</DataSourceProvider>
    </I18nProvider>,
  );

  return {
    db,
    runner: runnerFor(db),
    uuid,
    changed: () => act(() => listeners.forEach((listener) => listener())),
  };
}
