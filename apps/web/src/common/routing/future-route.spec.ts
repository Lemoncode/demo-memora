import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { futureRouteNavigation, submitToFutureRoute } from './future-route';

/**
 * El `onSubmit` de los formularios de `/login` y `/register`: **`Intro` desde cualquier
 * campo navega**, que es lo que la línea de §10 promete literalmente en `Login-D`.
 *
 * **Esto no es un test de navegación de los que R99 excluye**: no afirma que pulsar lleve
 * a una pantalla (eso sigue siendo verificación a mano y del lente de diseño). Afirma el
 * contrato de una función de `common/routing`, igual que `index.spec.ts` afirma el destino
 * de la redirección de `/` — y sobre todo afirma la **restricción**: que esto navega sin
 * mirar ni un campo (R67, R68). Es la única guarda que tiene esa promesa.
 *
 * `vi.spyOn` sobre el objeto exportado, que es el límite del sistema, exactamente como
 * `login.repository.spec.ts` finge el `api/`: la navegación de verdad es una carga de
 * documento entera y en jsdom no existe.
 */
const formularioVacío = (campos: number): HTMLFormElement => {
  const form = document.createElement('form');

  for (let i = 0; i < campos; i++) {
    const input = document.createElement('input');
    input.type = i === 0 ? 'email' : 'password';
    input.value = '';
    form.append(input);
  }

  document.body.append(form);

  return form;
};

const enviar = (form: HTMLFormElement): Event => {
  const evento = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(evento);

  return evento;
};

describe('submitToFutureRoute · `Intro` desde cualquier campo (R63, R64, §10)', () => {
  beforeEach(() => {
    vi.spyOn(futureRouteNavigation, 'go').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('impide el envío nativo, así que la URL no gana una interrogación', () => {
    const form = formularioVacío(2);
    form.addEventListener('submit', submitToFutureRoute('/circles'));

    expect(enviar(form).defaultPrevented).toBe(true);
  });

  it('navega a la ruta futura que se le da', () => {
    const form = formularioVacío(2);
    form.addEventListener('submit', submitToFutureRoute('/circles'));
    enviar(form);

    expect(futureRouteNavigation.go).toHaveBeenCalledExactlyOnceWith('/circles');
  });

  it('con los cuatro campos vacíos navega igual: no comprueba ningún valor (R67, R68)', () => {
    const form = formularioVacío(4);
    form.addEventListener('submit', submitToFutureRoute('/circles'));
    enviar(form);

    expect(futureRouteNavigation.go).toHaveBeenCalledExactlyOnceWith('/circles');
  });

  it('no puede mirar un campo ni queriendo: funciona con un evento que no trae formulario', () => {
    // El parámetro es **sólo** `preventDefault`, así que el formulario no está al
    // alcance de esta función ni por accidente. Si alguien lo ampliara para mirar un
    // campo, aquí saltaría un `TypeError` antes que cualquier aserción.
    submitToFutureRoute('/circles')({ preventDefault: () => {} });

    expect(futureRouteNavigation.go).toHaveBeenCalledExactlyOnceWith('/circles');
  });

  it('en envío impide el envío nativo y **no** navega', () => {
    const form = formularioVacío(2);
    form.addEventListener('submit', submitToFutureRoute('/circles', { disabled: true }));

    expect(enviar(form).defaultPrevented).toBe(true);
    expect(futureRouteNavigation.go).not.toHaveBeenCalled();
  });
});
