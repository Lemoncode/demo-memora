import { cn } from 'cn';

import { FutureLink } from './future-link.component';
import { Icon, type IconName } from './icon.component';

/**
 * Un ítem de navegación del shell: etiqueta visible, destino real e icono del
 * vocabulario cerrado.
 *
 * Vive aquí y lo importa `side-nav.component.tsx` porque las dos navegaciones usan
 * **la misma forma de ítem** — lo que deliberadamente no comparten son los **conjuntos**
 * de ítems (R55). Una copia del tipo en cada fichero sería la manera de que las dos
 * formas se separasen sin que nadie lo decidiera.
 *
 * `current` lo calcula el pod a partir de la ruta **emparejada**, no de la URL: es un
 * dato de entrada del compuesto, que no sabe nada del router (D3).
 */
export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: IconName;
  readonly current: boolean;
}

/**
 * La barra inferior del shell, por debajo del breakpoint `nav:` (R51, R52).
 *
 * **Cuatro columnas iguales en orden fijo** — Círculos · Subidas · Ayuda · Perfil —
 * sobre una barra `card` pegada al borde inferior con un filete arriba. Cada columna es
 * un enlace de verdad con el icono sobre la etiqueta, de 44 px de alto como mínimo
 * **más** el inset de área segura que los artboards reservan.
 *
 * **No es el raíl a otra anchura.** El raíl dice «Mis círculos», tiene «Privacidad» y
 * pone el perfil en su fila de identidad; esta barra dice «Círculos», no tiene
 * «Privacidad» y sí tiene «Perfil» con el icono `user`. Los dos conjuntos difieren a
 * propósito y **no se igualan** (R55): la v1 del contrato de diseño los tenía por una
 * sola lista y eso era el error.
 *
 * **Lo que no hace** (R60): no se esconde al hacer scroll — es `fixed` y no escucha
 * nada — y lo único que anima es el color, que es lo que trae `FutureLink` dentro de
 * `motion-safe:`.
 *
 * **El anillo de foco no se recorta** (R38). Ni la barra ni la lista llevan `overflow`,
 * así que el `outline` a 2 px de separación de cada enlace se pinta entero; el
 * `padding` del área segura le deja además aire por abajo en los dispositivos con
 * muesca. Si alguien añade aquí un `overflow-hidden` para redondear algo, lo que apaga
 * es la accesibilidad del único control de la pantalla.
 */
export const BottomNav = ({ items }: { items: readonly NavItem[] }) => (
  <nav
    data-slot="bottom-nav"
    // El nombre accesible es parte del componente y no un `prop`: las dos navegaciones
    // nunca se pintan a la vez (R51), así que comparten nombre, y teniéndolo dentro
    // R59 se cumple por construcción en vez de depender de que cada pantalla se
    // acuerde.
    aria-label="Navegación principal"
    className={cn(
      'fixed inset-x-0 bottom-0 z-40 nav:hidden',
      'border-t border-[var(--component-bottom-nav-border)]',
      'bg-[var(--component-bottom-nav-background)]',
      // **Un suelo de 4 px en los tres bordes que la ventana puede recortar**, y los
      // 4 px no son estética: son exactamente lo que alcanza el anillo de foco (2 px
      // de separación + 2 px de trazo). No lo recorta ningún `overflow` — eso es lo
      // que R38 nombra y se cumple —, lo recorta **la ventana**, que para quien
      // tabula es lo mismo.
      //
      // Abajo: el inset de área segura que los artboards reservan (34 px en los
      // dispositivos con muesca) vale **0 en un móvil sin muesca**, así que sin el
      // `max()` los cuatro ítems perdían 4 px de anillo por abajo. Medido en Chrome a
      // 390×844.
      //
      // A los lados: el mismo fallo, el mismo estándar, el otro eje — y se escapó la
      // primera vez. La barra es `inset-x-0` y la lista es `grid-cols-4`, así que sin
      // relleno la columna 1 arranca en x=0 y la 4 termina en x=390: medido, el anillo
      // de «Círculos» llegaba a −4 y el de «Perfil» a 394 con `innerWidth` 390. Los
      // 4 px dejan las columnas en ~95,5 px, muy por encima del mínimo de 44.
      'px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)]',
    )}
  >
    <ul className="grid grid-cols-4">
      {items.map((item) => (
        <li key={item.href}>
          <FutureLink
            href={item.href}
            // R58: el ítem activo lo marca el atributo, **no sólo el color**. El peso
            // de la tipografía añade además una pista visual que no es cromática.
            aria-current={item.current ? 'page' : undefined}
            className={cn(
              'flex min-h-[var(--primitive-dimension-layout-touch-target)] flex-col items-center justify-center gap-1 py-2 text-xs',
              item.current
                ? 'font-semibold text-[var(--component-bottom-nav-item-active)]'
                : 'font-medium text-[var(--component-bottom-nav-item-inactive)]',
            )}
          >
            <Icon name={item.icon} />
            {item.label}
          </FutureLink>
        </li>
      ))}
    </ul>
  </nav>
);
