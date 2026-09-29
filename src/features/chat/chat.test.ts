import { openTestDb, runnerFor, type TestDb } from '@/db/testing/openTestDb';
import type { SqlDb } from '@/db/write';

import { addQuestion, answerPending, listChat, type Sender } from './chat';

const OWNER = 'owner-1';
const NOTES = { limit: 'Daily limit reached.', failed: 'Could not answer.' };

let raw: TestDb;
let db: SqlDb;
let t = 0;
const clock = { now: () => ++t, uuid: () => `m-${t}-${Math.random()}` };

beforeEach(() => {
  raw = openTestDb();
  db = runnerFor(raw);
});
afterEach(() => raw.close());

const shape = () => listChat(db, OWNER).map((m) => `${m.role}:${m.status}:${m.text}`);

describe('assistant conversation', () => {
  it('answers a question and marks it answered', async () => {
    addQuestion(db, OWNER, ' When to sell tomatoes? ', clock);
    const send: Sender = async () => ({ ok: true, answer: 'On Saturday.' });
    expect(await answerPending(db, OWNER, send, NOTES, clock)).toBe('done');
    expect(shape()).toEqual([
      'farmer:answered:When to sell tomatoes?',
      'assistant:answered:On Saturday.',
    ]);
  });

  it('keeps questions asked without signal, and sends them in order later', async () => {
    addQuestion(db, OWNER, 'First?', clock);
    addQuestion(db, OWNER, 'Second?', clock);
    expect(
      await answerPending(db, OWNER, async () => ({ ok: false, reason: 'offline' }), NOTES, clock),
    ).toBe('offline');
    expect(shape()).toEqual(['farmer:pending:First?', 'farmer:pending:Second?']);

    const asked: string[] = [];
    await answerPending(
      db,
      OWNER,
      async (q, history) => {
        asked.push(`${q} after ${history.length}`);
        return { ok: true, answer: `re ${q}` };
      },
      NOTES,
      clock,
    );
    // The second question is sent with the first exchange as its history.
    expect(asked).toEqual(['First? after 0', 'Second? after 2']);
  });

  it('answers a daily-limit refusal with a note instead of retrying', async () => {
    addQuestion(db, OWNER, 'One more?', clock);
    const send = jest.fn<ReturnType<Sender>, Parameters<Sender>>(async () => ({
      ok: false,
      reason: 'limit',
    }));
    await answerPending(db, OWNER, send, NOTES, clock);
    await answerPending(db, OWNER, send, NOTES, clock);
    expect(send).toHaveBeenCalledTimes(1);
    expect(shape()).toEqual(['farmer:note:One more?', 'assistant:note:Daily limit reached.']);
  });

  it('leaves notes out of the history it sends', async () => {
    addQuestion(db, OWNER, 'A?', clock);
    await answerPending(db, OWNER, async () => ({ ok: false, reason: 'limit' }), NOTES, clock);
    addQuestion(db, OWNER, 'B?', clock);
    let sentHistory: unknown[] = ['unset'];
    await answerPending(
      db,
      OWNER,
      async (_q, history) => {
        sentHistory = history;
        return { ok: true, answer: 'ok' };
      },
      NOTES,
      clock,
    );
    expect(sentHistory).toEqual([]);
  });

  it('ignores a blank question', () => expect(addQuestion(db, OWNER, '   ', clock)).toBeNull());
});
