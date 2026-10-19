// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { ESTADOS_LOGIN } from '#/common/routing/estado';

import { resolveLoginScenario } from './login.business';

/**
 * La resolución del escenario de `/login` (R76, R78, R97).
 *
 * Es la segunda línea de defensa, no la primera: `parseEstado` ya deja en `undefined`
 * cualquier cosa fuera del vocabulario en el `validateSearch` de la ruta. Esto se prueba
 * igual porque **el repositorio es llamable desde cualquier sitio** — un test, un
 * `loader` futuro, la Parte 2 — y la mitad de R78 que es del pod, «el estado por omisión,
 * sin lanzar y sin pantalla de error», se cumple aquí. Que la ruta se vuelva a pedir
 * antes en su forma canónica (307) es cosa del router y no se ve desde aquí (D10, D001).
 */
describe('resolveLoginScenario · el vocabulario de la ruta (R77)', () => {
  it('resuelve cada valor del vocabulario a su escenario', () => {
    expect(resolveLoginScenario('error')).toBe('error');
    expect(resolveLoginScenario('enviando')).toBe('enviando');
  });

  it('cubre el vocabulario entero, sin que se quede ningún valor sin escenario', () => {
    // Atado a `ESTADOS_LOGIN` y no a una lista escrita a mano: si alguien añadiera un
    // valor al vocabulario sin darle escenario, esto se pondría rojo en vez de
    // resolverlo en silencio al estado por omisión.
    for (const estado of ESTADOS_LOGIN) {
      expect(resolveLoginScenario(estado)).not.toBe('por-defecto');
    }
  });
});

describe('resolveLoginScenario · todo lo demás es el estado por omisión (R78, D10)', () => {
  it('sin estado, es `por-defecto`', () => {
    expect(resolveLoginScenario(undefined)).toBe('por-defecto');
  });

  it('un valor fuera del vocabulario cae en `por-defecto`, sin lanzar', () => {
    expect(resolveLoginScenario('pepe')).toBe('por-defecto');
    expect(resolveLoginScenario('')).toBe('por-defecto');
    // `editando` y `caducada` son del vocabulario de **otras** rutas: fuera de este
    // vocabulario no significan nada (R77 es por ruta).
    expect(resolveLoginScenario('editando')).toBe('por-defecto');
    expect(resolveLoginScenario('caducada')).toBe('por-defecto');
  });

  it('no hay estado de carga, ni por este camino (R81)', () => {
    expect(resolveLoginScenario('cargando')).toBe('por-defecto');
  });

  it('una clave heredada de `Object.prototype` no se cuela como escenario', () => {
    // La lección que la review del Grupo 1 dejó dos veces: indexar un objeto literal
    // consulta la cadena de prototipos, así que `constructor` devolvería una función.
    expect(resolveLoginScenario('constructor')).toBe('por-defecto');
    expect(resolveLoginScenario('__proto__')).toBe('por-defecto');
    expect(resolveLoginScenario('toString')).toBe('por-defecto');
  });

  it('aguanta lo que no es una cadena, sin lanzar', () => {
    // `?estado=a&estado=b` llega como array; el resto son formas que un `search`
    // puede tomar.
    expect(resolveLoginScenario(['error'])).toBe('por-defecto');
    expect(resolveLoginScenario(42)).toBe('por-defecto');
    expect(resolveLoginScenario(null)).toBe('por-defecto');
    expect(resolveLoginScenario({ estado: 'error' })).toBe('por-defecto');
  });
});
