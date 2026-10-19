import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * `/` redirige a `/login` (R61), y con esto se retira lo último que quedaba de la
 * superficie «Hola Mundo» de la tarea #1 (R74): esta ruta **no tiene componente**.
 *
 * **La trampa de orden que este fichero tuvo, y cómo se ha cerrado.** Cuando el Grupo 8
 * escribió esta ruta, `/login` **no existía** — lo crea el Grupo 9 — y `redirect({ to })`
 * está tipado contra el árbol de rutas generado, así que la forma honesta no compilaba y
 * `typecheck` es un gate declarado. Se usó `href`, que es una opción de primera clase de
 * `RedirectOptions` (`href?: string`) y existe justamente para destinos que el árbol no
 * tipa — ni un cast, ni un `/login` de pega. Ahora la ruta existe, así que **el apaño se
 * ha ido y el destino va en `to`**, que es lo que el compilador vigila.
 *
 * **El cambio costó dos líneas, y la segunda avisó sola — como estaba previsto.**
 * `redirect` pone la cabecera `Location` **sólo si llega `href`**; con `to` la pone
 * después `resolveRedirect`. Así que al cambiar esta línea, la aserción
 * `headers.get('Location')` de `index.spec.ts` se puso en **rojo**. Eso es el test
 * haciendo su trabajo: salta exactamente cuando el contrato cambia, en vez de dejar pasar
 * el cambio en silencio. La aserción se ha reescrito contra `options.to`, que es lo que
 * `to` sí fija.
 *
 * **Y la factura que `href` traía queda pagada, no sólo anotada.** Con `href`,
 * `resolveRedirect` tomaba el valor tal cual y nunca llamaba a `buildLocation`, así que
 * la cabecera `Location` **no llevaba el prefijo del `basepath`** en el camino de
 * servidor; era latente (`router.tsx` no declara `basepath`) pero real. Con `to` el
 * destino pasa por `buildLocation(...).publicHref`, de modo que el día que alguien
 * añada un `basepath` la redirección lo respeta. Por lo mismo desaparece la otra
 * trampa de `href`: un `search` o un `hash` puestos a su lado se sobrescribían con lo
 * que trajera el propio `href`.
 *
 * `replace` para que la redirección no deje una entrada en el historial: sin él,
 * «atrás» desde `/login` vuelve a `/`, que redirige otra vez hacia delante — un botón
 * «atrás» que no puede retroceder.
 *
 * Se exporta como función con nombre, y no en línea, para que haya algo que un test
 * pueda llamar. Con `to` el compilador ya vigila que el destino **sea una ruta**, pero no
 * vigila **cuál**: `/register` y `/$` también compilarían, y `replace` no lo comprueba
 * nadie. Eso es lo que el test sigue fijando.
 */
export const redirigirALogin = (): never => {
  throw redirect({ to: '/login', replace: true });
};

export const Route = createFileRoute('/')({
  beforeLoad: redirigirALogin,
});
