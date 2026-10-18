/** GB **decimales** (10⁹). Es lo que hace que un plan de 5 000 000 000 bytes se lea
 * «5 GB», como lo escriben `Profile-M` y `Profile-D`; en GiB binarios ese mismo plan
 * serían «4,7 GB» y el artboard diría otra cosa. */
const BYTES_PER_GB = 1_000_000_000;

/** Un decimal como máximo, que es toda la precisión que el diseño muestra («3,1 GB»), y
 * coma decimal española. `maximumFractionDigits` sin `minimumFractionDigits` es lo que
 * además quita el «,0» de una cifra entera: «5 GB», no «5,0 GB». */
const gigabyteFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

const toGigabytes = (bytes: number): string =>
  gigabyteFormatter.format(bytes / BYTES_PER_GB);

/**
 * «3,1 GB de 5 GB usados · plan Gratis» y el valor entero que toma el `Progress` del
 * panel «Almacenamiento» (R43): con las cifras del dataset, 62 — el mismo que los
 * artboards le dan a su barra.
 *
 * `plan` llega **ya en español**: el código del backend (`plan_code: 'free'`) lo traduce
 * el mapper de su pod, no este formateador, que no conoce el vocabulario de planes.
 *
 * Dos omisiones deliberadas, para que no se lean como descuidos:
 *
 * - **Solo GB.** El diseño no dibuja ninguna cifra en KB, MB ni TB, así que no hay
 *   escalera de unidades. Cuando aparezca una, será una decisión con su propio test.
 * - **Sin guarda para `limitBytes === 0`** ni tope en el 100 %. El único origen de estas
 *   cifras en esta parte es `storageMock`, donde el límite es una constante distinta de
 *   cero, así que un valor por defecto aquí sería código no alcanzable y, peor, un número
 *   elegido a dedo que nadie podría justificar más tarde.
 */
export const formatStorageUsage = (
  usedBytes: number,
  limitBytes: number,
  plan: string,
): { label: string; percent: number } => ({
  label: `${toGigabytes(usedBytes)} GB de ${toGigabytes(limitBytes)} GB usados · plan ${plan}`,
  percent: Math.round((usedBytes / limitBytes) * 100),
});
