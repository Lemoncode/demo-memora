/**
 * La respuesta del backend que alimenta la navegación del shell: el modelo de API del
 * pod `app-shell` (R40).
 *
 * **Nombres y formas del backend, a propósito.** `full_name`, `avatar_url` y
 * `cover_url` en `snake_case`, y un `email` que **ninguna pantalla del raíl dibuja** —
 * un endpoint que devuelve «quién eres» lo trae, y el sitio donde se decide que el
 * front no lo necesita es el mapper, no el consumidor. Nada de esto cruza el límite del
 * repositorio (R41, R42): el ViewModel de `app-shell.model.ts` es lo único que sale.
 *
 * Hoy lo sirve `navigation.api.ts` desde las fixtures compartidas, que están escritas
 * justamente en forma de respuesta de API (R39). El día que haya backend, cambia el
 * `api/` y nada más.
 */
export interface NavigationViewerApiModel {
  readonly full_name: string;
  readonly email: string;
  readonly avatar_url: string;
}

export interface NavigationCircleApiModel {
  readonly name: string;
  readonly cover_url: string;
}

export interface NavigationApiModel {
  readonly viewer: NavigationViewerApiModel;
  readonly circles: readonly NavigationCircleApiModel[];
}
