import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * `/` redirige a `/login` (R61), y con esto se retira lo último que quedaba de la
 * superficie «Hola Mundo» de la tarea #1 (R74): esta ruta **no tiene componente**.
 *
 * **La trampa de orden, con los ojos abiertos.** `/login` no existe hasta el Grupo 9, y
 * `redirect({ to })` está tipado contra el árbol de rutas generado — que hoy conoce `/`
 * y `/$` y nada más —, así que la forma obvia **no compila**, y `typecheck` es un gate
 * declarado. La salida no es castear el tipo ni inventar un `/login` de pega (una
 * pantalla que este paso no tiene permiso de entregar y que chocaría con el Grupo 9):
 * es **`href`**, que es una opción de primera clase de `RedirectOptions` — `href?: string`
 * — y existe justamente para destinos que el árbol no tipa. No es un hueco por el que
 * colarse: es la puerta.
 *
 * **Medido contra el runtime, no supuesto.** `resolveRedirect` sólo marca
 * `reloadDocument` cuando el `href` trae esquema; `/login` no lo trae, así que en
 * cliente sale una navegación normal del router y en servidor un 307 de verdad con
 * `Location: /login`. Hasta que el Grupo 9 cree la ruta, `/login` empareja la splat y
 * aterriza en el 404 diseñado — que es **coherente**, no un fallo: es el mismo patrón
 * que §3 fija para todo enlace hacia delante de esta parte.
 *
 * **Qué cuesta pasar a `to` cuando el Grupo 9 cree la ruta: dos líneas, y la segunda
 * avisa sola.** `redirect` pone la cabecera `Location` **sólo si llega `href`**, así
 * que al cambiar a `to` la aserción `headers.get('Location')` de `index.spec.ts` se
 * pone en **rojo** — y eso es el comportamiento que se quiere, no un estorbo: el test
 * salta exactamente cuando el contrato cambia, en vez de dejar pasar el cambio en
 * silencio. Entonces se reescribe esa aserción contra `options.to`, que es lo que
 * `to` sí fija.
 *
 * **Y la nota honesta de la decisión: con `href`, el `basepath` se salta en el camino
 * de servidor.** `resolveRedirect` toma `options.href` tal cual y nunca llama a
 * `buildLocation`, así que la cabecera `Location` no lleva el prefijo; en cliente no
 * pasa, porque la rama `href` de `buildLocation` vuelve a pasar por la reescritura del
 * `basepath`. `router.tsx` **no declara `basepath`**, así que esto es **latente, no
 * vivo** — pero es la factura de usar `href`, y queda escrita aquí para que quien
 * añada un `basepath` algún día la encuentre. (Por lo mismo, un `search` o un `hash`
 * puestos al lado de un `href` se sobrescriben con lo que traiga el propio `href`.)
 *
 * `replace` para que la redirección no deje una entrada en el historial: sin él,
 * «atrás» desde `/login` vuelve a `/`, que redirige otra vez hacia delante — un botón
 * «atrás» que no puede retroceder.
 *
 * Se exporta como función con nombre, y no en línea, para que haya algo que un test
 * pueda llamar: el destino va dentro de una **cadena**, que es lo único de esta ruta que
 * ningún compilador vigila.
 */
export const redirigirALogin = (): never => {
  throw redirect({ href: '/login', replace: true });
};

export const Route = createFileRoute('/')({
  beforeLoad: redirigirALogin,
});
