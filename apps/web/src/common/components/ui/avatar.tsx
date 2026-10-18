import * as React from 'react';
import { cn } from 'cn';
import { Avatar as AvatarPrimitive } from 'radix-ui';

// Los cuatro tamaños que §5 enumera, con los valores del DS: `sm` en la fila de
// identidad del rail, `md` en la línea de quien invita, `lg` en la identidad de
// `Profile-M` y `xl` en el formulario de `Profile-D`.
const SIZE_CLASSES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-xs',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
} as const;

// Un `Map` y no un objeto indexado, igual que en `Icon` y en `EmptyState`: indexar un
// literal consulta `Object.prototype`, y el conjunto que se acepta tiene que ser el
// que de verdad se maneja.
const SIZES = new Map<string, string>(Object.entries(SIZE_CLASSES));

function Avatar({
  className,
  size = 'md',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: keyof typeof SIZE_CLASSES;
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-pill select-none',
        SIZES.get(size) ?? SIZE_CLASSES.md,
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        // Las iniciales **no se derivan aquí**: el mapper del pod las produce (R43,
        // T22) y el llamante las pasa como hijos, así que no hay dos sitios que
        // calculen lo mismo.
        //
        // `pill` / `pill-foreground` es brand-100 con texto brand-700, la pareja que
        // el gate de contraste mide. El DS invierte el avatar en oscuro
        // (brand-900 / brand-200), pero el fichero de tokens no declara ese override:
        // inventarlo aquí sería un color sin medir, así que se usa la pareja
        // declarada, que se lee bien en los dos modos.
        'flex size-full items-center justify-center rounded-pill bg-pill font-semibold text-pill-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
