import { describe, expect, it } from 'vitest';

import { MONGODB_URI_VAR, resolveMongoUri } from './config';

describe('resolveMongoUri', () => {
  it('devuelve la URI configurada', () => {
    const uri = resolveMongoUri({ MONGODB_URI: 'mongodb://localhost:27017/memora' });

    expect(uri).toBe('mongodb://localhost:27017/memora');
  });

  it('falla explícitamente cuando la variable no está definida, nombrándola y apuntando a .env.example', () => {
    expect(() => resolveMongoUri({})).toThrowError(/MONGODB_URI(.|\n)*\.env\.example/);
  });

  it('trata la cadena vacía como ausente', () => {
    expect(() => resolveMongoUri({ MONGODB_URI: '' })).toThrowError(/MONGODB_URI/);
  });

  it('trata una variable con sólo espacios como ausente', () => {
    expect(() => resolveMongoUri({ MONGODB_URI: '   ' })).toThrowError(/MONGODB_URI/);
  });

  it('recorta los espacios alrededor de la URI', () => {
    const uri = resolveMongoUri({ MONGODB_URI: '  mongodb://localhost:27017/memora  ' });

    expect(uri).toBe('mongodb://localhost:27017/memora');
  });

  // Regression guard for R30 (the resolver must not read global state) and for the
  // "no default fallback" half of R31: it must fail even when the real process
  // environment would have answered.
  it('no lee process.env por su cuenta ni cae a una URI por defecto', () => {
    const previous = process.env[MONGODB_URI_VAR];
    process.env[MONGODB_URI_VAR] = 'mongodb://localhost:27017/desde-process-env';

    try {
      expect(() => resolveMongoUri({})).toThrowError(/MONGODB_URI/);
    } finally {
      if (previous === undefined) delete process.env[MONGODB_URI_VAR];
      else process.env[MONGODB_URI_VAR] = previous;
    }
  });
});
