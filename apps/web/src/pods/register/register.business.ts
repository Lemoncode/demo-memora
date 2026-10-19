import type { RegisterScenario } from './register.model';

/** El escenario que se pinta cuando la URL no pide ninguno (R77, R80). */
const ESCENARIO_POR_DEFECTO: RegisterScenario = 'por-defecto';

/**
 * El vocabulario de `/register` traducido a escenarios (R77). Un `Map` y no un objeto
 * literal, por la misma razón que en `login`: un objeto heredaría `constructor` y
 * compañía de `Object.prototype`, y el conjunto aceptado sería más ancho que la tabla.
 */
const ESCENARIOS = new Map<string, RegisterScenario>([['error', 'error']]);

/**
 * La resolución del escenario de `/register`: el `business` del pod (R76).
 *
 * `unknown` por el mismo motivo que en `login`: la mitad de R78 que es del pod — estado
 * por omisión, sin lanzar y sin pantalla de error — se cumple aquí y no en la ruta, y el
 * repositorio es llamable desde cualquier sitio. El 307 a la forma canónica es del
 * router (D10, D001) y pasa antes.
 */
export const resolveRegisterScenario = (estado: unknown): RegisterScenario =>
  (typeof estado === 'string' ? ESCENARIOS.get(estado) : undefined) ??
  ESCENARIO_POR_DEFECTO;
