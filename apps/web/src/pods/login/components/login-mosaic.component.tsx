import { cn } from 'cn';

/**
 * El mosaico de `Login-D`: las **mismas siete fotos** que el collage de móvil, con
 * otros vanos y otro radio, dentro de la media pantalla izquierda (R96).
 *
 * Que compartan imágenes es del diseño, no un atajo: el mosaico de `Register-D` usa
 * **otras siete** y tiene su propio componente en su propio pod, porque §4 dice
 * explícitamente que no se reutilice.
 *
 * Decoración (R92): contenedor `aria-hidden`, `alt` vacío en cada imagen.
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
  { src: '/mock/photo-01.jpg', className: 'col-span-2 row-span-2' },
  { src: '/mock/circle-familia-garcia.jpg' },
  { src: '/mock/photo-03.jpg' },
  { src: '/mock/circle-lisboa-2026.jpg', className: 'col-span-2' },
  { src: '/mock/photo-04.jpg' },
  { src: '/mock/photo-02.jpg', className: 'col-span-2' },
  { src: '/mock/photo-05.jpg' },
];

export const LoginMosaic = () => (
  <div
    aria-hidden="true"
    className="absolute inset-6 grid grid-cols-4 auto-rows-fr gap-3"
  >
    {CASILLAS.map((casilla) => (
      <img
        key={casilla.src}
        src={casilla.src}
        alt=""
        className={cn('size-full rounded-panel object-cover', casilla.className)}
      />
    ))}
  </div>
);
