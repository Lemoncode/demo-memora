import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// El anillo de foco del sistema es una **`outline`** (§9 y el propio sistema de diseño:
// «2 px de outline, 2 px de separación»), así que todos los componentes lo pintan con
// `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`.
//
// `outline-none` de Tailwind v4 pone `--tw-outline-style: none` **sin condición**, y
// `outline-2` resuelve `outline-style: var(--tw-outline-style)` — o sea `none`. Un
// componente que lleve las dos cosas tiene tres utilidades de foco que **no pintan
// nada y se leen como cumplimiento**. Pasó en el ítem del menú de tema, con todos los
// gates en verde y sin que ningún test lo viera: es la misma forma de fallo silencioso
// que la supresión de transiciones de T46.
//
// Ningún test de DOM puede cazar esto (jsdom no computa Tailwind) y el escáner
// anti-hardcode mira colores y dimensiones. Esta guarda es lo único que lo vigila.
describe('El anillo de foco no se puede apagar sin querer', () => {
  it('ningún componente mezcla `outline-none` con las utilidades de foco', () => {
    const raiz = resolve(process.cwd(), 'src/common/components');

    // Se mira el **código**, no la prosa: un comentario que explique el peligro
    // nombrándolo no es una violación. Se quitan los bloques `/* … */` y las líneas
    // que empiezan por `//` o `*`, que es como las escribe Prettier en este árbol; no
    // se recorta a partir de un `//` en mitad de una línea, para no tragarse código
    // por culpa de una URL dentro de una cadena.
    const soloCodigo = (fuente: string) =>
      fuente
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((linea) => !/^\s*(\/\/|\*)/.test(linea))
        .join('\n');

    const culpables = readdirSync(raiz, { recursive: true, encoding: 'utf8' })
      .filter((fichero) => /\.tsx?$/.test(fichero) && !fichero.endsWith('.spec.ts'))
      .filter((fichero) =>
        soloCodigo(readFileSync(resolve(raiz, fichero), 'utf8')).includes('outline-none'),
      );

    expect(culpables).toStrictEqual([]);
  });
});
