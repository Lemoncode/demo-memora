import type { ReactNode } from 'react';

import { BottomNav, type NavItem } from '#/common/components/bottom-nav.component';
import { SideNav } from '#/common/components/side-nav.component';
import type { IconName } from '#/common/components/icon.component';

import type { Navigation } from './app-shell.model';

/**
 * La definición de un ítem **sin** su estado: el conjunto y el orden son fijos, y lo
 * único que depende de dónde estemos es `current`.
 */
interface DefiniciónDeÍtem {
  readonly label: string;
  readonly href: string;
  readonly icon: IconName;
}

/**
 * **La barra inferior: cuatro columnas en orden fijo** (R52). Leído del contrato de
 * diseño, no elegido aquí: Círculos (`home`) · Subidas (`upload`) · Ayuda (`help`) ·
 * Perfil (`user`).
 */
const ÍTEMS_DE_LA_BARRA: readonly DefiniciónDeÍtem[] = [
  { label: 'Círculos', href: '/circles', icon: 'home' },
  { label: 'Subidas', href: '/uploads', icon: 'upload' },
  { label: 'Ayuda', href: '/help', icon: 'help' },
  { label: 'Perfil', href: '/profile', icon: 'user' },
];

/**
 * **El raíl: dos conjuntos que difieren del de la barra a propósito** (R55).
 *
 * La primera sección dice «**Mis círculos**» y no «Círculos». La segunda tiene
 * «**Privacidad**», que no existe en la barra. Y **no hay ítem «Perfil»**: en
 * escritorio el perfil es la fila de identidad. Esto **no se iguala** con la barra.
 */
const ÍTEMS_DEL_RAÍL_ARRIBA: readonly DefiniciónDeÍtem[] = [
  { label: 'Mis círculos', href: '/circles', icon: 'home' },
  { label: 'Subidas', href: '/uploads', icon: 'upload' },
];

const ÍTEMS_DEL_RAÍL_ABAJO: readonly DefiniciónDeÍtem[] = [
  { label: 'Ayuda', href: '/help', icon: 'help' },
  { label: 'Privacidad', href: '/privacy', icon: 'lock' },
];

/** El destino del perfil, que en el raíl lleva la fila de identidad (R54, R58). */
const PERFIL = '/profile';

/**
 * Los cuatro círculos del raíl apuntan a `/circles` y no a `/circles/$id`: la fixture
 * **no tiene `id` a propósito** (R48 — «nombre e imagen de portada y nada más»), que es
 * justo el campo con el que la Parte 2 construiría esa URL. Ver `RailCircleItem`.
 */
const CÍRCULOS = '/circles';

/**
 * Quita la barra final, y **deja `/` como está**: es la única ruta en la que la barra
 * no es un sufijo, sino la ruta entera.
 *
 * Una sola barra basta: `fullPath` sale de `cleanPath`, que ya colapsa las repetidas.
 */
const sinBarraFinal = (ruta: string): string =>
  ruta.length > 1 && ruta.endsWith('/') ? ruta.slice(0, -1) : ruta;

/**
 * **Compara una plantilla de ruta con el destino de un enlace, que son dos vocabularios
 * distintos** y sólo coinciden en las rutas hoja. TanStack construye `fullPath` como
 * `cleanPath(padre + '/' + path)`, así que una ruta **índice** arrastra una barra final:
 * `_app/circles/index.tsx` da `/circles/` — y es la forma probable de la Parte 2, porque
 * `/circles/$id` necesita el directorio —, mientras el `href` del ítem es `/circles`.
 *
 * Sin normalizar, `'/circles' === '/circles/'` es `false` y «Mis círculos» **no se
 * marcaría nunca**, en silencio: ningún gate mira eso y nada apuntaría a este fichero.
 * Es la misma razón por la que router-core hace `trimPathRight` sobre su propio
 * `routesByPath`; el desajuste es del vocabulario, no de esta pantalla.
 *
 * Se normalizan **los dos lados** y no sólo la ruta emparejada, para que el día que un
 * `href` se escriba con barra final tampoco importe.
 */
const esLaRutaActual = (href: string, rutaActiva: string | undefined): boolean =>
  rutaActiva !== undefined && sinBarraFinal(href) === sinBarraFinal(rutaActiva);

const conEstado = (
  definiciones: readonly DefiniciónDeÍtem[],
  rutaActiva: string | undefined,
): readonly NavItem[] =>
  definiciones.map((definición) => ({
    ...definición,
    current: esLaRutaActual(definición.href, rutaActiva),
  }));

/**
 * El shell de la aplicación: el pod que envuelve toda ruta firmada (R50).
 *
 * **Aquí está el límite PODS haciendo trabajo de verdad.** El pod es el dueño de los
 * datos — recibe el `Navigation` que el repositorio produjo — y los dos compuestos de
 * `common/` reciben **solo `props` planas** (ítems, círculos, identidad) y no conocen ni
 * el ViewModel ni el router (D3). Así nada fluye hacia atrás de un pod a `common/`, y
 * los compuestos siguen siendo UI compartida.
 *
 * **`rutaActiva` es la ruta emparejada, no la URL.** Es lo que hace honesto el marcado
 * del ítem activo mientras las rutas de las Partes 2 y 3 no existen: hoy `/circles`
 * empareja la ruta splat, cuyo `fullPath` es `/$` y no coincide con ningún `href`, así
 * que **el 404 no marca ningún ítem como página actual** — que es la verdad.
 * Comparar contra `location.pathname` habría marcado «Mis círculos» como página actual
 * mientras se dibuja un 404, que es exactamente lo que `aria-current` no debe decir.
 *
 * Cuando la Parte 2 cree `/circles` de verdad, el mismo cálculo empieza a marcarlo sin
 * tocar nada — y eso es cierto **porque `esLaRutaActual` normaliza la barra final**, no
 * por sí solo: con una comparación cruda, la forma índice (`_app/circles/index.tsx`,
 * la probable) da `fullPath` `/circles/` y no habría marcado nunca. Ver ahí el porqué.
 *
 * **Las dos navegaciones nunca se pintan a la vez** (R51), y la elección es de CSS
 * (`nav:hidden` en una, `hidden nav:flex` en la otra) y no de JavaScript. No es pereza:
 * la aplicación se renderiza en el servidor, donde no hay `window` ni `matchMedia`, así
 * que decidirlo en React daría un desajuste de hidratación o un destello — el mismo
 * problema que `design.md` registra para los controles de tema. Con CSS, `display: none`
 * saca a la otra del árbol de accesibilidad, así que tampoco hay dos `navigation`
 * homónimos para un lector de pantalla.
 */
export const AppShellPod = ({
  navigation,
  activePath,
  children,
}: {
  navigation: Navigation;
  activePath: string | undefined;
  children: ReactNode;
}) => (
  <div className="flex min-h-dvh flex-col nav:flex-row">
    <SideNav
      primary={conEstado(ÍTEMS_DEL_RAÍL_ARRIBA, activePath)}
      circles={navigation.circles.map((circulo) => ({
        name: circulo.name,
        coverUrl: circulo.coverUrl,
        href: CÍRCULOS,
      }))}
      secondary={conEstado(ÍTEMS_DEL_RAÍL_ABAJO, activePath)}
      identity={{
        ...navigation.identity,
        href: PERFIL,
        current: esLaRutaActual(PERFIL, activePath),
      }}
    />

    <main className="min-w-0 flex-1">{children}</main>

    <BottomNav items={conEstado(ÍTEMS_DE_LA_BARRA, activePath)} />
  </div>
);
