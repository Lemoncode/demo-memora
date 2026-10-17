import { describe, expect, it, vi } from 'vitest';

import { checkConnection } from './check-connection';

describe('checkConnection', () => {
  it('informa del host y la base de datos alcanzados cuando el ping responde', async () => {
    const client = {
      options: { hosts: ['localhost:27017'] },
      db: () => ({
        databaseName: 'memora',
        command: vi.fn().mockResolvedValue({ ok: 1 }),
      }),
    };

    const result = await checkConnection(client);

    expect(result).toEqual({ ok: true, host: 'localhost:27017', database: 'memora' });
  });

  it('no lanza cuando el servidor no responde: devuelve el mensaje del driver y la pista de pnpm db:up', async () => {
    const client = {
      options: { hosts: ['localhost:27017'] },
      db: () => ({
        databaseName: 'memora',
        command: vi
          .fn()
          .mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:27017')),
      }),
    };

    const result = await checkConnection(client);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('se esperaba un fallo');
    expect(result.error).toContain('connect ECONNREFUSED 127.0.0.1:27017');
    expect(result.error).toContain('pnpm db:up');
  });
});
