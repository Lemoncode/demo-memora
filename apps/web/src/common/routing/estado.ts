/**
 * El contrato `?estado=` (R76–R79, D10): el parámetro con el que **cada estado diseñado
 * de esta parte se abre desde la URL**.
 *
 * Existe porque el mock nunca falla por su cuenta, así que un estado de error o de envío
 * no se puede provocar: se pide. Y existe para que **alguien que revisa pueda teclear un
 * estado a mano**, que es la razón por la que un valor que no está en el vocabulario
 * **no castiga** (D10).
 *
 * **El vocabulario es por ruta** (R77) y nombra un **estado, nunca un breakpoint**
 * (R79): el mismo valor se abre a cualquier anchura y cada anchura usa su artboard como
 * referencia. Y **ninguna ruta de esta parte tiene estado de carga** (R81) — no hay
 * `cargando` en ningún vocabulario, y `Skeleton` existe para la Parte 2.
 *
 * Esto es lo único de T28 que el paso 5 puede entregar entero: las cuatro rutas que lo
 * consumen las crean los Grupos 9 a 12, y lo hacen con una línea cada una
 * (`validateSearch: validateEstado(ESTADOS_…)`). Fijar aquí la forma y el vocabulario es
 * lo que evita que cada grupo invente el suyo.
 */

/**
 * El valor de `?estado=`, o `undefined` para **cualquier otra cosa**: ausente, vacío,
 * mal escrito, repetido (TanStack entrega entonces un array) o de otro tipo. Sin lanzar
 * y sin redirigir (R78): el repositorio de la ruta resuelve su estado por omisión.
 *
 * `find` y no `includes` a propósito: devuelve ya el tipo estrecho del vocabulario, así
 * que no hace falta ninguna aserción de tipo para estrecharlo — y comparar contra
 * `unknown` es seguro, que es lo que hace que un array o un número caigan solos.
 */
export const parseEstado = <T extends string>(
  vocabulario: readonly T[],
  bruto: unknown,
): T | undefined => vocabulario.find((valor) => valor === bruto);

/** `/login` — `Login-M-Error` y el envío de `Login-D`. */
export const ESTADOS_LOGIN = ['error', 'enviando'] as const;

/** `/register` — sólo `error`: el estado por omisión va con los campos **vacíos**. */
export const ESTADOS_REGISTER = ['error'] as const;

/** `/invite/$token` — las tres tarjetas de `Invite-States`. */
export const ESTADOS_INVITE = ['caducada', 'invalida', 'ya-miembro'] as const;

/** `/profile` — `Profile-D` editando, y editando con error. */
export const ESTADOS_PROFILE = ['editando', 'error'] as const;

/**
 * El 404 — **ninguno** (R77). Se declara vacío en vez de no declararse para que el
 * contrato esté completo y la ausencia sea una decisión escrita: la ruta splat no lleva
 * `validateSearch`, y cualquier `?estado=` que alguien le teclee no significa nada.
 */
export const ESTADOS_404 = [] as const;

export type EstadoLogin = (typeof ESTADOS_LOGIN)[number];
export type EstadoRegister = (typeof ESTADOS_REGISTER)[number];
export type EstadoInvite = (typeof ESTADOS_INVITE)[number];
export type EstadoProfile = (typeof ESTADOS_PROFILE)[number];

/**
 * El `validateSearch` de una ruta, a partir de su vocabulario.
 *
 * Es el único sitio donde se decide la forma de la *search* de estas pantallas, para que
 * las cuatro rutas de los Grupos 9 a 12 no la escriban cuatro veces:
 *
 * ```ts
 * export const Route = createFileRoute('/login')({
 *   validateSearch: validateEstado(ESTADOS_LOGIN),
 *   …
 * });
 * ```
 *
 * No valida nada más: no lanza, no redirige y no toca el resto de la *search* — lo que
 * no es `estado` simplemente no es asunto de este contrato.
 */
export const validateEstado =
  <T extends string>(vocabulario: readonly T[]) =>
  (search: Record<string, unknown>): { estado: T | undefined } => ({
    estado: parseEstado(vocabulario, search.estado),
  });
