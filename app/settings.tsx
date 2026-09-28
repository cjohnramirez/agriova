import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import {
  CircleHelp,
  FlaskConical,
  Globe,
  Info,
  LogOut,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { Alert } from 'react-native';

import { useSession } from '@/auth/SessionProvider';
import { useSync } from '@/sync/SyncProvider';
import { deviceRunner } from '@/db/client';
import { seedDemoFarm } from '@/db/demo';
import { todayLocal } from '@/db/units';
import { LANGUAGE_NAMES, useI18n } from '@/i18n';
import { Card, ListRow, Screen, ScreenHeader } from '@/ui';

/**
 * Account and settings, following the prototype's Settings screen. Account
 * deletion lives here because both app stores require it to be reachable from
 * inside the app, not only by email.
 */
export default function Settings() {
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const { session, signOut } = useSession();
  const { syncNow } = useSync();

  // One last sync first: with signal, nothing unsent is lost on the way out.
  const leave = async () => {
    await syncNow();
    await signOut();
  };

  function confirm(message: string, action: string, onConfirm: () => void) {
    Alert.alert('', message, [
      { text: t('cancel'), style: 'cancel' },
      { text: action, style: 'destructive', onPress: onConfirm },
    ]);
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          title={t('settingsTitle')}
          backLabel={t('back')}
          onBack={() => router.back()}
        />
      }
    >
      <Card gap="none">
        <ListRow icon={UserRound} title={session?.profile?.name ?? ''} subtitle={session?.email} />
      </Card>

      <Card gap="none">
        <ListRow
          icon={Globe}
          title={t('settingsLanguage')}
          value={LANGUAGE_NAMES[language]}
          onPress={() => setLanguage(language === 'bis' ? 'en' : 'bis')}
        />
        <ListRow icon={CircleHelp} title={t('settingsHelp')} onPress={() => {}} />
        <ListRow icon={Info} title={t('settingsAbout')} onPress={() => {}} />
      </Card>

      {__DEV__ && session ? (
        <Card gap="none">
          <ListRow
            icon={FlaskConical}
            title={t('devSampleFarm')}
            onPress={() => {
              seedDemoFarm(deviceRunner, session.userId, todayLocal(), randomUUID);
              router.back();
            }}
          />
        </Card>
      ) : null}

      <Card gap="none">
        <ListRow
          icon={LogOut}
          title={t('settingsLogout')}
          onPress={() => confirm(t('settingsLogoutConfirm'), t('settingsLogout'), leave)}
        />
        <ListRow
          icon={Trash2}
          title={t('settingsDelete')}
          tone="danger"
          // Step 7 also deletes the server-side account before signing out.
          onPress={() => confirm(t('settingsDeleteConfirm'), t('settingsDeleteAction'), signOut)}
        />
      </Card>
    </Screen>
  );
}
