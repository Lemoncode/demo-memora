import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { persistTheme, readStoredTheme, THEME_ATTRIBUTE, THEMES } from './theme';
import type { Theme } from './theme';
import { ThemeProvider, useTheme } from './theme-provider.component';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  controles.clear();
});

let cambiarTema: (theme: Theme) => void;

const Sonda = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  cambiarTema = setTheme;

  return (
    <output>
      {theme}/{resolvedTheme}
    </output>
  );
};

const controles = new Map<string, (theme: Theme) => void>();

const control = (etiqueta: string) => {
  const setTheme = controles.get(etiqueta);

  if (setTheme === undefined) {
    throw new Error(`No hay ningún control «${etiqueta}» montado.`);
  }

  return setTheme;
};

const SondaEtiquetada = ({ etiqueta }: { etiqueta: string }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  controles.set(etiqueta, setTheme);

  return (
    <output aria-label={etiqueta}>
      {theme}/{resolvedTheme}
    </output>
  );
};

const renderConProveedor = () =>
  render(
    <ThemeProvider>
      <Sonda />
    </ThemeProvider>,
  );

const leerSonda = () => screen.getByRole('status').textContent;

// jsdom trae un `matchMedia` que nunca cambia, así que la preferencia del sistema se
// dobla aquí: `establecer` mueve `matches` y avisa a los oyentes, que es exactamente lo
// que hace el sistema operativo cuando el usuario cambia de apariencia.
const doblarPreferenciaDelSistema = (prefiereOscuroInicial: boolean) => {
  let matches = prefiereOscuroInicial;
  const oyentes = new Set<(event: MediaQueryListEvent) => void>();

  const lista = {
    media: '(prefers-color-scheme: dark)',
    get matches() {
      return matches;
    },
    addEventListener: (_tipo: string, oyente: (event: MediaQueryListEvent) => void) => {
      oyentes.add(oyente);
    },
    removeEventListener: (
      _tipo: string,
      oyente: (event: MediaQueryListEvent) => void,
    ) => {
      oyentes.delete(oyente);
    },
  };

  const matchMedia = vi.fn(() => lista as unknown as MediaQueryList);
  vi.stubGlobal('matchMedia', matchMedia);

  return {
    matchMedia,
    establecer: (prefiereOscuro: boolean) => {
      matches = prefiereOscuro;
      act(() => {
        for (const oyente of oyentes) {
          oyente({ matches: prefiereOscuro } as MediaQueryListEvent);
        }
      });
    },
    get oyentes() {
      return oyentes.size;
    },
  };
};

describe('ThemeProvider', () => {
  it('arranca del atributo que ya está en el DOM, no de volver a leer el almacenamiento', () => {
    // El script de pre-pintado ya decidió: el atributo es la verdad. Si el proveedor
    // volviese a leer `localStorage` daría «light» y habría dos fuentes de verdad.
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
    persistTheme('light');

    renderConProveedor();

    expect(leerSonda()).toBe('dark/dark');
  });
});

describe('ThemeProvider · setTheme', () => {
  it.each(THEMES)('escribe «%s» en el atributo de <html> y lo persiste', (tema) => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light');
    renderConProveedor();

    act(() => cambiarTema(tema));

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(tema);
    expect(readStoredTheme()).toBe(tema);
    expect(leerSonda()?.startsWith(`${tema}/`)).toBe(true);
  });
});

describe('ThemeProvider · «Sistema» sigue al sistema operativo', () => {
  it.each([
    [true, 'dark'],
    [false, 'light'],
  ] as const)(
    'con «Sistema» y prefiere-oscuro=%s pinta «%s»',
    (prefiereOscuro, esperado) => {
      doblarPreferenciaDelSistema(prefiereOscuro);
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'system');

      renderConProveedor();

      expect(leerSonda()).toBe(`system/${esperado}`);
    },
  );
});

describe('ThemeProvider · cambio en vivo de la preferencia del sistema', () => {
  it('refleja el cambio sin recargar mientras el tema es «Sistema» (R21)', () => {
    const sistema = doblarPreferenciaDelSistema(false);
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'system');
    renderConProveedor();
    expect(leerSonda()).toBe('system/light');

    sistema.establecer(true);

    expect(leerSonda()).toBe('system/dark');

    sistema.establecer(false);

    expect(leerSonda()).toBe('system/light');
  });

  it.each(['light', 'dark'] as const)(
    'ignora el cambio del sistema mientras el tema es «%s»',
    (tema) => {
      const sistema = doblarPreferenciaDelSistema(false);
      document.documentElement.setAttribute(THEME_ATTRIBUTE, tema);
      renderConProveedor();

      sistema.establecer(true);

      expect(leerSonda()).toBe(`${tema}/${tema}`);
    },
  );

  it('deja de escuchar al desmontarse, sin fugar el oyente', () => {
    const sistema = doblarPreferenciaDelSistema(false);
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'system');
    const { unmount } = renderConProveedor();
    expect(sistema.oyentes).toBe(1);

    unmount();

    expect(sistema.oyentes).toBe(0);
  });
});

describe('ThemeProvider · el atributo del DOM nunca queda suelto', () => {
  // Si el script en línea no llegó a correr (una CSP que bloquea `unsafe-inline`, una
  // extensión, hidratación que revierte el atributo) o alguien dejó basura en él, el
  // DOM se quedaría sin un `data-theme` que los selectores de tokens reconozcan. El
  // proveedor cierra ese hueco: al montarse, el atributo pasa a ser su propio estado.
  it.each([
    ['ausente', null, 'system'],
    ['un tema no expuesto', 'matcha', 'system'],
    ['una variante de caja', 'Dark', 'system'],
    ['la cadena vacía', '', 'system'],
    ['«Sistema»', 'system', 'system'],
    ['«Oscuro»', 'dark', 'dark'],
    ['«Claro»', 'light', 'light'],
  ])('normaliza el atributo %s', (_caso, inicial, esperado) => {
    if (inicial === null) {
      document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    } else {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, inicial);
    }

    renderConProveedor();

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(esperado);
    expect(leerSonda()?.startsWith(`${esperado}/`)).toBe(true);
  });
});

describe('useTheme', () => {
  it('falla con un mensaje nombrando el proveedor cuando no hay ninguno por encima', () => {
    // Sin esta guarda el consumidor recibiría `null` y reventaría al desestructurar,
    // en el componente equivocado y sin decir qué falta.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Sonda />)).toThrow(/ThemeProvider/);
  });
});

describe('ThemeProvider · un solo estado para los dos controles (R26)', () => {
  it('el tema elegido en un control es el que lee el otro', () => {
    // Los dos controles de §4 del handoff — el `ToggleGroup` móvil y el `Menu` de
    // escritorio — llegan en los grupos 3–4 y 12. Aquí sólo importa que sean dos
    // consumidores distintos del mismo contexto, que es lo que R26 pide.
    doblarPreferenciaDelSistema(false);
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'system');

    render(
      <ThemeProvider>
        <SondaEtiquetada etiqueta="movil" />
        <SondaEtiquetada etiqueta="escritorio" />
      </ThemeProvider>,
    );

    act(() => control('movil')('dark'));

    expect(screen.getByRole('status', { name: 'movil' }).textContent).toBe('dark/dark');
    expect(screen.getByRole('status', { name: 'escritorio' }).textContent).toBe(
      'dark/dark',
    );

    act(() => control('escritorio')('system'));

    expect(screen.getByRole('status', { name: 'movil' }).textContent).toBe(
      'system/light',
    );
    expect(screen.getByRole('status', { name: 'escritorio' }).textContent).toBe(
      'system/light',
    );
  });
});

describe('ThemeProvider · R27 — la escritura del atributo es síncrona con el gesto', () => {
  // Esta es la propiedad que *define* R27, y la que ningún otro test de este fichero
  // podía distinguir: el efecto reconciliador vuelve a poner el atributo y `act()` lo
  // vacía antes de cualquier aserción, así que borrar la escritura del manejador dejaba
  // el suite entero en verde. Aquí el atributo se lee **dentro** del callback de `act`,
  // justo después de `setTheme`, que es el instante en que lo vería un manejador de
  // click real: antes de que React vacíe nada. Si el atributo se escribiese en un
  // efecto pasivo, aquí todavía valdría el tema anterior.
  it.each(THEMES)(
    'al elegir «%s» el atributo ya está puesto antes de que React vacíe los efectos',
    (tema) => {
      const inicial = tema === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute(THEME_ATTRIBUTE, inicial);
      renderConProveedor();

      let atributoDuranteElManejador: string | null = null;

      act(() => {
        cambiarTema(tema);
        atributoDuranteElManejador =
          document.documentElement.getAttribute(THEME_ATTRIBUTE);
      });

      expect(atributoDuranteElManejador).toBe(tema);
    },
  );
});
