// @vitest-environment node

import { isRedirect } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { redirigirALogin } from './index';

const lanzar = (): unknown => {
  try {
    redirigirALogin();
  } catch (error) {
    return error;
  }

  // Si no lanza, R61 no se cumple y el test tiene que decirlo en vez de pasar con un
  // `undefined` que casualmente no choque con ninguna aserción.
  return undefined;
};

/**
 * R61 es una frase de una línea, y lo que este test fija cambió al crearse `/login`.
 *
 * **Antes** (Grupo 8) el destino viajaba en `href`, una **cadena** que ningún compilador
 * miraba, y esta era la única guarda contra una errata. **Ahora** (Grupo 9) va en `to`,
 * tipado contra el árbol de rutas generado, así que la errata la caza `typecheck`. Lo que
 * el compilador **no** caza, y es lo que queda aquí: que el destino sea `/login` y no
 * `/register` ni `/$` — las tres compilan igual —, y que la redirección **sustituya** la
 * entrada del historial en lugar de apilarla.
 *
 * El cambio de `href` a `to` puso esta aserción en rojo, que era lo previsto: `redirect`
 * pone la cabecera `Location` sólo cuando llega `href`; con `to` la pone después
 * `resolveRedirect`, dentro del router. Por eso ahora se afirma sobre `options.to`, que
 * es lo que `to` sí fija aquí, y la cabecera se comprueba donde existe de verdad: en el
 * camino real, donde `GET /` responde 307 con `Location: /login`.
 */
describe('`/` redirige a `/login` (R61, T26)', () => {
  it('lanza una redirección de TanStack', () => {
    expect(isRedirect(lanzar())).toBe(true);
  });

  it('su destino es `/login`, y no cualquier otra ruta que también compilaría', () => {
    expect((lanzar() as { options: { to?: string } }).options.to).toBe('/login');
  });

  it('sustituye la entrada del historial en vez de apilarla', () => {
    expect((lanzar() as { options: { replace?: boolean } }).options.replace).toBe(true);
  });
});
