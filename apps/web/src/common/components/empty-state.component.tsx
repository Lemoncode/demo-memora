import type { ReactNode } from 'react';
import { cn } from 'cn';

import { Icon, type IconName } from './icon.component';

/**
 * Los tres tonos que §5 enumera. `neutral` y `mint` salen enteros de la capa
 * semántica; `peach` **no tiene equivalente semántico** en el fichero de tokens, así
 * que referencia la escala primitiva por `var()` — sin literales, pero un nivel más
 * abajo de lo que el contrato de tokens prefiere. Queda anotado como lo que es: el
 * fichero no declara una familia accent semántica, y esto no es sitio para inventarla.
 *
 * `mint` es el caso bonito: `success-foreground` **ya es** «mint-strong en claro,
 * mint-base en oscuro» (el fichero lo sobreescribe en el bloque oscuro), que es
 * exactamente lo que el sistema de diseño escribe como
 * `text-accent-mint-strong dark:text-accent-mint` — una pareja medida por el gate de
 * contraste, en un solo token y sin variante `dark:`.
 */
const TONE_CLASSES = {
  neutral: 'bg-elevated text-body-foreground',
  peach: cn(
    'bg-[var(--primitive-color-accent-peach-soft)]',
    'text-[var(--primitive-color-accent-peach-strong)]',
    'dark:text-[var(--primitive-color-accent-peach-base)]',
  ),
  mint: 'bg-[var(--primitive-color-accent-mint-soft)] text-success-foreground',
} as const;

const SIZE_CLASSES = {
  default: { root: 'gap-4 py-12', box: 'size-16', icon: 'size-8', title: 'text-xl' },
  sm: { root: 'gap-3 py-8', box: 'size-12', icon: 'size-6', title: 'text-lg' },
} as const;

/**
 * Como en `Icon`, y por la misma lección que la review del Grupo 1 dejó dos veces:
 * indexar un objeto literal consulta `Object.prototype`, así que un `tone` de
 * `'constructor'` devolvería una función. Un `Map` no tiene claves heredadas, de modo
 * que el conjunto aceptado no puede ser más ancho que la tabla; lo que no esté cae en
 * el valor por omisión en vez de pintar basura.
 */
const TONES = new Map<string, string>(Object.entries(TONE_CLASSES));

const SIZES = new Map<string, (typeof SIZE_CLASSES)[keyof typeof SIZE_CLASSES]>(
  Object.entries(SIZE_CLASSES),
);

/**
 * El contenedor de mensaje que usan los tres estados de la invitación y los dos 404
 * (R32). **No es un estado vacío de una lista**: ninguna pantalla de esta parte puede
 * estar vacía, y §6 lo dice; se llama así porque es el componente del sistema de
 * diseño que hace de mensaje centrado con icono.
 *
 * El icono es decorativo y el **título lleva el mensaje de verdad**, que es también lo
 * que hace cumplir R36 por construcción: el icono tintado con un accent nunca aparece
 * sin etiqueta visible al lado, porque `title` es obligatorio.
 */
export const EmptyState = ({
  icon,
  tone = 'neutral',
  title,
  size = 'default',
  className,
  children,
}: {
  icon: IconName;
  tone?: keyof typeof TONE_CLASSES;
  title: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  children?: ReactNode;
}) => {
  const medidas = SIZES.get(size) ?? SIZE_CLASSES.default;
  const tono = TONES.get(tone) ?? TONE_CLASSES.neutral;

  return (
    <div
      data-slot="empty-state"
      className={cn('flex flex-col items-center text-center', medidas.root, className)}
    >
      <span className={cn('grid place-items-center rounded-panel', medidas.box, tono)}>
        <Icon name={icon} className={medidas.icon} />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className={cn('font-heading font-bold text-foreground', medidas.title)}>
          {title}
        </h3>
        {children === undefined ? null : (
          <p className="text-sm leading-relaxed text-body-foreground">{children}</p>
        )}
      </div>
    </div>
  );
};
