import * as React from 'react';
import { cn } from 'cn';

function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // La geometría y el color del campo salen de sus tokens de componente:
        // `field.height` (3rem, los 48 px que dibujan los artboards con `h-12`),
        // `field.radius`, `field.background` y `field.border`. Un artboard que pida
        // 44 px pasa su propio `h-…` por `className` y `cn` resuelve el conflicto.
        'h-[var(--component-field-height)] w-full min-w-0 rounded-control border border-input bg-card px-3 text-base text-foreground shadow-xs md:text-sm',
        'placeholder:text-muted-foreground',
        // §8 punto 1 y R104: se nombran **sólo** las propiedades que cambian al
        // enfocar, nunca `all`; 150 ms y la única curva del sistema, y todo dentro de
        // `motion-safe:` (R94).
        'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-[var(--primitive-duration-fast)] motion-safe:ease-[var(--semantic-motion-easing)]',
        // R38: anillo de foco de 2 px con 2 px de separación, igual que el resto de
        // controles del sistema.
        'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-60',
        // El borde de 2 px del campo inválido usa `field.border-invalid`
        // (`signal.danger-strong`) y no `destructive`: el borde de un control es WCAG
        // 1.4.11, sin exención por redundancia, y el valor que el DS da a `destructive` medía 2,77:1.
        // Los artboards dibujan `border-destructive`; ésta es la desviación que §9
        // tomó a conciencia y pide no reportar como infidelidad.
        'aria-invalid:border-2 aria-invalid:border-destructive-border',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
