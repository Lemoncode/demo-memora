import { cn } from 'cn';

import type { NavItem } from './bottom-nav.component';
import { FutureLink } from './future-link.component';
import { Icon } from './icon.component';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

/**
 * Una fila de círculo del raíl: **nombre y portada, y nada más**, que es exactamente lo
 * que el cruce autorizado hacia la Parte 2 declara (R48).
 *
 * `href` lo pone el pod. Hoy los cuatro apuntan a `/circles` y no a `/circles/$id`
 * porque **la fixture no tiene `id` a propósito** — es el campo con el que la Parte 2
 * construiría esa URL, y R48 lo deja fuera del cruce. Inventar un `slug` desde el
 * nombre sería inventar el dato que R48 prohíbe, y castear un destino tipado es lo que
 * D9 descarta. Los cuatro caen por ahora en el 404 diseñado, como todo enlace hacia
 * delante de esta parte (§3).
 */
export interface RailCircleItem {
  readonly name: string;
  readonly coverUrl: string;
  readonly href: string;
}

/**
 * La fila de identidad del raíl, que **es** la entrada al perfil en escritorio (R54).
 * No hay un ítem de navegación con el icono `user`: eso es cosa de la barra inferior.
 */
export interface RailIdentity {
  readonly name: string;
  readonly initials: string;
  readonly avatarUrl: string;
  readonly href: string;
  readonly current: boolean;
}

/** Las clases comunes a toda fila pulsable del raíl: 44 px de alto y foco visible. */
const FILA =
  'flex min-h-[var(--primitive-dimension-layout-touch-target)] items-center gap-3 rounded-control px-3 text-sm';

/** El estado de una fila: píldora activa, o `hover` de escritorio si no lo está. */
const estadoDeFila = (current: boolean) =>
  current
    ? cn(
        'bg-[var(--component-side-nav-item-active-background)]',
        'font-semibold text-[var(--component-side-nav-item-active-foreground)]',
      )
    : 'font-medium text-body-foreground hover:bg-elevated';

/**
 * El raíl lateral del shell, en y por encima del breakpoint `nav:` (R51, R54).
 *
 * Una columna `card` de 264 px con filete a la derecha, en **tres partes apiladas**:
 *
 * 1. el **logotipo** arriba, que enlaza a `/circles`;
 * 2. la navegación propiamente dicha, en **tres secciones**: una sin etiqueta con «Mis
 *    círculos» y «Subidas»; una **etiquetada «Círculos»** con una fila por círculo y su
 *    portada; y otra sin etiqueta con «Ayuda» y «Privacidad»;
 * 3. la **fila de identidad** sobre un filete superior, que **es** la entrada al perfil
 *    en escritorio.
 *
 * **Contra la barra inferior, y a propósito** (R55): aquí la etiqueta es «Mis
 * círculos» y no «Círculos»; «Privacidad» existe **sólo** aquí; «Perfil» es la fila de
 * identidad y no un ítem; y la sección de círculos es *data-driven*. Los dos conjuntos
 * **no se igualan**.
 *
 * **La sección «Círculos» es condicional** (R56, R57) y eso es lo que reconcilia los
 * dos artboards: `Profile-D` la dibuja y `NotFound-D` no. Con la sección condicional
 * los dos son correctos, y `NotFound-D` es simplemente la forma «sin círculos».
 *
 * **El nombre de la sección se da con `aria-labelledby` desde un párrafo y no con un
 * encabezado.** Una etiqueta de sección de un raíl no es un encabezado del documento, y
 * meter un `<h2>` aquí ensuciaría el esquema de la página — que en el 404 empieza en el
 * título del `EmptyState`. La lista queda nombrada para quien use un lector de
 * pantalla, sin inventar estructura que el diseño no tiene.
 */
export const SideNav = ({
  primary,
  circles,
  secondary,
  identity,
}: {
  primary: readonly NavItem[];
  circles: readonly RailCircleItem[];
  secondary: readonly NavItem[];
  identity: RailIdentity;
}) => (
  <nav
    data-slot="side-nav"
    // Mismo nombre accesible que la barra inferior: nunca se pintan las dos a la vez
    // (R51), así que no hay dos `navigation` homónimos en el árbol de accesibilidad.
    aria-label="Navegación principal"
    className={cn(
      'hidden nav:sticky nav:top-0 nav:flex nav:h-dvh nav:w-[16.5rem] nav:shrink-0 nav:flex-col',
      'border-r border-border bg-[var(--component-side-nav-background)]',
    )}
  >
    {/* 1 — El logotipo. Su destino lo fija R54, así que vive aquí y no en un `prop`:
        es parte del raíl, no un ítem configurable. En minúscula, que es como el
        sistema de diseño escribe la marca. La marca es decorativa (`alt` vacío)
        porque la palabra de al lado ya nombra el enlace. */}
    {/* El relleno va en el contenedor y no en el enlace. Medido en Chrome: con el
        `py-6` puesto en el propio enlace, su caja arranca en y=0 y el anillo de foco
        —2 px de separación más 2 px de trazo— se salía 4 px por encima de la ventana.
        Con el relleno fuera, el enlace queda embebido y el anillo cabe entero. */}
    <div className="px-5 py-6">
      <FutureLink
        href="/circles"
        className="flex min-h-[var(--primitive-dimension-layout-touch-target)] items-center gap-3 font-heading text-xl font-extrabold text-foreground"
      >
        <img src="/brand/memora-mark.svg" alt="" className="size-[2.125rem]" />
        memora
      </FutureLink>
    </div>

    {/* 2 — La navegación, en tres secciones. */}
    {/* `overflow-y-auto` para un viewport bajo — el raíl nunca se esconde (R60), sólo
        desplaza su propia columna. Un contenedor con `overflow` **recorta el `outline`
        de foco** de las filas que tocan su borde visible, y R38 pide 2 px de anillo a
        2 px de separación.

        **`scroll-py-1` es lo que lo evita, y el `py-2` no.** El `py-2` es relleno
        *dentro* del contenido desplazable, así que sólo compra aire en los dos
        extremos del recorrido; en medio, el `scrollIntoView` que dispara el foco pega
        la caja del enlace al borde visible y el anillo pierde sus 4 px. Medido a
        1230×560, que es donde el raíl **sí** desplaza (`scrollHeight` 460 >
        `clientHeight` 399): el anillo de «Ayuda» llegaba a 495 contra un borde de
        recorte en 491. `scroll-padding-block` es la propiedad que `scrollIntoView`
        respeta, y por eso el arreglo va ahí. A 1230×900 el raíl no desplaza y esto es
        invisible — así es como se colaba. El `py-2` se queda por el aire de los
        extremos, que sigue siendo suyo. */}
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-2 scroll-py-1">
      <ul className="flex flex-col gap-1">
        {primary.map((item) => (
          <li key={item.href}>
            <FutureLink
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={cn(FILA, estadoDeFila(item.current))}
            >
              <Icon name={item.icon} />
              {item.label}
            </FutureLink>
          </li>
        ))}
      </ul>

      {circles.length === 0 ? null : (
        <div className="flex flex-col gap-1">
          <p
            id="side-nav-circulos"
            className="px-3 pb-1 text-xs font-semibold text-muted-foreground"
          >
            Círculos
          </p>
          <ul aria-labelledby="side-nav-circulos" className="flex flex-col gap-1">
            {circles.map((circulo) => (
              <li key={circulo.name}>
                <FutureLink href={circulo.href} className={cn(FILA, estadoDeFila(false))}>
                  <img
                    src={circulo.coverUrl}
                    alt=""
                    className="size-7 shrink-0 rounded-control object-cover"
                  />
                  <span className="truncate">{circulo.name}</span>
                </FutureLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="flex flex-col gap-1">
        {secondary.map((item) => (
          <li key={item.href}>
            <FutureLink
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={cn(FILA, estadoDeFila(item.current))}
            >
              <Icon name={item.icon} />
              {item.label}
            </FutureLink>
          </li>
        ))}
      </ul>
    </div>

    {/* 3 — La fila de identidad: **es** `/profile` en escritorio, así que es ella la
        que lleva `aria-current="page"` cuando se está en el perfil (R58), porque
        ningún ítem de navegación representa el perfil aquí. */}
    <div className="border-t border-border p-3">
      <FutureLink
        href={identity.href}
        aria-current={identity.current ? 'page' : undefined}
        className={cn(FILA, estadoDeFila(identity.current))}
      >
        <Avatar size="sm">
          <AvatarImage src={identity.avatarUrl} alt="" />
          <AvatarFallback>{identity.initials}</AvatarFallback>
        </Avatar>
        <span className="truncate">{identity.name}</span>
      </FutureLink>
    </div>
  </nav>
);
