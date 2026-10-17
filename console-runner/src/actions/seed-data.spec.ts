import { describe, expect, it } from 'vitest';

import { loadSeedData } from './seed-data';

describe('loadSeedData', () => {
  it('devuelve la marca de pendiente con un mensaje que dice TODO', () => {
    const result = loadSeedData();

    expect(result.status).toBe('pending');
    expect(result.message).toContain('TODO');
  });

  // R43 demands "no database access at all". The structural proof is that the
  // operation takes no client: there is nothing it could call. This pins that
  // signature, so adding a client parameter (and with it the chance of real I/O)
  // breaks the suite instead of passing silently.
  it('no recibe cliente alguno, así que no puede tocar la base de datos', () => {
    expect(loadSeedData).toHaveLength(0);
  });
});
