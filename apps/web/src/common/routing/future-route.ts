/**
 * Navegar a una ruta de **otra parte** desde algo que no es un enlace (R71, D9).
 *
 * `FutureLink` (`common/components/future-link.component.tsx`) cubre el caso normal: un
 * `<a href>` de verdad hacia una ruta que el árbol generado todavía no tipa. Pero
 * `/login` promete literalmente en su copia «`Intro` para entrar desde cualquier campo»
 * (§10, R93), y eso no lo puede dar un enlace: lo da el `submit` del formulario. Este
 * módulo es ese segundo camino, y comparte prefijo de nombre con `future-link` a
 * propósito: las Partes 2 y 3 convierten los dos a la vez cuando `/circles` aterrice, y
 * `grep future-` los encuentra.
 *
 * **Lo que este fichero no hace, y es su razón de ser.** No valida (R68), no comprueba
 * sesión (R67) y **no puede ni mirar un campo**: el tipo del evento que recibe es
 * `preventDefault` y nada más. Un formulario vacío más `Intro` navega exactamente igual
 * que un formulario vacío más una pulsación en «Entrar» (R63, R64).
 */

/**
 * El límite del sistema, en un objeto para que un test pueda fingirlo — la misma forma
 * que los `api/` de los pods, que son el seam que un backend sustituye (D13).
 *
 * `location.assign` y no el router: `/circles` es de la Parte 2 y no existe en el árbol
 * de rutas, así que esto es una **carga de documento entera**, idéntica a la que hace
 * hoy el `<a href>` de `FutureLink`. Cuando la ruta exista, aquí habrá un `navigate` del
 * router y la carga de página desaparecerá de los dos sitios.
 */
export const futureRouteNavigation = {
  go: (href: string): void => {
    window.location.assign(href);
  },
};

/**
 * Lo único que este manejador puede hacer con el evento.
 *
 * **El tipo es la restricción.** Un `FormEvent` completo traería el formulario —y con él
 * cada valor escrito— al alcance de la mano; con esto, mirar un campo no es que esté
 * prohibido por una convención: no compila sin ampliar esta firma a la vista de
 * cualquiera que lo lea. R67 y R68 son la promesa más fácil de romper de esta parte y la
 * más difícil de ver rota, así que se sostiene en el tipo y en un test, no en la buena
 * memoria de quien toque el formulario después.
 */
type EventoQueSóloSePuedeImpedir = { preventDefault: () => void };

/**
 * El `onSubmit` de un formulario cuyo CTA lleva a una ruta futura.
 *
 * ```tsx
 * <form onSubmit={submitToFutureRoute('/circles', { disabled: enviando })}>
 * ```
 *
 * **Siempre impide el envío nativo.** El formulario no tiene `action`, así que un envío
 * de verdad recargaría la propia URL **con una interrogación pegada** — ensuciar la barra
 * de direcciones fue exactamente lo que se descartó al costar esta línea de copia.
 *
 * **`disabled` es el estado de envío, no un campo.** Mientras `/login` está en
 * `?estado=enviando` los controles están deshabilitados y el formulario lleva
 * `aria-busy` (R83): ahí `Intro` **no navega**, y es una decisión y no un accidente —
 * aunque de hecho tampoco podría llegar aquí, porque un campo deshabilitado no se
 * enfoca. Se impide el envío igual, que es lo que mantiene la promesa de la URL limpia
 * incluso si algún día ese formulario gana un control habilitado.
 */
export const submitToFutureRoute =
  (href: string, { disabled = false }: { disabled?: boolean } = {}) =>
  (event: EventoQueSóloSePuedeImpedir): void => {
    event.preventDefault();

    if (disabled) return;

    futureRouteNavigation.go(href);
  };
