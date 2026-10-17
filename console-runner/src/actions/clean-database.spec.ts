import { describe, expect, it, vi } from 'vitest';

import { cleanDatabase } from './clean-database';

/**
 * A double that records every call, including `db()` itself — the declined case has
 * to prove that *nothing* on the client was touched, not merely that the drop was
 * skipped.
 */
function createClientDouble(dropImpl = vi.fn().mockResolvedValue(true)) {
  const db = vi.fn(() => ({ databaseName: 'memora', dropDatabase: dropImpl }));

  return { client: { db }, db, dropDatabase: dropImpl };
}

describe('cleanDatabase', () => {
  it('con la confirmación aceptada, borra la base exactamente una vez y lo informa', async () => {
    const { client, dropDatabase } = createClientDouble();

    const result = await cleanDatabase(client, true);

    expect(dropDatabase).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'dropped', database: 'memora' });
  });

  it('con la confirmación denegada, no toca el cliente y devuelve cancelado', async () => {
    const { client, db, dropDatabase } = createClientDouble();

    const result = await cleanDatabase(client, false);

    expect(result).toEqual({ status: 'cancelled' });
    expect(dropDatabase).not.toHaveBeenCalled();
    // Not even `db()`: declining must perform no write "of any kind" (R50).
    expect(db).not.toHaveBeenCalled();
  });

  it('si el borrado falla, lo informa en vez de lanzar, para que el menú siga usable', async () => {
    const { client } = createClientDouble(
      vi.fn().mockRejectedValue(new Error('not authorized to execute dropDatabase')),
    );

    const result = await cleanDatabase(client, true);

    expect(result).toEqual({
      status: 'failed',
      error: 'not authorized to execute dropDatabase',
    });
  });
});
