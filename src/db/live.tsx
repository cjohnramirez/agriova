import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
} from 'react';

import type { SqlReader } from './read';

/**
 * Where screens read from, and how they learn that something changed. The app
 * provides the device database; screen tests provide an in-memory one, so a
 * test renders the real queries against real SQLite.
 */
export type DataSource = {
  reader: SqlReader;
  /** Calls `onChange` after any write. Returns the unsubscribe. */
  subscribe: (onChange: () => void) => () => void;
};

const DataSourceContext = createContext<DataSource | null>(null);

export function DataSourceProvider({
  source,
  children,
}: {
  source: DataSource;
  children: ReactNode;
}) {
  return <DataSourceContext.Provider value={source}>{children}</DataSourceContext.Provider>;
}

/**
 * Runs a read and re-runs it whenever the database changes, so saving a sale
 * on one screen updates the profit on Home without any screen refreshing
 * another.
 *
 * Reads are synchronous. The farm's whole ledger is a few thousand rows at
 * most, and a synchronous read means a screen never flashes an empty state
 * before its data arrives.
 */
export function useLiveQuery<T>(read: (db: SqlReader) => T, deps: DependencyList): T {
  const source = useContext(DataSourceContext);
  if (!source) throw new Error('useLiveQuery must be used inside DataSourceProvider');

  const [version, setVersion] = useState(0);
  useEffect(() => source.subscribe(() => setVersion((v) => v + 1)), [source]);

  // `read` is a new closure every render; `deps` lists what it captures, and
  // their joined key stands in for them so the list stays a fixed length.
  const key = JSON.stringify(deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => read(source.reader), [source, version, key]);
}
