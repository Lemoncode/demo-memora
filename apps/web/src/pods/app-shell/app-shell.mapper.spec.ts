// @vitest-environment node

import { describe, expect, it } from 'vitest';

import type { NavigationApiModel } from './api/navigation.api-model';
import { mapNavigationFromApi } from './app-shell.mapper';

const respuesta = (
  sobreescritura: Partial<NavigationApiModel> = {},
): NavigationApiModel => ({
  viewer: {
    full_name: 'Sofía Martín',
    email: 'sofia.martin@correo.es',
    avatar_url: '/mock/avatar-sofia-martin.jpg',
  },
  circles: [{ name: 'Familia García', cover_url: '/mock/circle-familia-garcia.jpg' }],
  ...sobreescritura,
});

describe('mapNavigationFromApi · la identidad del raíl', () => {
  it('renombra los campos del backend a los del ViewModel', () => {
    const navegacion = mapNavigationFromApi(respuesta());

    expect(navegacion.identity).toMatchObject({
      name: 'Sofía Martín',
      avatarUrl: '/mock/avatar-sofia-martin.jpg',
    });
  });
});

describe('mapNavigationFromApi · las iniciales (R43)', () => {
  // El *fallback* del `Avatar` las quiere hechas: su propio comentario dice que no las
  // deriva él «para que no haya dos sitios que calculen lo mismo». Así que éste es el
  // sitio, y es el único.
  it('deriva dos iniciales en mayúscula de un nombre y un apellido', () => {
    const navegacion = mapNavigationFromApi(respuesta());

    expect(navegacion.identity.initials).toBe('SM');
  });
});

describe('mapNavigationFromApi · nombres que no son «nombre + apellido»', () => {
  // El dataset sólo tiene «Sofía Martín», pero un backend devuelve lo que la gente
  // escribe. Las tres formas degeneradas se fijan aquí para que el *fallback* del
  // `Avatar` no acabe nunca con tres letras ni con una cadena de espacios.
  it.each([
    ['Sofía', 'S'],
    ['Sofía Martín Ortega', 'SM'],
    ['  Sofía   Martín  ', 'SM'],
    ['', ''],
    ['   ', ''],
  ])('«%s» → «%s»', (nombre, iniciales) => {
    const navegacion = mapNavigationFromApi(
      respuesta({
        viewer: { full_name: nombre, email: 'x@y.es', avatar_url: '/mock/a.jpg' },
      }),
    );

    expect(navegacion.identity.initials).toBe(iniciales);
  });
});

describe('mapNavigationFromApi · los círculos del raíl', () => {
  it('renombra la portada y conserva el orden del dataset', () => {
    const navegacion = mapNavigationFromApi(
      respuesta({
        circles: [
          { name: 'Familia García', cover_url: '/mock/circle-familia-garcia.jpg' },
          { name: 'Lisboa 2026', cover_url: '/mock/circle-lisboa-2026.jpg' },
        ],
      }),
    );

    expect(navegacion.circles).toStrictEqual([
      { name: 'Familia García', coverUrl: '/mock/circle-familia-garcia.jpg' },
      { name: 'Lisboa 2026', coverUrl: '/mock/circle-lisboa-2026.jpg' },
    ]);
  });

  // R57: una lista vacía **no** es un error ni un hueco que haya que rellenar — es la
  // forma «sin círculos» que dibuja `NotFound-D`, y el raíl la resuelve omitiendo la
  // sección entera. El mapper se limita a no inventar nada.
  it('deja la lista vacía vacía', () => {
    expect(mapNavigationFromApi(respuesta({ circles: [] })).circles).toStrictEqual([]);
  });
});
