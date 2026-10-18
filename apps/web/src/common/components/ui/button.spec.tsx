import { cn } from 'cn';
import { describe, expect, it } from 'vitest';

import { buttonVariants } from './button';

// Este fichero existe por un defecto concreto que llegó a review, y se queda acotado a
// él: **no** asevera markup de pantallas (R99), sino la salida de una función pura —
// exactamente la composición que falló.
//
// `cva` compone variante antes que tamaño y la cadena entera pasa por `cn`, que es
// clsx **más tailwind-merge**: de dos clases en conflicto gana la última, así que el
// `h-auto px-0` de la variante `link` lo barría la geometría del tamaño y `link`
// acababa midiendo 44 px de alto con 16 px de padding — un bloque, no texto en línea.
// Los artboards ponen `link` **dentro de una frase** («¿La has olvidado?» en la misma
// línea que la etiqueta «Contraseña», «Crea una» dentro de un párrafo), y el Grupo 6
// construye esas pantallas.
const clases = (
  variant: 'link' | 'default' | 'secondary',
  size: 'default' | 'lg' | 'sm',
) => cn(buttonVariants({ variant, size })).split(' ');

const geometriaDeTamano = (lista: string[]) =>
  lista.filter(
    (clase) =>
      (clase.startsWith('h-') && clase !== 'h-auto') ||
      (clase.startsWith('px-') && clase !== 'px-0') ||
      clase.startsWith('size-'),
  );

describe('buttonVariants · `link` es texto en línea, no un bloque', () => {
  it.each(['default', 'lg', 'sm'] as const)(
    'en el tamaño «%s» no se queda con ninguna geometría del tamaño',
    (size) => {
      const lista = clases('link', size);

      expect(lista).toContain('h-auto');
      expect(lista).toContain('px-0');
      expect(geometriaDeTamano(lista)).toStrictEqual([]);
    },
  );

  it('`link` tampoco arrastra el extensor de área de pulsación de `sm`', () => {
    // Un enlace en línea con 44 px invisibles por encima y por debajo se comería los
    // clics del texto que lo rodea, que es justo donde los artboards lo ponen.
    expect(clases('link', 'sm').some((c) => c.startsWith('after:'))).toBe(false);
  });
});

describe('buttonVariants · las demás variantes sí conservan su geometría', () => {
  // Para que las aserciones de arriba no sean vacuas: si el tamaño dejase de aplicar
  // geometría a nadie, aquellas pasarían igual y éstas no.
  it('`default` mantiene el alto del token de objetivo táctil y su padding', () => {
    const lista = clases('default', 'default');

    expect(lista).toContain('h-[var(--primitive-dimension-layout-touch-target)]');
    expect(lista).toContain('px-4');
  });

  it('`secondary` en `sm` sí lleva el extensor de área de pulsación', () => {
    expect(clases('secondary', 'sm').some((c) => c.startsWith('after:'))).toBe(true);
  });
});
