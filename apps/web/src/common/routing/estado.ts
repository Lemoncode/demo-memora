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
 * mal escrito, repetido (TanStack entrega entonces un array) o de otro tipo. El
 * repositorio de la ruta resuelve su estado por omisión, sin lanzar y sin pantalla de
 * error (R78).
 *
 * **Y con un 307 por medio en tres de los cuatro casos, que es el comportamiento
 * querido** (R78 y D10, enmendados tras medirlo en D001). Devolver `undefined` **cambia
 * el valor** de la clave, así que la *search* canónica deja de coincidir con la de la URL
 * y el router vuelve a pedir la ruta en su forma canónica: `?estado=` vacío, mal escrito
 * o repetido responden **307 a la ruta sin el parámetro**, y es ahí donde se pinta el
 * estado por omisión. **Ausente es otra cosa**: es la ausencia de la clave (R77) y
 * responde 200, igual que una clave ajena (`?foo=bar`), que sobrevive intacta.
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
 * las cuatro rutas de los Grupos 9 a 12 no la escriban cuatro veces. **Dos cosas de la
 * forma de usarlo, las dos medidas cuando el Grupo 9 lo estrenó:**
 *
 * ```ts
 * // El validador va a una `const`, **no** en línea dentro del objeto de opciones.
 * const validarSearch = validateEstado(ESTADOS_LOGIN);
 *
 * export const Route = createFileRoute('/login')({
 *   validateSearch: validarSearch,
 *   loaderDeps: ({ search }) => ({ estado: search.estado }),
 *   loader: ({ deps }) => loginRepository.getScreen(deps.estado),
 * });
 * ```
 *
 * **Por qué la `const`.** Escrito en línea — `validateSearch: validateEstado(ESTADOS_LOGIN)`
 * — TypeScript tiene que inferir a la vez el genérico de esta función y el validador de la
 * ruta, y la inferencia de dentro **pierde**: el esquema de la *search* se queda en `{}` y
 * `search.estado` dentro de `loaderDeps` no compila. Con la llamada fuera, el tipo ya es
 * concreto cuando la ruta se comprueba. (Fijar el genérico a mano también lo arregla, pero
 * duplica el vocabulario en dos sitios, que es justo lo que estas constantes evitan.)
 *
 * **Por qué `estado` es opcional y no `T | undefined`.** La clave **declarada pero
 * opcional** es lo que hace que `<Link to="/login">` y `redirect({ to: '/login' })` no
 * tengan que pasar `search`: con `{ estado: T | undefined }` la clave es obligatoria, así
 * que TanStack exige la *search* en **todo** enlace a la ruta y el `?estado=` se volvería
 * vírico por toda la aplicación. Y además dice la verdad del contrato: «ausente es el
 * estado por omisión» (R77) describe la ausencia de la clave, no una clave con valor
 * `undefined`. El valor que se devuelve en tiempo de ejecución no cambia.
 *
 * No valida nada más: no lanza y no toca el resto de la *search* — lo que no es `estado`
 * simplemente no es asunto de este contrato, y por eso `?foo=bar` llega intacto y
 * responde 200. **Redirigir no lo hace esta función: lo hace el router**, porque
 * devolver `undefined` cambia el valor de la clave; es el 307 a la forma canónica que
 * R78 y D10 recogen desde D001, y no se puede evitar conservando el estrechamiento por
 * ruta — la comparación del router es contra la *search* ya validada.
 */
export const validateEstado =
  <T extends string>(vocabulario: readonly T[]) =>
  (search: Record<string, unknown>): { estado?: T } => ({
    estado: parseEstado(vocabulario, search.estado),
  });
