/**
 * El ViewModel del pod `app-shell`: lo **único** que el repositorio deja salir (R41).
 *
 * Diseñado para lo que el raíl y la barra necesitan dibujar, no para la forma de la
 * respuesta: `camelCase`, sin `email` (el raíl no lo dibuja) y con las `initials` ya
 * derivadas, porque el *fallback* del `Avatar` las pide hechas — su propio comentario
 * dice que no las calcula él, para que no haya dos sitios que hagan lo mismo.
 */
export interface ShellIdentity {
  /** «Sofía Martín», tal cual se dibuja en la fila de identidad del raíl. */
  readonly name: string;
  /** «SM»: derivadas del nombre por el mapper (R43), no por el componente. */
  readonly initials: string;
  readonly avatarUrl: string;
}

export interface ShellCircle {
  readonly name: string;
  readonly coverUrl: string;
}

/**
 * `circles` **vacío es una respuesta legítima**, y es la que gobierna R57: el raíl
 * omite entonces la sección «Círculos» entera, que es la forma que dibuja `NotFound-D`.
 * No es un caso de error ni un estado vacío que haya que anunciar.
 */
export interface Navigation {
  readonly identity: ShellIdentity;
  readonly circles: readonly ShellCircle[];
}
