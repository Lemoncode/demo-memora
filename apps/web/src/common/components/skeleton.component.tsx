import type * as React from 'react';
import { cn } from 'cn';

/**
 * El marcador de carga del sistema de diseño.
 *
 * **No lo usa ninguna de las seis pantallas de esta parte, y no se puede inventar en
 * ellas** (R37): ningún artboard de aquí dibuja un esqueleto, así que ninguna de estas
 * rutas tiene estado de carga (R81). Existe porque los artboards de carga de la Parte 2
 * (`Circles-M-Loading`, `Photo-M-Loading`) lo necesitan, y construirlo con el resto de
 * la biblioteca es más barato que abrir la biblioteca otra vez más adelante.
 *
 * **El pulso está admitido por §8 punto 2**, que el checkpoint del paso 3 reescribió
 * como una categoría — «afordancias de carga»: el spinner del `Button` y este pulso,
 * **fuera** del presupuesto de 150/250/350 ms de la interacción, porque señalan
 * trabajo en curso en vez de responder a un gesto. (El pulso de Tailwind es un ciclo
 * de ~2 s con su propia curva, así que no podría cumplir aquel presupuesto: la
 * primera versión de este comentario decía que lo heredaba ya resuelto, y era
 * justo al revés.) Va dentro de `motion-safe:`, como todo lo que se mueve.
 *
 * `aria-hidden` porque es un hueco, no información: lo que anuncia la carga es el
 * `aria-busy` de la región que carga, no este rectángulo.
 */
export const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="skeleton"
    aria-hidden="true"
    className={cn('rounded-control bg-elevated motion-safe:animate-pulse', className)}
    {...props}
  />
);
