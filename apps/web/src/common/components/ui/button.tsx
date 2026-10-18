import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';

// Las cinco variantes y los cuatro tamaños que §5 enumera, con los valores del
// sistema de diseño. No se entregan `destructive` ni `outline` (que traía el
// primitivo generado): ningún artboard de esta parte los usa, y una variante que
// nadie usa es superficie que nadie ha revisado.
//
// **Alturas y el suelo de 44 px.** `default` e `icon` miden el token de objetivo
// táctil (2,75rem = 44 px), no los 40 px del DS, porque R89 fija 44 px como mínimo a
// cualquier anchura — y los 44 px son además lo que `Register-M` dibuja para su único
// control sólo-icono. `lg` son los 48 px del DS, que es el tamaño de todos los CTA
// principales de los artboards. `sm` se queda en los 32 px del DS porque es lo que
// dibuja `Profile-D` («Cambiar foto», «Quitar») y **extiende su área de pulsación**
// hasta 44 px con un pseudoelemento, que es exactamente lo que manda la regla de app
// del DS: «los objetivos táctiles miden 44 px o más (los chips y los interruptores
// extienden su área de pulsación)». El pseudoelemento sólo crece en vertical
// (`inset-x-0`), así que dos botones `sm` en fila no se solapan.
const HIT_AREA_EXTENDER =
  "relative after:absolute after:inset-x-0 after:top-1/2 after:h-[var(--primitive-dimension-layout-touch-target)] after:-translate-y-1/2 after:content-['']";

const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap select-none',
    // §8 punto 1 y R104: la transición nombra **sólo** las tres propiedades que
    // cambian al pasar por encima y al enfocar, nunca el atajo que las abarca todas
    // — que es lo que traía el primitivo generado y lo que esta tarea acota. Acotar
    // no arregla por sí solo el cambio de tema (lo que interpola al cambiar
    // `data-theme` son justo los colores): eso lo hace la supresión de R103, en el
    // proveedor de tema y en el `@layer base` de `styles.css`. Las dos mitades, no
    // una u otra.
    'motion-safe:transition-[color,background-color,box-shadow] motion-safe:duration-[var(--primitive-duration-fast)] motion-safe:ease-[var(--semantic-motion-easing)]',
    // R38 / §9: anillo de foco de 2 px con 2 px de separación, en `ring`
    // (`brand-500`), igual en todos los controles del sistema. Sustituye al
    // `ring-[3px]` que traía el primitivo generado.
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        // `shadow-brand` del DS no tiene familia en el fichero de tokens (issue #13),
        // así que se compone con las utilidades de Tailwind y el color del token:
        // `shadow-primary/25` tiñe la sombra con `--color-primary` y no lleva ningún
        // literal, así que cuando #13 defina la familia desde el fichero esto hereda
        // el cambio sin tocarse.
        //
        // Los `hover:` apuntan a la escala `brand` primitiva porque el fichero de
        // tokens no tiene familia semántica de hover: `primary/90` aclararía el botón
        // en vez de oscurecerlo, que es lo contrario de lo que pide el DS.
        default:
          'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-[var(--primitive-color-brand-700)]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[var(--primitive-color-line-strong)]',
        soft: 'bg-pill text-pill-foreground hover:bg-[var(--primitive-color-brand-200)]',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'text-link underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[var(--primitive-dimension-layout-touch-target)] px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        sm: 'h-8 gap-1.5 px-3 text-xs',
        icon: 'size-[var(--primitive-dimension-layout-touch-target)] rounded-pill',
      },
    },
    // **Las dos reglas de geometría viven aquí y no en sus variantes, y la razón es
    // `cn`.** `cva` emite base → variante → tamaño → compuestas, y `cn` es clsx **más
    // tailwind-merge**: de dos clases en conflicto se queda con la última. Con
    // `h-auto px-0` dentro de la variante `link`, el `h-…`/`px-…` del tamaño venía
    // después y lo barría, así que `link` acababa midiendo lo mismo que `default` —
    // un bloque de 44 px con padding donde el diseño pone texto dentro de una frase.
    // Desde `compoundVariants` sale el último y gana.
    compoundVariants: [
      {
        // `link` es texto en línea: ignora la geometría del tamaño. (`size: 'icon'`
        // no es una combinación que el diseño use; ahí manda el `size-…` del tamaño.)
        variant: 'link',
        class: 'h-auto px-0',
      },
      {
        // El extensor sólo tiene sentido en los botones que son un bloque. En `link`
        // metería 44 px invisibles por encima y por debajo de un enlace en línea, y se
        // comería los clics del texto que lo rodea.
        variant: ['default', 'secondary', 'soft', 'ghost'],
        size: 'sm',
        class: HIT_AREA_EXTENDER,
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ variant, size }),
        // Sólo la opacidad: un `cursor-*` no se ve nunca en un control con
        // `disabled:pointer-events-none`, que es el que gana el hit test.
        loading && 'disabled:opacity-85',
        className,
      )}
      // §6: el estado de envío anuncia por `aria-busy` y deshabilita sus controles;
      // la etiqueta la cambia la pantalla («Entrando…»), no el componente.
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : disabled || loading}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? (
            // §8 punto 2, la única animación continua que el contrato admite, y
            // dentro de `motion-safe:`. El glifo se importa directo de
            // `lucide-react`: es una pieza interna del primitivo, no un icono con
            // nombre de la aplicación (el mapa cerrado de `Icon` es para las
            // pantallas).
            <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />
          ) : null}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
