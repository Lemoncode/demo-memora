import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

// Una sola variante, `error`, porque es la única forma de `Alert` que el diseño de
// esta parte usa (§5: «`error` con título y cuerpo» — `Login-M-Error`, `Register-D`,
// `Profile-D`). Cuando una pantalla de la Parte 2 necesite `info` o `success`, añade
// la variante entonces: el DS ya fija su vestido (`border-{accent}-border` sobre
// `bg-{accent}-soft`) y así no se entrega hoy superficie que nadie ha revisado.
const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-card border p-4 text-sm text-foreground has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-5 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        // El borde del `Alert` **no** es el borde de un control, así que aquí
        // `destructive` es correcto: §9 separa «decoración junto a palabras →
        // `destructive`» de «frontera de un control → `destructive-border`».
        error: 'border-destructive bg-card [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'error',
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-sm leading-relaxed text-body-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
