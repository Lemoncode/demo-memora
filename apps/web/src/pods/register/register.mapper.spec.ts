// @vitest-environment node

import { describe, expect, it } from 'vitest';

import type { RegisterErrorFormValuesApiModel } from './api/register.api-model';
import { mapRegisterScreenFromApi } from './register.mapper';

/**
 * El mapeo de `/register` (R43, R69, R80, R97).
 *
 * Aquí el mapper hace el trabajo **más sustancial de los dos pods de este paso**: los
 * dos anchos tienen juegos de campos distintos y, sobre todo, **marcan campos
 * distintos** — móvil uno, escritorio otros dos. Esa asimetría es del diseño (T35) y es
 * lo que se puede romper en silencio igualando los dos lados, que es justo el error que
 * la v1 del contrato de diseño cometió con estas dos pantallas.
 */
const VALORES: RegisterErrorFormValuesApiModel = {
  mobile: {
    name: 'Sofía Martín',
    email: 'sofia.martin@correo.es',
    password: 'recuerdos2026',
    passwordRepeat: 'recuerdos206',
  },
  desktop: {
    name: 'Sofía Martín',
    email: 'sofia@memora.app',
    password: 'recuerdos',
    passwordRepeat: 'recuerdos',
  },
};

const VACÍO = { value: '', invalid: false };

describe('mapRegisterScreenFromApi · el estado por omisión no lleva ningún error (R80)', () => {
  it('los cuatro campos vacíos y válidos, en los dos anchos', () => {
    expect(mapRegisterScreenFromApi(VALORES, 'por-defecto')).toStrictEqual({
      scenario: 'por-defecto',
      mobile: {
        name: VACÍO,
        email: VACÍO,
        password: VACÍO,
        passwordRepeat: VACÍO,
      },
      desktop: {
        name: VACÍO,
        email: VACÍO,
        password: VACÍO,
        passwordRepeat: VACÍO,
      },
    });
  });

  it('en particular, «Repite la contraseña» **no** va marcada por omisión', () => {
    // `Register-M` se dibuja con ese campo inválido, y eso pertenece a `?estado=error`:
    // es la contradicción que R80 existe para cerrar.
    const pantalla = mapRegisterScreenFromApi(VALORES, 'por-defecto');

    expect(pantalla.mobile.passwordRepeat.invalid).toBe(false);
  });
});

describe('mapRegisterScreenFromApi · `error` es más rico en escritorio, a propósito (T35, R82)', () => {
  it('móvil marca **sólo** la repetición de la contraseña, como dibuja `Register-M`', () => {
    const { mobile } = mapRegisterScreenFromApi(VALORES, 'error');

    expect(mobile).toStrictEqual({
      name: { value: 'Sofía Martín', invalid: false },
      email: { value: 'sofia.martin@correo.es', invalid: false },
      password: { value: 'recuerdos2026', invalid: false },
      passwordRepeat: { value: 'recuerdos206', invalid: true },
    });
  });

  it('escritorio marca email y contraseña, y **no** la repetición, como dibuja `Register-D`', () => {
    const { desktop } = mapRegisterScreenFromApi(VALORES, 'error');

    expect(desktop).toStrictEqual({
      name: { value: 'Sofía Martín', invalid: false },
      email: { value: 'sofia@memora.app', invalid: true },
      password: { value: 'recuerdos', invalid: true },
      passwordRepeat: { value: 'recuerdos', invalid: false },
    });
  });

  it('los dos anchos no se igualan: marcan conjuntos distintos', () => {
    // La aserción que cae si alguien «simplifica» el mapper a un solo juego de campos
    // marcados — el error que esta pantalla ya cometió una vez en el contrato.
    const { mobile, desktop } = mapRegisterScreenFromApi(VALORES, 'error');
    const marcados = (campos: typeof mobile) =>
      Object.entries(campos)
        .filter(([, campo]) => campo.invalid)
        .map(([nombre]) => nombre)
        .toSorted();

    expect(marcados(mobile)).toStrictEqual(['passwordRepeat']);
    expect(marcados(desktop)).toStrictEqual(['email', 'password']);
  });

  it('el `Alert` de escritorio dice «2 campos» y escritorio marca exactamente 2', () => {
    // La copia de §10 es literal y vive en el componente; lo que esto fija es que el
    // número que esa copia promete coincide con lo que el mapper marca.
    const { desktop } = mapRegisterScreenFromApi(VALORES, 'error');
    const cuántos = Object.values(desktop).filter((campo) => campo.invalid).length;

    expect(cuántos).toBe(2);
  });

  it('toma los valores del api y no una copia propia', () => {
    const otros: RegisterErrorFormValuesApiModel = {
      mobile: { name: 'A', email: 'b@c', password: 'd', passwordRepeat: 'e' },
      desktop: { name: 'F', email: 'g@h', password: 'i', passwordRepeat: 'j' },
    };
    const pantalla = mapRegisterScreenFromApi(otros, 'error');

    expect(pantalla.mobile.passwordRepeat.value).toBe('e');
    expect(pantalla.desktop.email.value).toBe('g@h');
    expect(pantalla.mobile.name.value).toBe('A');
  });
});
