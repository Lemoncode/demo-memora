/**
 * Formateadores de fecha en español, compartidos por los mappers de los pods (D12).
 *
 * Viven en `common/` y no en el `business` de cada pod porque los mismos formateadores
 * los necesitan pods distintos y un import entre pods está prohibido (R46): una copia por
 * pod se separaría a la primera.
 */

/**
 * «24 de octubre»: día sin cero a la izquierda, nombre del mes en español y **sin año**,
 * que es como lo escriben los artboards `Invite-M`, `Invite-D` e `Invite-States`.
 *
 * Dos decisiones que el `Intl` de aquí fija:
 *
 * - **Sin `year`**, deliberadamente. Es la forma que el diseño dibuja, y añadirlo cambia
 *   todas las pantallas que lo muestran a la vez.
 * - **Sin `timeZone`**, es decir la zona del navegador. Una fecha se le muestra a una
 *   persona en su propio calendario, así que la del navegador es la correcta; fijar UTC
 *   haría la salida determinista a cambio de mentirle a quien mira desde otro huso.
 *
 * Consecuencia medida de esa segunda decisión: las fechas del dataset están a mediodía
 * UTC, y eso mantiene el día mostrado estable **de UTC−11 a UTC+11**. Más al este no: en
 * `Pacific/Kiritimati` (UTC+14) el «24 de octubre» del diseño se lee «25 de octubre».
 * Es el precio de mostrar la fecha en el calendario de quien mira, y no un descuido.
 */
const longDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
});

export const formatLongDate = (date: Date): string => longDateFormatter.format(date);
