import { createFileRoute } from '@tanstack/react-router';

import { NotFoundPod } from '#/pods/not-found/not-found.pod';

/**
 * El 404, como **ruta splat hija del shell** y no como `defaultNotFoundComponent` del
 * router (D8, R70).
 *
 * Esa es la diferencia que importa: siendo una ruta como las demás se dibuja **dentro
 * del layout** — con la barra inferior por debajo de `nav:` y el raíl por encima — y la
 * URL que no emparejó **se queda en la barra de direcciones**, que es lo que hace que un
 * enlace hacia la Parte 2 o 3 aterrice en una pantalla diseñada en vez de en un error
 * (§3, D9).
 *
 * **Sin `validateSearch`**: el 404 es la única de las seis rutas cuyo vocabulario
 * `?estado=` está **vacío** (R77), así que no lee ningún estado de la URL. La ruta es
 * delgada (R44): no hay `loader`, porque el pod no tiene dato que resolver (D13).
 */
export const Route = createFileRoute('/_app/$')({
  component: NotFoundPod,
});
