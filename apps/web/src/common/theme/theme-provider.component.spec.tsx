import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { persistTheme, readStoredTheme, THEME_ATTRIBUTE, THEMES } from './theme';
import type { Theme } from './theme';
import {
  THEME_SWITCHING_ATTRIBUTE,
  ThemeProvider,
  useTheme,
} from './theme-provider.component';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  document.documentElement.removeAttribute(THEME_SWITCHING_ATTRIBUTE);
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

// jsdom trae un `requestAnimationFrame` de verdad, y asíncrono, así que para poder
// mirar el fotograma «de antes» y el «de después» sin esperar a nada se dobla aquí:
// `correr()` ejecuta lo que el proveedor haya encolado, cuando este test quiera.
const doblarFotograma = () => {
  const encolados: FrameRequestCallback[] = [];

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    encolados.push(callback);

    return encolados.length;
  });

  return {
    get pendientes() {
      return encolados.length;
    },
    correr: () => {
      const callbacks = encolados.splice(0);

      act(() => {
        for (const callback of callbacks) callback(0);
      });
    },
  };
};

const leerMarcador = () =>
  document.documentElement.getAttribute(THEME_SWITCHING_ATTRIBUTE);

describe('ThemeProvider · R103 — el cambio de tema suprime las transiciones', () => {
  it('pone el marcador en el manejador, en el mismo instante que `data-theme`', () => {
    doblarFotograma();
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light');
    renderConProveedor();

    let marcadorDuranteElManejador: string | null = null;

    act(() => {
      cambiarTema('dark');
      marcadorDuranteElManejador = leerMarcador();
    });

    expect(marcadorDuranteElManejador).toBe('');
  });
});

describe('ThemeProvider · R103 — el marcador vive exactamente lo que dura el cambio', () => {
  // **Esta forma la fijó una medición, no una lectura.** Un solo
  // `requestAnimationFrame` no suprime nada: su callback corre *antes* del recálculo
  // de estilo del fotograma, así que el marcador ya no está cuando el navegador
  // computa los colores nuevos y la transición arranca igual. Medido en Chrome sobre
  // una página aislada, las seis variantes del mecanismo: sin supresión interpola,
  // un rAF interpola (con flush del root y con flush de layout, las dos), y sólo
  // suprimen el rAF doble y el flush *después* de escribir el tema. Se toma el rAF
  // doble porque no depende del orden — el camino del sistema operativo no escribe
  // ningún atributo tras el que flushear — y porque no fuerza un reflow por cambio.
  it('sobrevive al fotograma que pinta el cambio y se suelta en el siguiente', () => {
    const fotograma = doblarFotograma();
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light');
    renderConProveedor();

    act(() => {
      cambiarTema('dark');
    });

    expect(leerMarcador()).toBe('');

    fotograma.correr();

    // El fotograma que **pinta** el cambio: soltar el marcador aquí es soltarlo antes
    // del pintado, que es justo el fallo que la medición encontró.
    expect(leerMarcador()).toBe('');

    fotograma.correr();

    // Y fuera. Si el marcador sobreviviese, **todas** las transiciones de hover y de
    // foco de la aplicación morirían en silencio — el modo de fallo que `design.md`
    // nombra y que esta aserción es lo único que impide.
    expect(leerMarcador()).toBeNull();
  });
});

describe('ThemeProvider · R103 — también cuando el cambio lo dispara el sistema', () => {
  it('suprime el repintado que provoca `prefers-color-scheme` con el tema en «Sistema»', () => {
    const fotograma = doblarFotograma();
    const sistema = doblarPreferenciaDelSistema(false);
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'system');
    renderConProveedor();

    sistema.establecer(true);

    // En este camino `data-theme` **no cambia** — se queda en «system» y el repintado
    // lo hace el brazo `@media` de `tokens.generated.css` — así que el efecto con
    // dependencia `[theme]` no corre. Colgar la supresión de ese efecto, como dice la
    // letra de D16, dejaría este camino sin suprimir; de ahí que se cuelgue del
    // oyente de `matchMedia`, que es el otro sitio del proveedor donde el repintado
    // empieza.
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('system');
    expect(leerMarcador()).toBe('');

    // Los mismos dos fotogramas que el camino del control, y **aseverados uno a uno**:
    // tal y como estaba, este test pasaba también con un solo `requestAnimationFrame`,
    // así que el test que debía fijar el camino del sistema no fijaba lo único que
    // había que fijar en él. Hoy las dos llamadas comparten función y no pueden
    // divergir, pero el día que alguien las separe esto lo verá.
    fotograma.correr();

    expect(leerMarcador()).toBe('');

    fotograma.correr();

    expect(leerMarcador()).toBeNull();
  });
});

describe('R103 — las dos mitades de la supresión usan el mismo nombre', () => {
  // Las dos mitades viven en ficheros distintos y **ningún compilador las une**: el
  // marcador lo pone este proveedor y la regla que lo lee está escrita a mano en
  // `styles.css` (D16: no puede ir en el fichero generado). Si el nombre cambiase en
  // un sitio y no en el otro, el mecanismo quedaría verde y sin efecto ninguno — un
  // cambio de tema con cross-fade y nada en rojo. Esta aserción es lo único que ata
  // los dos nombres.
  it('`styles.css` apaga las transiciones mientras el marcador está puesto', () => {
    // Desde el cwd del paquete y no desde `import.meta.url`: en jsdom esa URL no es
    // de esquema `file:`, así que `readFileSync` la rechaza. Vitest corre con el cwd
    // en la raíz del paquete (`apps/web`), que es también como lo invoca turbo.
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

    const selector = `[${THEME_SWITCHING_ATTRIBUTE}]`;
    const indice = css.indexOf(selector);

    expect(indice, `«${selector}» no aparece en styles.css`).toBeGreaterThan(-1);

    const bloque = css.slice(indice, css.indexOf('}', indice));

    expect(bloque).toMatch(/transition:\s*none\s*!important/);
  });
});

describe('R104 — ninguna transición sin acotar en el árbol de componentes', () => {
  // La otra mitad de R103, y su criterio de aceptación es literalmente un `git grep`.
  // Nada más en el proyecto lo vigila: el escáner anti-hardcode mira colores y
  // dimensiones, no transiciones, así que un componente nuevo podría reintroducir la
  // utilidad sin acotar y los siete gates seguirían en verde. La aguja se compone de
  // dos trozos **a propósito**, para que este fichero no contenga la cadena que
  // prohíbe y el `git grep` del criterio siga saliendo vacío.
  const AGUJA = `transition-${'all'}`;

  it('no aparece en ningún fuente de `apps/web/src`', () => {
    const raiz = resolve(process.cwd(), 'src');

    const culpables = readdirSync(raiz, { recursive: true, encoding: 'utf8' })
      .filter((fichero) => /\.(ts|tsx|css)$/.test(fichero))
      .filter((fichero) => readFileSync(resolve(raiz, fichero), 'utf8').includes(AGUJA));

    expect(culpables).toEqual([]);
  });
});
