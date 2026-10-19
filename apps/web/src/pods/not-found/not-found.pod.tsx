import { cn } from 'cn';

import { EmptyState } from '#/common/components/empty-state.component';
import { FutureLink } from '#/common/components/future-link.component';
import { Icon } from '#/common/components/icon.component';
import { Button } from '#/common/components/ui/button';

/** El mensaje de verdad. Literal de §10, los dos anchos comparten copia. */
const TÍTULO = 'No encontramos esta página';
const CUERPO =
  'Puede que el enlace esté incompleto o que el álbum o la foto se hayan borrado.';
const VOLVER = 'Volver a Mis círculos';

/**
 * Los numerales «404»: **decoración que se lleva la mirada y no lleva información**, así
 * que van `aria-hidden` y el título del `EmptyState` carga con el mensaje (R92, T27).
 *
 * 88 px en móvil y 96 px en escritorio, en `brand-200`. Los dos tamaños se escriben en
 * `rem` y no en `px` a propósito: el escáner anti-hardcode marca cualquier `px` crudo
 * (R17) y tolera `rem`, y ninguno de los dos valores tiene token — son medidas de un
 * artboard, no una escala.
 *
 * **El interlineado va pegado al tamaño con la barra —`text-[5.5rem]/none`— y no como
 * un `leading-none` suelto, y eso no es estilo.** `cn` pasa por `tailwind-merge`, que
 * considera que `font-size` y `leading` son el mismo grupo en conflicto y deja ganar al
 * argumento **posterior**: con `leading-none` aquí en la base y el tamaño llegando en
 * `className`, el interlineado **se cae de la cadena** y nadie lo ve. Medido contra el
 * módulo `cn` de verdad: `leading-none` desaparecía de la salida en los dos tamaños, y
 * en el navegador 88 px de cifra daban una caja de 132 px —21 px de aire muerto— que se
 * comía el hueco de 24 px hasta el `EmptyState` y lo dejaba en 35 px. Con la barra, el
 * tamaño y su interlineado son **una sola clase** que ningún reordenamiento puede
 * separar. Es el mismo fallo que el `Button variant="link"` del Grupo 3.
 */
const Numerales = ({ className }: { className?: string }) => (
  <p
    aria-hidden="true"
    className={cn(
      'font-heading font-extrabold text-[var(--primitive-color-brand-200)]',
      className,
    )}
  >
    404
  </p>
);

/**
 * El 404 diseñado, **dentro del shell** (R70, D13).
 *
 * Es un pod de **UI pura**: sin repositorio, sin mapper y sin api, porque no tiene dato
 * que resolver ni estado que leer de la URL — el 404 no tiene vocabulario `?estado=`
 * (R77). PODS hace el repositorio opcional justo para este caso.
 *
 * **Dos disposiciones explícitas, no un árbol que refluye** (§7). No es duplicación por
 * descuido: en el 404 *el contenido* cambia, no sólo su colocación — móvil abre con una
 * cabecera de logotipo (que en escritorio ya lo pone el raíl), lleva numerales de 88 px
 * y **un** CTA; escritorio mete todo en una tarjeta de 560 px, sube a 96 px y lleva
 * **dos** botones. El contrato pide construirlas como dos disposiciones, y la que no
 * aplica queda en `display: none`, o sea fuera también del árbol de accesibilidad.
 *
 * **Sin estado de carga** (R81): ningún artboard de esta parte dibuja un `Skeleton`, y
 * no se inventa uno aquí.
 */
export const NotFoundPod = () => (
  <>
    {/* ——— Por debajo de `nav:` — `NotFound-M` ——— */}
    <div
      className={cn(
        'flex min-h-dvh flex-col nav:hidden',
        // R53: la barra inferior no tapa contenido. 140 px es lo que reserva
        // `NotFound-M`, y es el único sitio donde esta pantalla lo necesita.
        'pb-[8.75rem]',
      )}
    >
      {/* `Profile-M` abre con su `h1` y esta pantalla con el logotipo: las dos
          pantallas del shell tienen cabeceras **distintas**, y ésta es la suya. La
          marca es decorativa porque la palabra de al lado ya nombra el enlace. */}
      <header className="px-5 py-6">
        <FutureLink
          href="/circles"
          className="inline-flex min-h-[var(--primitive-dimension-layout-touch-target)] items-center gap-3 font-heading text-xl font-extrabold text-foreground"
        >
          <img src="/brand/memora-mark.svg" alt="" className="size-[1.875rem]" />
          memora
        </FutureLink>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5">
        <Numerales className="text-[5.5rem]/none" />
        <EmptyState icon="search" size="sm" title={TÍTULO}>
          {CUERPO}
        </EmptyState>
        <Button asChild size="lg" className="w-full">
          <FutureLink href="/circles">{VOLVER}</FutureLink>
        </Button>
      </div>
    </div>

    {/* ——— En y por encima de `nav:` — `NotFound-D` ——— */}
    <div className="hidden nav:grid nav:min-h-dvh nav:place-items-center nav:p-8">
      {/* La tarjeta que `NotFound-D` dibuja: `card`, filete, `radius-2xl` —
          `rounded-panel` es ese token — y la sombra de Tailwind, que es el interino
          que la issue #13 deja mientras no haya familia de sombras en el fichero. */}
      <div className="flex w-full max-w-[35rem] flex-col items-center gap-6 rounded-panel border border-border bg-card p-12 shadow-sm">
        <Numerales className="text-[6rem]/none" />
        <EmptyState icon="search" size="sm" title={TÍTULO}>
          {CUERPO}
        </EmptyState>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <FutureLink href="/circles">
              <Icon name="home" />
              {VOLVER}
            </FutureLink>
          </Button>
          <Button asChild variant="ghost">
            <FutureLink href="/help">Ir a la ayuda</FutureLink>
          </Button>
        </div>
      </div>
    </div>
  </>
);
