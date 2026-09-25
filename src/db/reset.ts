/**
 * Deletes every farmer-authored row, children before parents so foreign keys
 * hold. Reference data (crops, prices) stays, because it is not the farmer's
 * and a fresh install would only have to download it again.
 *
 * Kept as plain SQL so the exact statement the device runs is also the one the
 * tests run. Callers must execute it inside a transaction.
 */
export const RESET_LOCAL_DATA_SQL = `
  delete from outbox;
  delete from sale;
  delete from harvest;
  delete from expense;
  delete from cycle;
  delete from plot;
  delete from sync_state;
`;
