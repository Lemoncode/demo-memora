/**
 * El botón de envío **oculto** que hace que `Intro` desde cualquier campo envíe el
 * formulario — y lo que lo justifica está medido, no supuesto.
 *
 * **Por qué hace falta.** El envío implícito del HTML no llama al `onSubmit` por su
 * cuenta: si el formulario tiene un botón de envío por omisión, `Intro` lo **pulsa**; si
 * no lo tiene, sólo envía cuando hay **exactamente un** campo que bloquea el envío
 * implícito. Los formularios de esta parte tienen dos y cuatro campos, y su CTA es un
 * `<a href>` hacia una ruta de otra parte (R71, D9), o sea **ningún** botón de envío. Sin
 * esto, un `onSubmit` sería código muerto: `Intro` no haría nada y la línea de copia
 * «`Intro` para entrar desde cualquier campo» seguiría siendo mentira.
 *
 * **Medido en Chrome de verdad, con pulsaciones de tecla de verdad**, sobre un formulario
 * de dos campos con un enlace por CTA: sin botón de envío, `Intro` en cualquiera de los
 * dos campos dispara **cero** `submit`; con este botón oculto, dispara **uno** desde cada
 * campo. El recorrido de tabulación es **el mismo con y sin él** — un elemento oculto no
 * es punto de tabulación — y la URL no cambia, porque el manejador impide el envío
 * nativo.
 *
 * **`hidden` y no una clase que lo esconda.** `hidden` lo saca del árbol de accesibilidad
 * y del recorrido de tabulación sin pedirle nada a la hoja de estilos, y **sin** un
 * `aria-hidden` sobre algo enfocable, que es la combinación que ARIA prohíbe. Tampoco
 * ocupa caja: no toca ninguna geometría, ni la del pie pegajoso de `Register-M`.
 *
 * **`disabled` apaga `Intro` de verdad.** Si el botón por omisión está deshabilitado, el
 * envío implícito **no hace nada** (medido: cero `submit`). Es el interruptor del estado
 * de envío de `/login` (R83), donde los campos ya están deshabilitados; el manejador
 * `submitToFutureRoute` lleva además su propia guarda, que es la que sostiene la promesa
 * si algún día ese formulario gana un control habilitado.
 */
export const ImplicitSubmit = ({ disabled = false }: { disabled?: boolean }) => (
  <button data-slot="implicit-submit" type="submit" hidden disabled={disabled} />
);
