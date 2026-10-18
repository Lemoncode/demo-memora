import * as React from 'react';
import { cn } from 'cn';
import { Label as LabelPrimitive } from 'radix-ui';

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // §5: toda etiqueta va emparejada con su control por `htmlFor`; no hay campos
        // con sólo `placeholder`. El primitivo de Radix es el que hace que pulsar la
        // etiqueta enfoque el control.
        'flex items-center gap-2 text-sm leading-none font-medium text-foreground select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
        'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
