import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SideNav } from './side-nav.component';

const raíl = (circles: { name: string; coverUrl: string; href: string }[]) =>
  render(
    <SideNav
      primary={[
        { label: 'Mis círculos', href: '/circles', icon: 'home', current: false },
        { label: 'Subidas', href: '/uploads', icon: 'upload', current: false },
      ]}
      circles={circles}
      secondary={[
        { label: 'Ayuda', href: '/help', icon: 'help', current: false },
        { label: 'Privacidad', href: '/privacy', icon: 'lock', current: false },
      ]}
      identity={{
        name: 'Sofía Martín',
        initials: 'SM',
        avatarUrl: '/mock/avatar-sofia-martin.jpg',
        href: '/profile',
        current: false,
      }}
    />,
  );

const CÍRCULOS = [
  {
    name: 'Familia García',
    coverUrl: '/mock/circle-familia-garcia.jpg',
    href: '/circles',
  },
];

/**
 * La sección «Círculos» es **condicional**, y eso es lo que reconcilia dos artboards:
 * el raíl de `Profile-D` la tiene y el de `NotFound-D` no. Hacerla condicional hace
 * **correctos los dos** en vez de uno de ellos equivocado (R56, R57).
 *
 * Es el único test de marcado que este paso escribe, y lo escribe a propósito: el
 * contrato dice que no se fijan los artboards en aserciones de marcado, pero esto no es
 * la forma de un dibujo — es la única rama de verdad que tiene el raíl, y es un
 * criterio de aceptación de la sección E. Lo demás (que las dos listas difieran, que la
 * fila de identidad sea el perfil) se verifica a mano en la review.
 */
describe('SideNav · la sección «Círculos» (R56, R57)', () => {
  it('la pinta cuando hay círculos, con su portada', () => {
    raíl(CÍRCULOS);

    const sección = screen.getByRole('list', { name: 'Círculos' });

    expect(sección).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Familia García' })).toBeTruthy();
    expect(sección.querySelector('img')?.getAttribute('src')).toBe(
      '/mock/circle-familia-garcia.jpg',
    );
  });

  it('la omite **entera** cuando no hay ninguno, y deja el resto del raíl intacto', () => {
    raíl([]);

    expect(screen.queryByRole('list', { name: 'Círculos' })).toBeNull();
    expect(screen.queryByText('Círculos')).toBeNull();

    for (const resto of ['Mis círculos', 'Subidas', 'Ayuda', 'Privacidad']) {
      expect(screen.getByRole('link', { name: resto })).toBeTruthy();
    }
    expect(screen.getByRole('link', { name: /Sofía Martín/ })).toBeTruthy();
  });
});

/**
 * El punto de corrección más importante del shell, y el que la v1 del contrato de
 * diseño tenía mal: en escritorio **no hay ítem de navegación que represente el
 * perfil**, así que `aria-current="page"` en `/profile` va en la **fila de identidad**
 * (R58), que es lo que dibuja `Profile-D`. Marcarlo en «Mis círculos» o no marcarlo en
 * ningún sitio son los dos errores que este test cierra.
 */
describe('SideNav · `aria-current` del perfil (R58)', () => {
  it('va en la fila de identidad, y en ningún ítem de navegación', () => {
    render(
      <SideNav
        primary={[
          { label: 'Mis círculos', href: '/circles', icon: 'home', current: false },
          { label: 'Subidas', href: '/uploads', icon: 'upload', current: false },
        ]}
        circles={CÍRCULOS}
        secondary={[
          { label: 'Ayuda', href: '/help', icon: 'help', current: false },
          { label: 'Privacidad', href: '/privacy', icon: 'lock', current: false },
        ]}
        identity={{
          name: 'Sofía Martín',
          initials: 'SM',
          avatarUrl: '/mock/avatar-sofia-martin.jpg',
          href: '/profile',
          current: true,
        }}
      />,
    );

    const marcados = screen
      .getAllByRole('link')
      .filter((enlace) => enlace.getAttribute('aria-current') === 'page');

    expect(marcados).toHaveLength(1);
    expect(marcados[0]?.textContent).toContain('Sofía Martín');
    expect(marcados[0]?.getAttribute('href')).toBe('/profile');
  });
});
