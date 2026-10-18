import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';

/**
 * El control de tema **por debajo** de `nav:` (§5, R25): un control segmentado de
 * tres opciones y selección única. Por encima de `nav:` el control es un `Menu`, que
 * es otro componente a propósito.
 *
 * `toggleVariants` vive aquí y no en un `toggle.tsx` propio: la CLI genera ese
 * fichero porque `ToggleGroup` reutiliza las variantes de un `Toggle` suelto, y esta
 * parte no tiene ningún `Toggle` suelto — `design.md` enumera diez ficheros en
 * `ui/` y ninguno es `toggle.tsx`. Con las variantes aquí no se entrega un
 * componente que nadie usa.
 */
const toggleVariants = cva(
  cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold whitespace-nowrap select-none',
    // 44 px de alto por el token de objetivo táctil, que es el suelo que R89 fija
    // para cualquier anchura.
    'h-[var(--primitive-dimension-layout-touch-target)]',
    'text-body-foreground hover:text-foreground',
    // Activo: la pastilla blanca sobre el carril `secondary`, como dibuja
    // `Profile-M`. El estado **no** lo lleva sólo el color: Radix pone
    // `aria-checked`/`data-state` en el ítem.
    'data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm',
    // §8 punto 1 y R104: sólo las propiedades que cambian, 150 ms, la única curva.
    'motion-safe:transition-[color,background-color,box-shadow] motion-safe:duration-[var(--primitive-duration-fast)] motion-safe:ease-[var(--semantic-motion-easing)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-60',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
);

function ToggleGroup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-card border border-border bg-secondary p-1',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleVariants(), 'focus-visible:z-10', className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem, toggleVariants };
