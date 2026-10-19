// @vitest-environment node

import { describe, expect, it } from 'vitest';

import type { LoginFormValuesApiModel } from './api/login.api-model';
import { mapLoginScreenFromApi } from './login.mapper';

/**
 * El mapeo de `/login` (R43, R69, R97).
 *
 * Lo que el mapper **hace de verdad** aquí no es renombrar: es decidir **qué campos
 * tiene la pantalla y con qué valores**, que es lo que §4 y §10 dejan dibujado y lo
 * único de esta pantalla que puede romperse en silencio. Y tiene un modo de fallo
 * concreto y grave: que un valor de demostración se escape al estado por omisión, que
 * es exactamente lo que R69 prohíbe («los formularios se entregan vacíos»).
 */
const VALORES_DE_ERROR: LoginFormValuesApiModel = {
  email: 'sofia.martin@correo',
  password: '',
};

describe('mapLoginScreenFromApi · el estado por omisión entrega el formulario vacío (R69)', () => {
  it('ni un valor de demostración, ni un campo marcado', () => {
    expect(mapLoginScreenFromApi(VALORES_DE_ERROR, 'por-defecto')).toStrictEqual({
      scenario: 'por-defecto',
      email: { value: '', invalid: false },
      password: { value: '', invalid: false },
    });
  });

  it('`enviando` tampoco los trae: es el formulario en vuelo, no el erróneo', () => {
    // §6: escritorio se dibuja enviando con los campos rellenos, pero eso son los
    // `default-value` de demostración del artboard, que la decisión del contrato
    // retira de todas las pantallas menos de `?estado=error`.
    expect(mapLoginScreenFromApi(VALORES_DE_ERROR, 'enviando')).toStrictEqual({
      scenario: 'enviando',
      email: { value: '', invalid: false },
      password: { value: '', invalid: false },
    });
  });
});

describe('mapLoginScreenFromApi · `error` es el único que rellena y marca (R82, R91)', () => {
  it('lleva los dos campos del api marcados como inválidos, como dibuja `Login-M-Error`', () => {
    expect(mapLoginScreenFromApi(VALORES_DE_ERROR, 'error')).toStrictEqual({
      scenario: 'error',
      email: { value: 'sofia.martin@correo', invalid: true },
      password: { value: '', invalid: true },
    });
  });

  it('marca la contraseña aunque su valor venga vacío', () => {
    // El artboard dibuja la contraseña **vacía y marcada**, bajo «Escribe tu
    // contraseña.»: derivar `invalid` de «tiene valor» sería validar (R68) y además
    // perdería este campo.
    const pantalla = mapLoginScreenFromApi(VALORES_DE_ERROR, 'error');

    expect(pantalla.password.value).toBe('');
    expect(pantalla.password.invalid).toBe(true);
  });

  it('toma los valores del api y no una copia propia', () => {
    const otros: LoginFormValuesApiModel = { email: 'otro@correo', password: 'x' };

    expect(mapLoginScreenFromApi(otros, 'error')).toStrictEqual({
      scenario: 'error',
      email: { value: 'otro@correo', invalid: true },
      password: { value: 'x', invalid: true },
    });
  });
});
