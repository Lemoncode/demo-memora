import type { LoginScenario } from './login.model';

/**
 * El escenario que se pinta cuando la URL no pide ninguno (R77: «ausente es el estado
 * por omisión»).
 */
const ESCENARIO_POR_DEFECTO: LoginScenario = 'por-defecto';

/**
 * El vocabulario de `/login` traducido a escenarios (R77).
 *
 * **Un `Map` y no un objeto literal**, por la lección que la review del Grupo 1 dejó
 * dos veces: indexar un objeto consulta `Object.prototype`, así que un `?estado=
 * constructor` devolvería una función en lugar de caer en el estado por omisión. Un
 * `Map` no tiene claves heredadas, de modo que **el conjunto aceptado no puede ser más
 * ancho que la tabla**.
 */
const ESCENARIOS = new Map<string, LoginScenario>([
  ['error', 'error'],
  ['enviando', 'enviando'],
]);

/**
 * La resolución del escenario de `/login`: el `business` del pod (R76).
 *
 * **Acepta `unknown` a propósito.** `parseEstado` ya estrecha el valor en el
 * `validateSearch` de la ruta, así que por el camino normal aquí llega un
 * `EstadoLogin | undefined`. Pero el repositorio es una función pública llamable desde
 * cualquier sitio, y la mitad de R78 que es **del pod** — estado por omisión, **sin
 * lanzar y sin pantalla de error** — se cumple aquí. Un tipo más estrecho dejaría esa
 * promesa apoyada en que nadie se salte la ruta. (La otra mitad, el 307 a la forma
 * canónica, es del router y pasa antes de llegar aquí: D10 y D001.)
 *
 * No valida nada ni castiga la errata: eso es justo lo que D10 decidió, porque el
 * parámetro existe para que alguien que revisa pueda **teclear un estado a mano**.
 */
export const resolveLoginScenario = (estado: unknown): LoginScenario =>
  (typeof estado === 'string' ? ESCENARIOS.get(estado) : undefined) ??
  ESCENARIO_POR_DEFECTO;
