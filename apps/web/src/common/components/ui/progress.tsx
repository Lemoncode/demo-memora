import * as React from 'react';
import { cn } from 'cn';
import { Progress as ProgressPrimitive } from 'radix-ui';

/**
 * La barra de almacenamiento de `/profile`. `label` es **obligatorio** y no opcional:
 * §5 pide «`Progress` con una etiqueta accesible», y un `aria-label` que se puede
 * omitir se omite. El primitivo de Radix ya pone `role="progressbar"` y
 * `aria-valuemin/max/now`; lo que no puede inventar es el nombre.
 *
 * Un `aria-valuetext` («3,1 GB de 5 GB usados») llega por `...props` cuando la
 * pantalla lo tenga: el formateador que lo produce es T20, de otro grupo.
 */
function Progress({
  className,
  value,
  label,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { label: string }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      aria-label={label}
      value={value}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-pill bg-elevated',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // Sin transición: §8 es una lista cerrada de cinco cosas y el ancho de una
        // barra de progreso no es ninguna de ellas (R94). La transición sin acotar
        // que trae el primitivo generado se cae aquí, igual que en `Button` (R104).
        className="h-full w-full flex-1 rounded-pill bg-primary"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
