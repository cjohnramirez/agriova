import type { ReactNode } from 'react';

import { useI18n } from '@/i18n';
import { FormScreen } from '@/shell/FormScreen';
import { Button, Text } from '@/ui';

/**
 * The frame every record form shares: title, questions spaced a section apart,
 * and Save pinned at the bottom. Without `onSave` the footer is empty, for the
 * "start a planting first" state.
 */
export function RecordForm({
  title,
  onSave,
  error,
  children,
}: {
  title: string;
  onSave?: () => void;
  /** A save that failed for a reason the fields do not explain. */
  error?: string | null;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <FormScreen
      title={title}
      footer={
        onSave ? (
          <>
            {error ? (
              <Text tone="danger" accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
            <Button label={t('formSave')} onPress={onSave} block />
          </>
        ) : null
      }
    >
      {children}
    </FormScreen>
  );
}
