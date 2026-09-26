import { useRouter } from 'expo-router';
import { Bell, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSession } from '@/auth/SessionProvider';
import { useI18n } from '@/i18n';
import { color, layout, radius, space } from '@/theme/tokens';
import { IconButton, Screen, Text, TopBar } from '@/ui';

type TabScreenProps = {
  children: ReactNode;
  /** The record button sits on tabs where recording makes sense. */
  showRecord?: boolean;
};

/** Every tab: the prototype's TopBar, the screen frame, and the record button. */
export function TabScreen({ children, showRecord = true }: TabScreenProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { session } = useSession();

  return (
    <View style={styles.flex}>
      <Screen
        header={
          <TopBar
            greeting={t('topGreeting')}
            name={session?.profile?.name ?? ''}
            avatarLabel={t('topSettings')}
            onPressAvatar={() => router.push('/settings')}
            actions={
              <IconButton
                icon={Bell}
                label={t('topNotifications')}
                onPress={() => router.push('/notifications')}
              />
            }
          />
        }
      >
        {children}
      </Screen>
      {showRecord ? <RecordButton label={t('recordButton')} /> : null}
    </View>
  );
}

/**
 * The one way to add anything: a labelled pill, not a bare "+". An icon alone
 * is ambiguous to a first-time user; "Itala" says what it does.
 */
function RecordButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/record')}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
    >
      <Plus size={24} color={color.textOnBrand} strokeWidth={2.5} />
      <Text variant="bodyStrong" tone="onBrand">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fab: {
    position: 'absolute',
    right: layout.screenPadding,
    bottom: space.lg,
    minHeight: layout.minTouch,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: color.action,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    elevation: 4,
    shadowColor: color.brandDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: { backgroundColor: color.actionPressed },
});
