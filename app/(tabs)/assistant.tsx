import { Bot, SendHorizontal, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { useOwnerId } from '@/auth/SessionProvider';
import { supabase } from '@/backend/supabase';
import { useLiveQuery, useWriter } from '@/db/live';
import { todayLocal } from '@/db/units';
import { addQuestion, answerPending, listChat } from '@/features/chat/chat';
import { buildFarmSummary } from '@/features/chat/farmSummary';
import { supabaseSender } from '@/features/chat/sender';
import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { color, radius, space } from '@/theme/tokens';
import { Button, ChatBubble, ChoiceCard, Text, TextField } from '@/ui';

/**
 * The farm assistant, laid out like the prototype's ERP AI screen: greeting,
 * two suggested questions, the conversation, then the question box.
 *
 * Questions are saved on the phone before they are sent, so one asked with no
 * signal waits and goes out by itself when the app is next open with signal.
 * Answers come from the `ai-chat` Edge Function with a summary of the
 * farmer's own records.
 */
export default function Assistant() {
  const { t, language } = useI18n();
  const ownerId = useOwnerId();
  const writer = useWriter();
  const messages = useLiveQuery((db) => listChat(db, ownerId), [ownerId]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const running = useRef(false);

  const flush = useCallback(async () => {
    if (running.current || !ownerId) return;
    running.current = true;
    setThinking(true);
    try {
      const send = supabaseSender(language, () =>
        buildFarmSummary(writer.db, ownerId, todayLocal()),
      );
      await answerPending(
        writer.db,
        ownerId,
        send,
        {
          limit: t('assistantLimit'),
          // Without Supabase keys there is no assistant to reach at all.
          failed: supabase ? t('assistantFailed') : t('assistantNotYet'),
        },
        writer.clock,
      );
    } finally {
      running.current = false;
      setThinking(false);
    }
  }, [language, ownerId, t, writer]);

  // Anything left waiting goes out on open and each time the app comes back.
  useEffect(() => {
    void flush();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flush();
    });
    return () => sub.remove();
  }, [flush]);

  function send(text: string) {
    if (!addQuestion(writer.db, ownerId, text, writer.clock)) return;
    setDraft('');
    void flush();
  }

  const waiting = messages.some((m) => m.role === 'farmer' && m.status === 'pending');

  return (
    <TabScreen showRecord={false}>
      <View style={styles.greeting}>
        <View style={styles.badge}>
          <Bot size={36} color={color.accent} />
        </View>
        <Text variant="title" accessibilityRole="header">
          {t('assistantGreeting')}
        </Text>
        <Text tone="muted">{t('assistantIntro')}</Text>
      </View>

      {messages.length === 0 ? (
        // Stacked, not two-up: a question squeezed into half the width breaks
        // mid-word in Bisaya.
        <View style={styles.thread}>
          {(['assistantSuggest1', 'assistantSuggest2'] as const).map((key) => (
            <ChoiceCard
              key={key}
              icon={Sparkles}
              title={t('assistantSuggestion')}
              hint={t(key)}
              onPress={() => setDraft(t(key))}
            />
          ))}
        </View>
      ) : (
        <View style={styles.thread} accessibilityLiveRegion="polite">
          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              from={m.role}
              text={m.text}
              note={m.status === 'pending' && !thinking ? t('assistantWaiting') : undefined}
            />
          ))}
          {thinking && waiting ? (
            <ChatBubble from="assistant" text={t('assistantThinking')} />
          ) : null}
        </View>
      )}

      <View style={styles.ask}>
        <TextField
          label={t('assistantInput')}
          placeholder={t('assistantInputPlaceholder')}
          value={draft}
          onChangeText={setDraft}
          multiline
          returnKeyType="send"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => send(draft)}
        />
        <Button
          icon={SendHorizontal}
          label={t('assistantSend')}
          onPress={() => send(draft)}
          disabled={!draft.trim()}
          block
        />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: space.sm, paddingTop: space.lg },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thread: { gap: space.md },
  ask: { gap: space.md },
});
