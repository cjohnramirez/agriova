import type { SqlReader } from '@/db/read';
import type { ChatMessage } from '@/db/schema';
import type { Clock, SqlDb } from '@/db/write';

/**
 * The assistant conversation on the phone. A question is saved first and
 * sent after, so one asked in a field with no signal is not lost: it waits as
 * `pending` and goes out the next time `answerPending` runs.
 */

/** Earlier turns sent with each question, matching the Edge Function. */
const HISTORY_TURNS = 6;

export type Turn = { role: 'farmer' | 'assistant'; text: string };

/** What the send step can report back. */
export type SendResult =
  { ok: true; answer: string } | { ok: false; reason: 'offline' | 'limit' | 'failed' };

export type Sender = (question: string, history: Turn[]) => Promise<SendResult>;

export function listChat(db: SqlReader, ownerId: string): ChatMessage[] {
  return db.all<ChatMessage>(
    `select id, owner_id as ownerId, role, text, status, created_at as createdAt
     from chat_message where owner_id = ? order by created_at, rowid`,
    [ownerId],
  );
}

function insert(
  db: SqlDb,
  ownerId: string,
  row: Pick<ChatMessage, 'role' | 'text' | 'status'>,
  clock: Clock,
): string {
  const id = clock.uuid();
  db.run(
    `insert into chat_message (id, owner_id, role, text, status, created_at)
     values (?, ?, ?, ?, ?, ?)`,
    [id, ownerId, row.role, row.text, row.status, clock.now()],
  );
  return id;
}

/** Saves a question to send. Blank questions are ignored. */
export function addQuestion(db: SqlDb, ownerId: string, text: string, clock: Clock): string | null {
  const question = text.trim();
  if (!question) return null;
  return insert(db, ownerId, { role: 'farmer', text: question, status: 'pending' }, clock);
}

export type Outcome = 'done' | 'offline' | 'failed';

/**
 * Sends every waiting question, oldest first, each with the turns before it.
 *
 * Stops at the first network failure and leaves the rest pending, so they go
 * in order next time. A daily-limit refusal is answered with the app's own
 * note and not retried: sending again would only be refused again.
 */
export async function answerPending(
  db: SqlDb,
  ownerId: string,
  send: Sender,
  notes: { limit: string; failed: string },
  clock: Clock,
): Promise<Outcome> {
  for (;;) {
    const messages = listChat(db, ownerId);
    const index = messages.findIndex((m) => m.role === 'farmer' && m.status === 'pending');
    if (index < 0) return 'done';
    const question = messages[index];

    // Every exchange answered so far. Questions still queued behind this one
    // are not answered yet, so they stay out; notes were never real answers.
    const history = messages
      .filter((m) => m.status === 'answered')
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, text: m.text }));

    const result = await send(question.text, history);
    if (!result.ok && result.reason === 'offline') return 'offline';

    db.transaction(() => {
      // A question met only by the app's note is resolved too, as `note`, so it
      // is not resent and not treated as a real exchange later.
      db.run(`update chat_message set status = ? where id = ?`, [
        result.ok ? 'answered' : 'note',
        question.id,
      ]);
      if (result.ok) {
        insert(db, ownerId, { role: 'assistant', text: result.answer, status: 'answered' }, clock);
      } else {
        const note = result.reason === 'limit' ? notes.limit : notes.failed;
        insert(db, ownerId, { role: 'assistant', text: note, status: 'note' }, clock);
      }
    });
    if (!result.ok && result.reason === 'failed') return 'failed';
  }
}
