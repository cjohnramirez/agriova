import { deleteAccount, type Steps } from './core';

function steps(userId: string | null, removed = true) {
  const removeUser = jest.fn(async () => removed);
  const s: Steps = { whoIsAsking: async () => userId, removeUser };
  return { s, removeUser };
}

describe('deleteAccount', () => {
  it('deletes the caller’s own account', async () => {
    const { s, removeUser } = steps('farmer-1');
    expect(await deleteAccount('POST', s)).toEqual({ status: 200, body: { deleted: true } });
    expect(removeUser).toHaveBeenCalledWith('farmer-1');
  });

  it('refuses a caller who is not signed in', async () => {
    const { s, removeUser } = steps(null);
    expect((await deleteAccount('POST', s)).status).toBe(401);
    expect(removeUser).not.toHaveBeenCalled();
  });

  it('only answers POST', async () => {
    const { s, removeUser } = steps('farmer-1');
    expect((await deleteAccount('GET', s)).status).toBe(405);
    expect(removeUser).not.toHaveBeenCalled();
  });

  it('reports a failed delete so the app keeps the farmer signed in', async () => {
    const { s } = steps('farmer-1', false);
    expect(await deleteAccount('POST', s)).toEqual({
      status: 500,
      body: { error: 'delete_failed' },
    });
  });
});
