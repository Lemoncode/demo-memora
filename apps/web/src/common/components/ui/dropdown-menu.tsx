import * as React from 'react';
import { cn } from 'cn';
import { CheckIcon } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';

/**
 * El `Menu` del control de tema **a partir de** `nav:` (§5, R25) — «Apariencia» con
 * tres ítems marcables (`Profile-D`).
 *
 * Se entregan sólo las siete piezas que ese diseño necesita, de las catorce que
 * genera la CLI: `Root`, `Trigger`, `Content`, `Label`, `Separator`, `RadioGroup` y
 * `RadioItem`. `RadioItem` es lo que da `role="menuitemradio"` + `aria-checked`, que
 * es literalmente lo que pide R28; el resto de la semántica de menú
 * (`aria-haspopup`, `aria-expanded`, teclado con flechas, Escape y foco devuelto al
 * disparador) la trae Radix y no se reimplementa aquí.
 *
 * El `CheckIcon` del indicador se importa directo de `lucide-react`, como lo generó
 * la CLI: es una pieza interna del primitivo, no un icono con nombre de la
 * aplicación. El mapa cerrado de `Icon` (R33) es el vocabulario que usan las
 * pantallas, no una aduana sobre los primitivos.
 */
function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-56 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-card border border-border bg-popover p-1.5 text-popover-foreground shadow-lg',
          // §8 punto 3, la única animación de entrada/salida que el contrato admite,
          // con la duración y la curva del sistema y dentro de `motion-safe:`.
          'motion-safe:duration-[var(--primitive-duration-fast)] motion-safe:ease-[var(--semantic-motion-easing)]',
          'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95',
          'motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn('px-3 py-1.5 text-xs font-semibold text-muted-foreground', className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1.5 h-px bg-border', className)}
      {...props}
    />
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        // 44 px de alto, como el resto de controles del sistema.
        //
        // **Sin `outline-none`**, que es lo que traía el primitivo generado: en
        // Tailwind v4 pone `--tw-outline-style: none` sin condición, y entonces el
        // `focus-visible:outline-2` de abajo resuelve `outline-style: none` y las tres
        // utilidades de foco no pintan nada — código muerto que se lee como
        // cumplimiento. Hay una guarda que impide que vuelva.
        'relative flex min-h-[var(--primitive-dimension-layout-touch-target)] cursor-pointer items-center gap-3 rounded-control px-3 pr-9 text-sm font-medium select-none',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        'motion-safe:transition-[color,background-color] motion-safe:duration-[var(--primitive-duration-fast)] motion-safe:ease-[var(--semantic-motion-easing)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'data-disabled:pointer-events-none data-disabled:opacity-60',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="absolute right-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon aria-hidden="true" className="size-4 text-link" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
};
