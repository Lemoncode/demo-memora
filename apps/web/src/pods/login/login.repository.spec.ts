// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

import { loginErrorDemoValues } from '#/common/mock-data/form-demo-values.mock';

import { loginApi } from './api/login.api';
import { loginRepository } from './login.repository';

describe('loginRepository.getScreen · contra el dataset de verdad', () => {
  it('sin estado, devuelve la pantalla por omisión con el formulario vacío', async () => {
    await expect(loginRepository.getScreen(undefined)).resolves.toStrictEqual({
      scenario: 'por-defecto',
      email: { value: '', invalid: false },
      password: { value: '', invalid: false },
    });
  });

  it('con `error`, devuelve los valores de demostración del fixture compartido (R49)', async () => {
    const pantalla = await loginRepository.getScreen('error');

    // Atado al fixture y no a una copia literal: R49 pide que los valores salgan del
    // dataset compartido y no del markup, y esto es lo que lo prueba.
    expect(pantalla.email.value).toBe(loginErrorDemoValues.email);
    expect(pantalla.password.value).toBe(loginErrorDemoValues.password);
    expect(pantalla.email.invalid).toBe(true);
    expect(pantalla.password.invalid).toBe(true);
  });

  it('con `enviando`, devuelve el escenario de envío y el formulario vacío', async () => {
    await expect(loginRepository.getScreen('enviando')).resolves.toStrictEqual({
      scenario: 'enviando',
      email: { value: '', invalid: false },
      password: { value: '', invalid: false },
    });
  });

  it('con un valor fuera del vocabulario, la pantalla por omisión y sin lanzar (R78)', async () => {
    await expect(loginRepository.getScreen('pepe')).resolves.toStrictEqual({
      scenario: 'por-defecto',
      email: { value: '', invalid: false },
      password: { value: '', invalid: false },
    });
  });
});

describe('loginRepository · es el único camino a los datos (R41, R42)', () => {
  it('pasa por el mapper lo que responde el api, sea lo que sea', async () => {
    // `vi.spyOn` en el límite del sistema: se finge el `api/`, nunca el mapper. Si el
    // repositorio devolviera la respuesta del api tal cual, aquí saldría un objeto
    // plano `{ email, password }` en vez de los dos campos del ViewModel.
    vi.spyOn(loginApi, 'getErrorFormValues').mockResolvedValue({
      email: 'otra@cosa',
      password: 'secreta',
    });

    await expect(loginRepository.getScreen('error')).resolves.toStrictEqual({
      scenario: 'error',
      email: { value: 'otra@cosa', invalid: true },
      password: { value: 'secreta', invalid: true },
    });

    vi.restoreAllMocks();
  });

  it('no deja salir el modelo de API: ninguna clave suya cruza el límite', async () => {
    const pantalla = await loginRepository.getScreen('error');

    // El api-model es `{ email, password }` plano. El ViewModel tiene esas dos claves
    // en el primer nivel, pero conteniendo **campos**, no cadenas: eso es el mapeo. Lo
    // que no debe haber es una cadena suelta donde el ViewModel promete un campo.
    expect(typeof pantalla.email).toBe('object');
    expect(typeof pantalla.password).toBe('object');
    expect(Object.keys(pantalla).toSorted()).toStrictEqual([
      'email',
      'password',
      'scenario',
    ]);
    expect(Object.keys(pantalla.email).toSorted()).toStrictEqual(['invalid', 'value']);
  });
});
