import { cn } from 'cn';

/**
 * El mosaico de `Register-D`: **el suyo, no el de `Login-D`** (R96, §4).
 *
 * Siete imágenes **distintas** con vanos **distintos**: `photo-02` es la única que
 * comparte con el mosaico de login, y está en otra posición y con otro vano. Confundir
 * los dos mosaicos — tratar `/register` en escritorio como `/login` más ancho — fue el
 * único error de hecho de la v1 del contrato de diseño, y es la razón por la que este
 * componente vive en el pod de `register` y no se reutiliza nada de `login`.
 *
 * Decoración (R92): contenedor `aria-hidden`, `alt` vacío en cada imagen. Ninguna
 * casilla es un punto de tabulación.
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
  { src: '/mock/photo-02.jpg', className: 'col-span-2' },
  { src: '/mock/photo-06.jpg', className: 'row-span-2' },
  { src: '/mock/circle-amigas-de-la-uni.jpg' },
  { src: '/mock/photo-07.jpg', className: 'col-span-2 row-span-2' },
  { src: '/mock/photo-08.jpg' },
  { src: '/mock/photo-09.jpg' },
  { src: '/mock/photo-10.jpg', className: 'col-span-2' },
];

export const RegisterMosaic = () => (
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
