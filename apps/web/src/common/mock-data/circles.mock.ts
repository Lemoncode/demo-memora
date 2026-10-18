/**
 * Los círculos del raíl lateral, en forma de respuesta de API (R39).
 *
 * **El cruce deliberado hacia el territorio de la Parte 2** (R48): el `SideNav` de
 * escritorio es data-driven y su sección «Círculos» se siembra en esta parte, así que
 * aquí vive la lista — con **nombre e imagen de portada y nada más**. Ni recuento de
 * miembros, ni de fotos, ni álbumes, ni identificadores: un `id` es el campo con el que
 * la Parte 2 construiría `/circles/$id`, y el cruce autorizado no llega hasta ahí. La
 * lista se indexa por `name`, que es único en el dataset.
 *
 * Orden y contenido leídos del artboard `Profile-D` (la sección «Círculos» del raíl);
 * `NotFound-D` dibuja el mismo raíl sin esa sección, que es la forma «sin círculos».
 */
export interface CircleRailApiShape {
  readonly name: string;
  /** Ruta servida desde `apps/web/public/mock/` (R95): nada toca la red. */
  readonly cover_url: string;
}

export const circlesMock: readonly CircleRailApiShape[] = [
  { name: 'Familia García', cover_url: '/mock/circle-familia-garcia.jpg' },
  { name: 'Lisboa 2026', cover_url: '/mock/circle-lisboa-2026.jpg' },
  { name: 'Amigas de la uni', cover_url: '/mock/circle-amigas-de-la-uni.jpg' },
  { name: 'Boda de Ana y Leo', cover_url: '/mock/circle-boda-de-ana-y-leo.jpg' },
];
