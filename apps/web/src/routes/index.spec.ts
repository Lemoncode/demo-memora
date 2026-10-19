// @vitest-environment node

import { isRedirect } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { redirigirALogin } from './index';

/**
 * R61 es una frase de una línea con una trampa de orden detrás, así que se fija con un
 * test en vez de dejarla sólo en la configuración de la ruta: `/login` **no existe**
 * hasta el Grupo 9, y lo que el `redirect` de TanStack lleva dentro no lo comprueba
 * ningún compilador — `href` es una cadena, a diferencia de `to`, que está tipado contra
 * el árbol de rutas generado. Una errata ahí no la ve `typecheck`, la ve esto.
 */
describe('`/` redirige a `/login` (R61, T26)', () => {
  it('lanza una redirección de TanStack cuyo destino es `/login`', () => {
    let lanzado: unknown;

    try {
      redirigirALogin();
    } catch (error) {
      lanzado = error;
    }

    expect(isRedirect(lanzado)).toBe(true);
    expect((lanzado as Response).headers.get('Location')).toBe('/login');
  });

  it('sustituye la entrada del historial en vez de apilarla', () => {
    let lanzado: unknown;

    try {
      redirigirALogin();
    } catch (error) {
      lanzado = error;
    }

    expect((lanzado as { options: { replace?: boolean } }).options.replace).toBe(true);
  });
});
