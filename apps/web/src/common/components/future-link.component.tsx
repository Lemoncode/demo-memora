import type * as React from 'react';
import { cn } from 'cn';

/**
 * Un enlace a una ruta que **todavía no existe** (R71, D9).
 *
 * `<Link to="…">` de TanStack está tipado contra el árbol de rutas generado, así que no
 * compila hasta que la ruta existe — y `typecheck` es un gate declarado. Las
 * alternativas eran castear el `to` (esconder la deuda en una aserción de tipo) o
 * apuntar a la ruta splat con `params`, que funciona pero es oscuro y habría que
 * reescribirlo igual. Así que es un `<a href>` de verdad, detrás de **un solo nombre**:
 * éste es el único objetivo de `grep` que las Partes 2 y 3 convierten en un `Link`
 * tipado cuando la ruta aterrice.
 *
 * `href` es obligatorio y no opcional: el sentido de este componente es que en esta
 * parte no haya ni un ancla muerta (un `href` a la almohadilla) ni un control deshabilitado sin explicar. Hoy todos
 * caen en el 404 diseñado, que es una pantalla, no un error.
 *
 * Lleva el anillo de foco de serie (R38) porque es un elemento interactivo y el suelo
 * de §9 no depende de que cada pantalla se acuerde; los colores de hover los pone la
 * pantalla, y la transición ya está acotada al presupuesto de §8.
 */
export const FutureLink = ({
  href,
  className,
  ...props
}: Omit<React.ComponentProps<'a'>, 'href'> & { href: string }) => (
  <a
    data-slot="future-link"
    href={href}
    className={cn(
      'motion-safe:transition-[color,background-color] motion-safe:duration-[var(--primitive-duration-fast)] motion-safe:ease-[var(--semantic-motion-easing)]',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      className,
    )}
    {...props}
  />
);
