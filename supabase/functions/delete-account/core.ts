/**
 * Account deletion, free of Deno and network code so Jest can test it.
 * `index.ts` supplies the two steps that need the server.
 *
 * Both app stores require that a farmer can delete their account from inside
 * the app. Deleting the auth user removes everything they own: every farmer
 * table references `auth.users` with `on delete cascade`.
 */

export type Outcome = { status: number; body: { deleted: true } | { error: string } };

export type Steps = {
  /** The caller's account id from their session token, or null if signed out. */
  whoIsAsking(): Promise<string | null>;
  /** Deletes the account for good. False if the server refused. */
  removeUser(userId: string): Promise<boolean>;
};

/**
 * The account deleted is always the caller's own, read from their token. The
 * request body is never consulted, so no one can name another farmer's id.
 */
export async function deleteAccount(method: string, steps: Steps): Promise<Outcome> {
  if (method !== 'POST') return { status: 405, body: { error: 'method' } };
  const userId = await steps.whoIsAsking();
  if (!userId) return { status: 401, body: { error: 'signed_out' } };
  if (!(await steps.removeUser(userId))) return { status: 500, body: { error: 'delete_failed' } };
  return { status: 200, body: { deleted: true } };
}
