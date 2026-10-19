// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  ESTADOS_404,
  ESTADOS_INVITE,
  ESTADOS_LOGIN,
  ESTADOS_PROFILE,
  ESTADOS_REGISTER,
  parseEstado,
  validateEstado,
} from './estado';

describe('parseEstado · un valor del vocabulario', () => {
  it('lo devuelve tal cual', () => {
    expect(parseEstado(ESTADOS_LOGIN, 'enviando')).toBe('enviando');
  });
});

/**
 * R78 y D10: un valor fuera del vocabulario se **descarta** y la pantalla que acaba
 * viéndose es la del estado **por omisión**, sin lanzar y sin pantalla de error. Es el
 * caso que el contrato razona explícitamente — el parámetro existe para que alguien
 * teclee un estado a mano, y castigar una errata con una pantalla de error se lo come.
 *
 * Esta función devuelve `undefined` y ahí acaba su trabajo. Lo que pasa **después** con
 * la URL es del router y está medido en D001: al cambiar el valor de la clave, la ruta se
 * vuelve a pedir en su forma canónica (307) y es esa segunda petición la que pinta el
 * estado por omisión. Aquí no se puede ver, y por eso se mide en el camino real.
 */
describe('parseEstado · cualquier otra cosa (R78, D10)', () => {
  it.each([
    ['ausente', undefined],
    ['vacío', ''],
    ['mal escrito', 'enviand'],
    ['de otra ruta', 'editando'],
    ['repetido (array)', ['error', 'enviando']],
    ['numérico', 2],
    ['nulo', null],
    ['un objeto', { error: true }],
    // La lección que la review del Grupo 1 dejó dos veces: indexar un objeto consulta
    // `Object.prototype`. Un vocabulario es un array y `find` no mira la cadena de
    // prototipos, así que estas dos no pueden colarse por construcción — se fijan para
    // que nadie lo reescriba con un objeto indexado.
    ['constructor', 'constructor'],
    ['__proto__', '__proto__'],
  ])('«%s» → el estado por omisión, en silencio', (_nombre, bruto) => {
    expect(() => parseEstado(ESTADOS_LOGIN, bruto)).not.toThrow();
    expect(parseEstado(ESTADOS_LOGIN, bruto)).toBeUndefined();
  });
});

/**
 * R77 al pie de la letra. Es el test que hace que el vocabulario sea un **contrato** y
 * no una costumbre: los Grupos 9 a 12 lo consumen, y si alguno añadiese un valor a su
 * ruta sin pasar por aquí, esto se pone rojo. Lo que se fija es el conjunto **y** su
 * tamaño, así que ni sobra ni falta.
 */
describe('Los vocabularios por ruta son exactamente los de R77', () => {
  it.each([
    ['/login', ESTADOS_LOGIN, ['error', 'enviando']],
    ['/register', ESTADOS_REGISTER, ['error']],
    ['/invite/$token', ESTADOS_INVITE, ['caducada', 'invalida', 'ya-miembro']],
    ['/profile', ESTADOS_PROFILE, ['editando', 'error']],
    ['el 404', ESTADOS_404, []],
  ])('%s', (_ruta, vocabulario, esperado) => {
    expect([...vocabulario]).toStrictEqual(esperado);
  });

  // R81: ninguna ruta de esta parte tiene estado de carga, así que no hay forma de
  // pedir uno desde la URL. `Skeleton` existe para la Parte 2 y no se inventa aquí.
  it('ninguno admite un estado de carga (R81)', () => {
    const todos = [
      ...ESTADOS_LOGIN,
      ...ESTADOS_REGISTER,
      ...ESTADOS_INVITE,
      ...ESTADOS_PROFILE,
      ...ESTADOS_404,
    ];

    expect(todos.filter((estado) => /carga|cargando|loading/.test(estado))).toStrictEqual(
      [],
    );
  });

  // El 404 no admite nada: su vocabulario está vacío a propósito, y por eso su ruta
  // splat no lleva `validateSearch`.
  it('el 404 no acepta ningún valor', () => {
    for (const intento of ['error', 'enviando', 'editando', 'caducada']) {
      expect(parseEstado(ESTADOS_404, intento)).toBeUndefined();
    }
  });
});

/**
 * `validateEstado` es lo que cada una de las cuatro rutas de los Grupos 9 a 12 pone en
 * su `validateSearch`. Se fija aquí para que la forma de la *search* — la clave `estado`
 * y nada más — se decida una vez.
 */
describe('validateEstado · el `validateSearch` de una ruta', () => {
  it('normaliza la search a `{ estado }`', () => {
    expect(validateEstado(ESTADOS_PROFILE)({ estado: 'editando' })).toStrictEqual({
      estado: 'editando',
    });
  });

  it('deja `estado` sin definir cuando el valor no es del vocabulario, sin lanzar', () => {
    const validar = validateEstado(ESTADOS_PROFILE);

    expect(() => validar({ estado: 'enviando' })).not.toThrow();
    expect(validar({ estado: 'enviando' })).toStrictEqual({ estado: undefined });
    expect(validar({})).toStrictEqual({ estado: undefined });
  });

  // No es asunto de este contrato lo que no sea `estado`: ni lo valida ni lo arrastra.
  it('ignora el resto de la search', () => {
    expect(
      validateEstado(ESTADOS_LOGIN)({ estado: 'error', redirect: '/circles' }),
    ).toStrictEqual({ estado: 'error' });
  });
});
