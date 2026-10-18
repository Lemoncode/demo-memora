import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  persistTheme,
  THEME_ATTRIBUTE,
  THEME_BOOTSTRAP_SCRIPT,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  THEMES,
} from './theme';

afterEach(() => {
  // El orden importa: los dobles sobre el almacenamiento se retiran antes de
  // vaciarlo, o el propio `clear()` lanzaría.
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('readStoredTheme', () => {
  it('devuelve el tema guardado cuando el almacenamiento tiene un valor del vocabulario', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    expect(readStoredTheme()).toBe('dark');
  });

  it('cae en «Sistema» cuando no hay nada guardado', () => {
    expect(readStoredTheme()).toBe('system');
  });

  // El conjunto aceptado es exactamente los tres literales del vocabulario: ni una
  // variante de caja, ni un valor con espacios, ni un tema no expuesto, ni JSON.
  it.each([
    ['un tema fuera del vocabulario', 'matcha'],
    ['otro tema no expuesto', 'espresso'],
    ['una variante de caja', 'Dark'],
    ['mayúsculas', 'LIGHT'],
    ['espacios alrededor', ' dark '],
    ['la cadena vacía', ''],
    ['sólo espacios', '   '],
    ['una lista', 'light,dark'],
    ['JSON', '{"theme":"dark"}'],
    ['JSON con comillas', '"dark"'],
    ['la cadena null', 'null'],
    ['la cadena undefined', 'undefined'],
    ['un número', '0'],
    ['un booleano', 'true'],
  ])('cae en «Sistema» ante %s', (_caso, guardado) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, guardado);

    expect(readStoredTheme()).toBe('system');
  });

  // Las tres formas en que el almacenamiento puede no estar disponible: modo privado
  // (el acceso a la propiedad lanza), datos de sitio bloqueados (`getItem` lanza) y
  // un entorno sin `localStorage`. Ninguna puede propagar el error (R24).
  it.each([
    [
      'el acceso a window.localStorage lanza',
      () => {
        vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
          throw new DOMException('acceso denegado', 'SecurityError');
        });
      },
    ],
    [
      'getItem lanza',
      () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new DOMException('acceso denegado', 'SecurityError');
        });
      },
    ],
    [
      'no existe localStorage',
      () => {
        vi.stubGlobal('localStorage', undefined);
      },
    ],
  ])('cae en «Sistema» sin lanzar cuando %s', (_caso, romperAlmacenamiento) => {
    romperAlmacenamiento();

    expect(() => readStoredTheme()).not.toThrow();
    expect(readStoredTheme()).toBe('system');
  });
});

describe('persistTheme', () => {
  it.each(THEMES)('guarda «%s» de forma que readStoredTheme lo recupera', (tema) => {
    persistTheme(tema);

    expect(readStoredTheme()).toBe(tema);
  });

  // Mismo contrato que la lectura: una preferencia que no se puede guardar no puede
  // tumbar el cambio de tema. La pantalla cambia; sólo no sobrevive a la recarga.
  it.each([
    [
      'el acceso a window.localStorage lanza',
      () => {
        vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
          throw new DOMException('acceso denegado', 'SecurityError');
        });
      },
    ],
    [
      'setItem lanza por cuota',
      () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new DOMException('cuota excedida', 'QuotaExceededError');
        });
      },
    ],
    [
      'no existe localStorage',
      () => {
        vi.stubGlobal('localStorage', undefined);
      },
    ],
  ])('no lanza cuando %s', (_caso, romperAlmacenamiento) => {
    romperAlmacenamiento();

    expect(() => persistTheme('dark')).not.toThrow();
  });
});

describe('resolveTheme', () => {
  it.each([
    ['light', true, 'light'],
    ['light', false, 'light'],
    ['dark', true, 'dark'],
    ['dark', false, 'dark'],
  ] as const)(
    'con «%s» y prefiere-oscuro=%s pinta «%s», ignorando el sistema',
    (guardado, prefiereOscuro, esperado) => {
      expect(resolveTheme(guardado, prefiereOscuro)).toBe(esperado);
    },
  );

  it.each([
    [true, 'dark'],
    [false, 'light'],
  ] as const)(
    'con «Sistema» y prefiere-oscuro=%s pinta «%s»',
    (prefiereOscuro, esperado) => {
      expect(resolveTheme('system', prefiereOscuro)).toBe(esperado);
    },
  );

  // `stored` es `unknown` a propósito: llega del almacenamiento o del atributo del
  // DOM, y cualquiera de los dos puede traer basura. Todo lo no reconocido se
  // comporta como «Sistema», o sea sigue al sistema operativo (R24).
  it.each([
    ['nulo', null],
    ['indefinido', undefined],
    ['un tema no expuesto', 'matcha'],
    ['una variante de caja', 'System'],
    ['la cadena vacía', ''],
    ['espacios alrededor', ' system '],
    ['un número', 0],
    ['un booleano', false],
    ['un objeto', { theme: 'dark' }],
    ['un array', ['dark']],
    ['NaN', Number.NaN],
  ])('con %s sigue al sistema en lugar de lanzar', (_caso, guardado) => {
    expect(resolveTheme(guardado, true)).toBe('dark');
    expect(resolveTheme(guardado, false)).toBe('light');
  });
});

// El script de arranque corre en el documento servido antes de que exista bundle
// alguno, así que no puede importar nada: se ejecuta aquí tal cual viaja en el HTML.
const ejecutarScriptDeArranque = (): void => {
  new Function(THEME_BOOTSTRAP_SCRIPT)();
};

describe('THEME_BOOTSTRAP_SCRIPT', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  });

  it.each(THEMES)('pinta «%s» cuando es el tema guardado', (tema) => {
    persistTheme(tema);

    ejecutarScriptDeArranque();

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(tema);
  });

  // El conjunto que acepta el script tiene que ser el mismo que acepta `isTheme`, con
  // la misma batería hostil: si aquí fuese más ancho, el atributo llevaría al pintado
  // un valor que ningún selector de `tokens.generated.css` contempla.
  it('pinta «Sistema» cuando no hay nada guardado', () => {
    ejecutarScriptDeArranque();

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('system');
  });

  it.each([
    'matcha',
    'espresso',
    'Dark',
    'LIGHT',
    ' dark ',
    '',
    '   ',
    'light,dark',
    '{"theme":"dark"}',
    '"dark"',
    'null',
    'undefined',
    '0',
    'true',
  ])('pinta «Sistema» ante el valor guardado %o', (guardado) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, guardado);

    ejecutarScriptDeArranque();

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('system');
  });

  // Lo que no puede pasar con un almacenamiento inservible: ni que el script lance
  // (bloquea el `<head>`, así que lanzar deja la página sin pintar), ni que se salte
  // el `setAttribute` y deje `<html>` sin atributo.
  it.each([
    [
      'el acceso a localStorage lanza',
      () => {
        vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
          throw new DOMException('acceso denegado', 'SecurityError');
        });
      },
    ],
    [
      'getItem lanza',
      () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new DOMException('acceso denegado', 'SecurityError');
        });
      },
    ],
    [
      'no existe localStorage',
      () => {
        vi.stubGlobal('localStorage', undefined);
      },
    ],
  ])('pinta «Sistema» sin lanzar cuando %s', (_caso, romperAlmacenamiento) => {
    romperAlmacenamiento();

    expect(() => ejecutarScriptDeArranque()).not.toThrow();
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('system');
  });
});
