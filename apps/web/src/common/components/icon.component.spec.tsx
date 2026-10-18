import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon, ICON_NAMES, type IconName } from './icon.component';

const svgDe = (contenedor: HTMLElement) => contenedor.querySelector('svg');

describe('Icon', () => {
  it('pinta el glifo del nombre que se le pide', () => {
    const { container } = render(<Icon name="search" />);

    expect(svgDe(container)).not.toBeNull();
  });
});

describe('Icon · un nombre que no existe (R34, D15)', () => {
  // D15: en desarrollo **falla ruidosamente**, en producción pinta nada. Un icono que
  // desaparece en silencio es cómo un ítem de navegación pierde su significado, así
  // que lo que no puede pasar es que un nombre mal escrito no despierte a nadie. El
  // camino de producción no se asevera aquí (`import.meta.env.DEV` es verdadero bajo
  // Vitest) y D15 dice explícitamente que este test cubre sólo el de desarrollo.
  it('lanza en desarrollo, y el mensaje dice qué nombre era', () => {
    expect(() => render(<Icon name={'photo-de-nadie' as IconName} />)).toThrow(
      /photo-de-nadie/,
    );
  });
});

describe('Icon · el conjunto aceptado no es más grande que el mapa', () => {
  // La lección del Grupo 1, dos veces: indexar un objeto literal consulta
  // `Object.prototype`, así que `ICON_MAP['constructor']` devuelve una función y el
  // componente intentaría pintarla. Por eso el mapa es un `Map`, que no tiene claves
  // heredadas **en absoluto** — el conjunto que acepta no puede ser más grande que la
  // tabla por construcción, en vez de por una guarda que haya que acordarse de poner.
  it.each(['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__'])(
    'trata «%s» como un nombre inexistente y no como un glifo',
    (heredado) => {
      expect(() => render(<Icon name={heredado as IconName} />)).toThrow(
        new RegExp(heredado.replace('__', '__')),
      );
    },
  );
});

describe('Icon · `success` y `check` son una sola entrada (R35)', () => {
  // Un alias, no dos entradas: pintan exactamente el mismo glifo, así que no hay
  // nada que pueda separarse con el tiempo. Es lo que R35 pide, y esta aserción es
  // lo que lo impone.
  it('los dos nombres pintan el mismo glifo', () => {
    const { container: conSuccess } = render(<Icon name="success" />);
    const { container: conCheck } = render(<Icon name="check" />);

    expect(svgDe(conSuccess)).not.toBeNull();
    expect(svgDe(conSuccess)?.outerHTML).toBe(svgDe(conCheck)?.outerHTML);
  });
});

// Los nombres se escriben aquí **a mano y desde el contrato**, no se derivan del mapa:
// derivarlos haría el test tautológico, que es la lección que la review del Grupo 1
// dejó sobre su contador de hojas. Catorce son los del README del sistema de diseño y
// diecinueve los que añade §5 del handoff (R33); `success` es la entrada canónica de
// la marca de verificación y `check` su alias (R35).
const NOMBRES_DEL_DS = [
  'album',
  'arrowRight',
  'check',
  'chevronDown',
  'clock',
  'download',
  'filter',
  'heart',
  'pin',
  'shield',
  'sparkles',
  'tag',
  'upload',
  'users',
] as const;

const NOMBRES_DEL_HANDOFF = [
  'arrowLeft',
  'lock',
  'logout',
  'photos',
  'search',
  'home',
  'help',
  'user',
  'edit',
  'phone',
  'chevronRight',
  'plus',
  'ban',
  'pending',
  'settings',
  'monitor',
  'sun',
  'moon',
  'mail',
] as const;

const NOMBRES_ESPERADOS = [...NOMBRES_DEL_DS, ...NOMBRES_DEL_HANDOFF, 'success'];

describe('Icon · el conjunto de nombres de §5 (R33)', () => {
  it('son catorce del sistema de diseño más diecinueve del handoff, más `success`', () => {
    expect(NOMBRES_DEL_DS).toHaveLength(14);
    expect(NOMBRES_DEL_HANDOFF).toHaveLength(19);
    expect([...ICON_NAMES].sort()).toStrictEqual([...NOMBRES_ESPERADOS].sort());
  });

  it.each(NOMBRES_ESPERADOS)('«%s» pinta un glifo', (nombre) => {
    const { container } = render(<Icon name={nombre as IconName} />);

    expect(svgDe(container)).not.toBeNull();
  });
});

describe('Icon · decorativo por omisión, anunciado cuando se le pide', () => {
  // Esta pareja llegó en el verde del ciclo del conjunto de nombres, así que **nació
  // verde** y no hubo rojo que la empujara; queda dicho, y abajo se probó a mano
  // quitando cada mitad. En los artboards el icono casi siempre va junto a una
  // etiqueta visible que ya dice lo mismo, así que anunciarlo sería repetirlo; §9 pide
  // `aria-label` sólo donde el icono es la única información.
  it('por omisión no se anuncia', () => {
    const { container } = render(<Icon name="home" />);

    expect(svgDe(container)?.getAttribute('aria-hidden')).toBe('true');
    expect(svgDe(container)?.getAttribute('role')).toBeNull();
  });

  it('con `label` se anuncia como imagen con ese nombre', () => {
    const { container } = render(<Icon name="home" label="Mis círculos" />);

    expect(svgDe(container)?.getAttribute('aria-hidden')).toBeNull();
    expect(svgDe(container)?.getAttribute('role')).toBe('img');
    expect(svgDe(container)?.getAttribute('aria-label')).toBe('Mis círculos');
  });
});
