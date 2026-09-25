import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../drizzle/migrations';
import { db, seedReferenceData } from './client';
import { useI18n } from '@/i18n';
import { color, fontSize, fontWeight, layout, space } from '@/theme/tokens';

/**
 * Holds the app back until the database is migrated and seeded.
 *
 * Everything downstream may assume the schema exists and the crop list is
 * populated, which keeps every screen free of "is the database ready" branches.
 *
 * A migration failure is shown rather than swallowed. If the schema is broken
 * the app cannot record anything, and silently presenting an empty ledger to a
 * farmer who just logged a sale would be far worse than an honest error.
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!success) return;
    seedReferenceData()
      .then(() => setSeeded(true))
      .catch((cause: Error) => setSeedError(cause));
  }, [success]);

  const failure = error ?? seedError;

  if (failure) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{t('dbErrorTitle')}</Text>
        <Text style={styles.errorBody}>{failure.message}</Text>
      </View>
    );
  }

  if (!success || !seeded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={color.textOnBrand} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.brand,
    padding: layout.screenPadding,
    gap: space.md,
  },
  errorTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: color.textOnBrand,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: fontSize.caption,
    color: color.textOnBrand,
    opacity: 0.85,
    textAlign: 'center',
  },
});
