import { describe, expect, it, vi } from 'vitest';

import {
  createMongoClient,
  dropDatabase,
  pingDatabase,
  type MongoClientLike,
} from './client';

describe('createMongoClient', () => {
  it('falla rápido: timeout de selección de servidor de 5 s como máximo', () => {
    const client = createMongoClient('mongodb://localhost:27017/memora');

    expect(client.options.serverSelectionTimeoutMS).toBeLessThanOrEqual(5000);
  });

  // The runner hands a real driver client to the primitives below, so this pins both
  // halves of that contract: it compiles only if MongoClient satisfies
  // MongoClientLike, and it shows db() resolving the database from the URI (R33).
  // Constructing a client opens no socket, so this stays hermetic.
  it('un MongoClient real cumple el contrato estructural y toma la base de la URI', () => {
    const client: MongoClientLike = createMongoClient('mongodb://localhost:27017/memora');

    expect(client.db().databaseName).toBe('memora');
  });
});

describe('pingDatabase', () => {
  it('hace ping sobre la base de datos codificada en la URI y devuelve host y base', async () => {
    const command = vi.fn().mockResolvedValue({ ok: 1 });
    const client = {
      options: { hosts: ['localhost:27017'] },
      db: () => ({ databaseName: 'memora', command }),
    };

    const result = await pingDatabase(client);

    expect(command).toHaveBeenCalledWith({ ping: 1 });
    expect(result).toEqual({ host: 'localhost:27017', database: 'memora' });
  });

  it('no codifica ningún nombre de base de datos: usa el que diga el cliente', async () => {
    const client = {
      options: { hosts: ['db.internal:27018'] },
      db: () => ({
        databaseName: 'otra-base',
        command: vi.fn().mockResolvedValue({ ok: 1 }),
      }),
    };

    await expect(pingDatabase(client)).resolves.toEqual({
      host: 'db.internal:27018',
      database: 'otra-base',
    });
  });
});

describe('dropDatabase', () => {
  it('borra la base de datos codificada en la URI y devuelve su nombre', async () => {
    const drop = vi.fn().mockResolvedValue(true);
    const client = {
      options: { hosts: ['localhost:27017'] },
      db: () => ({
        databaseName: 'memora',
        command: vi.fn(),
        dropDatabase: drop,
      }),
    };

    const result = await dropDatabase(client);

    expect(drop).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ database: 'memora' });
  });
});
