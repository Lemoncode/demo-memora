// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { ESTADOS_REGISTER } from '#/common/routing/estado';

import { resolveRegisterScenario } from './register.business';

/**
 * La resolución del escenario de `/register` (R76, R78, R80, R97).
 *
 * El vocabulario de esta ruta tiene **un solo valor**, lo que hace que el caso
 * interesante sea el otro: que **todo lo demás** sea el estado por omisión, que es el
 * que R80 exige sin ningún error.
 */
describe('resolveRegisterScenario · el vocabulario de la ruta (R77)', () => {
  it('resuelve `error` a su escenario', () => {
    expect(resolveRegisterScenario('error')).toBe('error');
  });

  it('cubre el vocabulario entero', () => {
    for (const estado of ESTADOS_REGISTER) {
      expect(resolveRegisterScenario(estado)).not.toBe('por-defecto');
    }
  });
});

describe('resolveRegisterScenario · todo lo demás es el estado por omisión (R78, R80)', () => {
  it('sin estado, es `por-defecto`', () => {
    expect(resolveRegisterScenario(undefined)).toBe('por-defecto');
  });

  it('un valor fuera del vocabulario cae en `por-defecto`, sin lanzar', () => {
    expect(resolveRegisterScenario('pepe')).toBe('por-defecto');
    expect(resolveRegisterScenario('')).toBe('por-defecto');
    // `enviando` es del vocabulario de `/login`: aquí no significa nada (R77 es por
    // ruta), y confundirlo daría a `/register` un estado que no tiene.
    expect(resolveRegisterScenario('enviando')).toBe('por-defecto');
    expect(resolveRegisterScenario('editando')).toBe('por-defecto');
  });

  it('no hay estado de carga, ni por este camino (R81)', () => {
    expect(resolveRegisterScenario('cargando')).toBe('por-defecto');
  });

  it('una clave heredada de `Object.prototype` no se cuela como escenario', () => {
    expect(resolveRegisterScenario('constructor')).toBe('por-defecto');
    expect(resolveRegisterScenario('__proto__')).toBe('por-defecto');
    expect(resolveRegisterScenario('toString')).toBe('por-defecto');
  });

  it('aguanta lo que no es una cadena, sin lanzar', () => {
    expect(resolveRegisterScenario(['error'])).toBe('por-defecto');
    expect(resolveRegisterScenario(42)).toBe('por-defecto');
    expect(resolveRegisterScenario(null)).toBe('por-defecto');
  });
});
