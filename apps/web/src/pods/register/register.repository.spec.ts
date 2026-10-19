// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

import { registerErrorDemoValues } from '#/common/mock-data/form-demo-values.mock';

import { registerApi } from './api/register.api';
import { registerRepository } from './register.repository';

const VACÍO = { value: '', invalid: false };
const FORMULARIO_VACÍO = {
  name: VACÍO,
  email: VACÍO,
  password: VACÍO,
  passwordRepeat: VACÍO,
};

describe('registerRepository.getScreen · contra el dataset de verdad', () => {
  it('sin estado, los cuatro campos vacíos en los dos anchos (R80)', async () => {
    await expect(registerRepository.getScreen(undefined)).resolves.toStrictEqual({
      scenario: 'por-defecto',
      mobile: FORMULARIO_VACÍO,
      desktop: FORMULARIO_VACÍO,
    });
  });

  it('con `error`, los valores de demostración del fixture compartido, por ancho (R49)', async () => {
    const pantalla = await registerRepository.getScreen('error');

    // Atado al fixture: R49 pide que los valores salgan del dataset y no del markup.
    expect(pantalla.mobile.passwordRepeat.value).toBe(
      registerErrorDemoValues.mobile.passwordRepeat,
    );
    expect(pantalla.desktop.email.value).toBe(registerErrorDemoValues.desktop.email);
    // Y los dos juegos son distintos de verdad, que es lo que hace que repartirlos por
    // ancho signifique algo.
    expect(pantalla.mobile.email.value).not.toBe(pantalla.desktop.email.value);
  });

  it('con un valor fuera del vocabulario, la pantalla por omisión y sin lanzar (R78)', async () => {
    await expect(registerRepository.getScreen('enviando')).resolves.toStrictEqual({
      scenario: 'por-defecto',
      mobile: FORMULARIO_VACÍO,
      desktop: FORMULARIO_VACÍO,
    });
  });
});

describe('registerRepository · es el único camino a los datos (R41, R42)', () => {
  it('pasa por el mapper lo que responde el api, sea lo que sea', async () => {
    // `vi.spyOn` en el límite del sistema: se finge el `api/`, nunca el mapper.
    vi.spyOn(registerApi, 'getErrorFormValues').mockResolvedValue({
      mobile: { name: 'A', email: 'b@c', password: 'd', passwordRepeat: 'e' },
      desktop: { name: 'F', email: 'g@h', password: 'i', passwordRepeat: 'j' },
    });

    await expect(registerRepository.getScreen('error')).resolves.toStrictEqual({
      scenario: 'error',
      mobile: {
        name: { value: 'A', invalid: false },
        email: { value: 'b@c', invalid: false },
        password: { value: 'd', invalid: false },
        passwordRepeat: { value: 'e', invalid: true },
      },
      desktop: {
        name: { value: 'F', invalid: false },
        email: { value: 'g@h', invalid: true },
        password: { value: 'i', invalid: true },
        passwordRepeat: { value: 'j', invalid: false },
      },
    });

    vi.restoreAllMocks();
  });

  it('no deja salir el modelo de API: cada campo es un campo, no una cadena', async () => {
    const pantalla = await registerRepository.getScreen('error');

    expect(Object.keys(pantalla).toSorted()).toStrictEqual([
      'desktop',
      'mobile',
      'scenario',
    ]);
    for (const formulario of [pantalla.mobile, pantalla.desktop]) {
      for (const campo of Object.values(formulario)) {
        expect(Object.keys(campo).toSorted()).toStrictEqual(['invalid', 'value']);
      }
    }
  });
});
