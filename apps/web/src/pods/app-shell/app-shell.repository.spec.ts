// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

import { navigationApi } from './api/navigation.api';
import { appShellRepository } from './app-shell.repository';

describe('appShellRepository.getNavigation · contra el dataset de verdad', () => {
  it('devuelve la identidad y los cuatro círculos sembrados, ya mapeados', async () => {
    const navegacion = await appShellRepository.getNavigation();

    expect(navegacion.identity).toStrictEqual({
      name: 'Sofía Martín',
      initials: 'SM',
      avatarUrl: '/mock/avatar-sofia-martin.jpg',
    });
    expect(navegacion.circles.map((circulo) => circulo.name)).toStrictEqual([
      'Familia García',
      'Lisboa 2026',
      'Amigas de la uni',
      'Boda de Ana y Leo',
    ]);
  });
});

describe('appShellRepository.getNavigation · es el único camino a los datos (R41)', () => {
  // `vi.spyOn` en el límite del sistema, que es la estrategia por omisión de la skill:
  // lo que se finge es el `api/`, nunca el mapper. Si el repositorio dejase de pasar la
  // respuesta por el mapper, aquí saldría `cover_url` en vez de `coverUrl`.
  it('pasa por el mapper lo que responde el api, sea lo que sea', async () => {
    vi.spyOn(navigationApi, 'getNavigation').mockResolvedValue({
      viewer: {
        full_name: 'Lucas Vidal',
        email: 'lucas@correo.es',
        avatar_url: '/mock/avatar-lucas-vidal.jpg',
      },
      circles: [{ name: 'Lisboa 2026', cover_url: '/mock/circle-lisboa-2026.jpg' }],
    });

    const navegacion = await appShellRepository.getNavigation();

    expect(navegacion).toStrictEqual({
      identity: {
        name: 'Lucas Vidal',
        initials: 'LV',
        avatarUrl: '/mock/avatar-lucas-vidal.jpg',
      },
      circles: [{ name: 'Lisboa 2026', coverUrl: '/mock/circle-lisboa-2026.jpg' }],
    });

    vi.restoreAllMocks();
  });
});

/**
 * El test que T22 pide por su nombre: **nada con forma de backend cruza el límite** —
 * ni un nombre de campo, ni una fecha ISO, ni un código.
 *
 * Se recorre el ViewModel entero en vez de enumerar sus campos a mano, que es lo que lo
 * hace una guarda y no una copia del tipo: un campo que alguien añada mañana al mapper
 * pasa por aquí sin que nadie se acuerde de actualizar el test. Lo que **no** puede
 * cazar, dicho para que no se lea como más de lo que es: un código de una sola palabra
 * en minúsculas (`'free'`) es indistinguible de texto legítimo, así que la rama de
 * «códigos» sólo pilla `snake_case` y `MAYÚSCULAS_CON_GUIÓN`. Los tres códigos que el
 * dataset tiene hoy (`free`, `pending`, `already_member`) viven en fixtures que este pod
 * no lee.
 */
const recorrer = (
  valor: unknown,
  claves: string[] = [],
  cadenas: string[] = [],
): { claves: string[]; cadenas: string[] } => {
  if (typeof valor === 'string') {
    cadenas.push(valor);
  } else if (Array.isArray(valor)) {
    for (const elemento of valor) recorrer(elemento, claves, cadenas);
  } else if (valor !== null && typeof valor === 'object') {
    for (const [clave, anidado] of Object.entries(valor)) {
      claves.push(clave);
      recorrer(anidado, claves, cadenas);
    }
  }

  return { claves, cadenas };
};

describe('appShellRepository · nada con forma de backend cruza el límite (T22, R41)', () => {
  it('ni un nombre de campo, ni una fecha ISO, ni un código', async () => {
    const { claves, cadenas } = recorrer(await appShellRepository.getNavigation());

    // Que el recorrido ha visto algo: sin esto, un ViewModel vacío pasaría las tres
    // aserciones de abajo por no tener nada que violarlas.
    expect(claves.length).toBeGreaterThan(0);
    expect(cadenas.length).toBeGreaterThan(0);

    // Nombres de campo del backend: `full_name`, `avatar_url`, `cover_url`,
    // `state_code`, `expires_at`…
    expect(claves.filter((clave) => clave.includes('_'))).toStrictEqual([]);

    // `email` no es `snake_case`, pero es exactamente el campo que el mapper tira:
    // ninguna pantalla del raíl lo dibuja y un consumidor no debería ignorarlo.
    expect(claves).not.toContain('email');

    // Fechas ISO: el ViewModel lleva `Date` o la forma en español, nunca la cadena de
    // transporte.
    expect(cadenas.filter((cadena) => /^\d{4}-\d{2}-\d{2}T/.test(cadena))).toStrictEqual(
      [],
    );

    // Códigos del backend en las dos formas que se pueden distinguir de texto.
    expect(
      cadenas.filter(
        (cadena) => /^[a-z]+(_[a-z]+)+$/.test(cadena) || /^[A-Z][A-Z_]{2,}$/.test(cadena),
      ),
    ).toStrictEqual([]);
  });
});
