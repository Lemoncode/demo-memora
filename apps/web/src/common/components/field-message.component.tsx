import type { ReactNode } from 'react';
import { cn } from 'cn';

/**
 * El mensaje de error **de campo**: el punto `danger` decorativo más el texto que
 * explica qué pasa (§6, «tres formas de error que no son intercambiables»).
 *
 * **Vive en `common/` y no dentro de un pod** porque la necesitan `/login`,
 * `/register` y `/profile`, y un pod no puede importar de otro (R46). Recibe `props`
 * planas y no conoce ningún ViewModel, igual que los dos compuestos del shell (D3).
 *
 * **El punto es `aria-hidden` y el color no es la señal** (§9): quien lea esto con un
 * lector de pantalla recibe las palabras, que es lo que dice qué ha pasado; el punto
 * sólo las acompaña. Por eso aquí `destructive` es el token correcto y no
 * `destructive-border` — §9 separa «decoración junto a palabras» de «frontera de un
 * control», y esto es lo primero.
 *
 * **`id` es obligatorio y no opcional.** El sentido de este componente es que el campo
 * inválido pueda apuntarlo con `aria-describedby` **además** de llevar `aria-invalid`
 * (R91), y un `id` opcional sería la forma de que la mitad de los sitios se olvidara.
 * `Register-D` dibuja uno de estos mensajes a nivel de **formulario**, bajo una rejilla
 * de dos campos en lugar de bajo uno: es el mismo componente, apuntado por los dos
 * campos.
 */
export const FieldMessage = ({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) => (
  <p
    data-slot="field-message"
    id={id}
    className={cn(
      'flex items-start gap-1.5 text-[0.8125rem] font-medium text-foreground',
      className,
    )}
  >
    <span
      aria-hidden="true"
      className="mt-[0.3125rem] size-2 shrink-0 rounded-pill bg-destructive"
    />
    <span>{children}</span>
  </p>
);
