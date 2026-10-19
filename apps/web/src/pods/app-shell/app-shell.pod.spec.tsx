import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShellPod } from './app-shell.pod';
import type { Navigation } from './app-shell.model';

const NAVEGACIÓN: Navigation = {
  identity: {
    name: 'Sofía Martín',
    initials: 'SM',
    avatarUrl: '/mock/avatar-sofia-martin.jpg',
  },
  circles: [{ name: 'Familia García', coverUrl: '/mock/circle-familia-garcia.jpg' }],
};

/**
 * En jsdom no hay hoja de estilos, así que `nav:hidden` no esconde nada y **las dos
 * navegaciones están en el DOM a la vez**. Eso aquí es una ventaja: una sola aserción
 * cubre el raíl y la barra, que es donde el mismo cálculo se usa dos veces.
 */
const marcados = () =>
  screen
    .getAllByRole('link')
    .filter((enlace) => enlace.getAttribute('aria-current') === 'page')
    .map(
      (enlace) =>
        `${enlace.closest('nav')?.getAttribute('data-slot')}:${enlace.getAttribute('href')}`,
    );

const shell = (activePath: string | undefined) =>
  render(
    <AppShellPod navigation={NAVEGACIÓN} activePath={activePath}>
      <p>contenido</p>
    </AppShellPod>,
  );

/**
 * **Dos vocabularios que sólo coinciden en las rutas hoja.** `activePath` es el
 * `fullPath` de la ruta emparejada y los ítems llevan un `href` de enlace. TanStack
 * construye `fullPath` como `cleanPath(padre + '/' + path)`, así que una ruta **índice**
 * arrastra una barra final: `_app/circles/index.tsx` da `/circles/`, que es la forma
 * probable de la Parte 2 porque `/circles/$id` necesita el directorio. Sin normalizar,
 * `'/circles' === '/circles/'` es `false` y «Mis círculos» **no se marcaría nunca**, en
 * silencio y sin que ningún gate lo viera.
 *
 * Es la razón por la que router-core hace `trimPathRight` en su propio `routesByPath`:
 * el problema es del vocabulario, no de esta pantalla.
 */
describe('AppShellPod · la ruta emparejada se compara sin barra final (T22, R58)', () => {
  it('marca los ítems de `/circles` cuando la ruta emparejada es la forma índice `/circles/`', () => {
    shell('/circles/');

    // Los dos ítems de `/circles` —«Mis círculos» en el raíl y «Círculos» en la
    // barra (R55)— se marcan. Se compara el destino y no la etiqueta: el destino es
    // justo el vocabulario que este test vigila.
    expect(marcados()).toEqual(['side-nav:/circles', 'bottom-nav:/circles']);
  });

  it('los sigue marcando con la forma hoja `/circles`, que es la que empareja hoy', () => {
    shell('/circles');

    expect(marcados()).toEqual(['side-nav:/circles', 'bottom-nav:/circles']);
  });

  it('marca el perfil —fila de identidad incluida— con `/profile/` igual que con `/profile`', () => {
    shell('/profile/');

    // En el raíl el perfil **es** la fila de identidad y no un ítem de navegación
    // (R54, R58); en la barra sí es un ítem. Los dos van por el mismo cálculo.
    expect(marcados()).toEqual(['side-nav:/profile', 'bottom-nav:/profile']);
    expect(
      screen.getByRole('link', { name: /Sofía Martín/ }).getAttribute('aria-current'),
    ).toBe('page');
  });

  /**
   * La otra mitad del contrato, y la que impide «arreglar» esto comparando contra
   * `location.pathname`: en el 404 la ruta emparejada es la splat, cuyo `fullPath` es
   * `/$` y no es el destino de ningún ítem. No marcar nada ahí es **la verdad**, y
   * normalizar la barra final no debe empezar a marcar cosas.
   */
  it('no marca nada en el 404, cuya ruta emparejada es `/$`', () => {
    shell('/$');

    expect(marcados()).toEqual([]);
  });

  it('no marca nada antes de que el router haya emparejado (ruta indefinida)', () => {
    shell(undefined);

    expect(marcados()).toEqual([]);
  });
});
