import { useRouter } from 'expo-router';
import { Bell, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/SessionProvider';
import { useProduceOnHand } from '@/features/useProduceOnHand';
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
  // The bell shows a dot while any produce is close to spoiling.
  const hasAlerts = useProduceOnHand().some((item) => item.level !== 'fresh');

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
                badge={hasAlerts}
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
/**
 * On iOS the system tab bar floats over the content (Liquid Glass), so the
 * button sits above it: the safe area plus the bar's height. Android's custom
 * bar takes its own space, so there the screen already ends above it.
 */
const IOS_TAB_BAR = 56;

function RecordButton({ label }: { label: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === 'ios' ? insets.bottom + IOS_TAB_BAR + space.lg : space.lg;
  return (
    <Pressable
      onPress={() => router.push('/record')}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.fabPressed]}
    >
      <Plus size={24} color={color.textOnBrand} />
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
