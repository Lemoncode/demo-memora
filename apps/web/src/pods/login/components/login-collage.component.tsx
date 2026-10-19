import { cn } from 'cn';

/**
 * El collage de `Login-M`: **el movimiento expresivo de esta pantalla** (R96), y la
 * primera de las cuatro apuestas que §2 reparte por toda la parte.
 *
 * Siete fotos en tres columnas, rotadas −4° y escaladas 1,12 desde el borde superior,
 * de modo que sangran por los cuatro lados. Las filas (170 / 150 / 150 px más los
 * huecos) **suman más que la altura del bloque a propósito**: el collage se sale y lo
 * recorta el contenedor, que es lo que hace que no se lea como una rejilla de tarjetas
 * sino como un montón de fotos.
 *
 * **El `overflow-hidden` que lo recorta vive en el contenedor del pod, no aquí**, y es
 * lo que impide que la rotación provoque *scroll* horizontal a 390 px (R89). No hay
 * nada enfocable dentro, así que ese `overflow` no puede recortar ningún anillo de foco
 * — que es el otro motivo por el que está donde está y no envolviendo media pantalla.
 *
 * **Decoración, y por tanto fuera del árbol de accesibilidad** (R92): el contenedor va
 * `aria-hidden` y cada imagen con `alt` vacío. No es redundante: `aria-hidden` saca el
 * subárbol entero y el `alt` vacío es lo que vale si alguien lo mira sin el atributo.
 *
 * **Sin movimiento**: nada de paralaje, nada de entrada animada (§8). La rotación es
 * una transformación estática.
 */
/**
 * El tipo va en el array y no en cada literal: con `as const` TypeScript estrecha
 * casilla por casilla y las que no llevan vano se quedan **sin** la propiedad, así que
 * `casilla.className` no compila sobre la unión.
 */
interface Casilla {
  readonly src: string;
  readonly className?: string;
}

const CASILLAS: readonly Casilla[] = [
  { src: '/mock/photo-01.jpg', className: 'row-span-2' },
  { src: '/mock/circle-familia-garcia.jpg' },
  { src: '/mock/circle-lisboa-2026.jpg', className: 'row-span-2' },
  { src: '/mock/photo-02.jpg' },
  { src: '/mock/photo-03.jpg' },
  { src: '/mock/photo-04.jpg' },
  { src: '/mock/photo-05.jpg' },
];

export const LoginCollage = () => (
  <div
    aria-hidden="true"
    className="absolute inset-x-0 top-0 grid h-full grid-cols-3 grid-rows-[10.625rem_9.375rem_9.375rem] gap-1.5 p-1.5 [transform-origin:50%_0] [transform:rotate(-4deg)_scale(1.12)]"
  >
    {CASILLAS.map((casilla) => (
      <img
        key={casilla.src}
        src={casilla.src}
        alt=""
        className={cn('size-full rounded-card object-cover', casilla.className)}
      />
    ))}
  </div>
);
