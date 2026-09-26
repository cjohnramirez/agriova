import { Bot, SendHorizontal, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { color, radius, space } from '@/theme/tokens';
import { Button, ChatBubble, ChoiceCard, Text, TextField, Tiles } from '@/ui';

type Message = { id: number; text: string };

/**
 * The farm assistant, laid out like the prototype's ERP AI screen: greeting,
 * two suggested questions, then the question box.
 *
 * Not connected yet. Step 8 adds the `ai-chat` Edge Function; until then a
 * question stays on screen with an honest note rather than a made-up answer.
 */
export default function Assistant() {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    setMessages((list) => [...list, { id: list.length + 1, text: question }]);
    setDraft('');
  }

  return (
    <TabScreen showRecord={false}>
      <View style={styles.greeting}>
        <View style={styles.badge}>
          <Bot size={36} color={color.accent} strokeWidth={1.75} />
        </View>
        <Text variant="title" accessibilityRole="header">
          {t('assistantGreeting')}
        </Text>
        <Text tone="muted">{t('assistantIntro')}</Text>
      </View>

      {messages.length === 0 ? (
        <Tiles>
          {(['assistantSuggest1', 'assistantSuggest2'] as const).map((key) => (
            <View key={key} style={styles.tile}>
              <ChoiceCard
                icon={Sparkles}
                title={t('assistantSuggestion')}
                hint={t(key)}
                onPress={() => setDraft(t(key))}
              />
            </View>
          ))}
        </Tiles>
      ) : (
        <View style={styles.thread}>
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id}
              from="farmer"
              text={message.text}
              note={index === messages.length - 1 ? t('assistantNotYet') : undefined}
            />
          ))}
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
  tile: { flex: 1 },
  thread: { gap: space.md },
  ask: { gap: space.md },
});
