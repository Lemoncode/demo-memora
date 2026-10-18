export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'system';

export const THEME_STORAGE_KEY = 'memora.theme';

/**
 * The accepted set is exactly {@link THEMES} — no trimming, no case folding, no
 * coercion. Anything else is «not one of the three» (R24) and resolves to the
 * default, so the set this guard accepts is the set the rest of the module handles.
 */
export const isTheme = (value: unknown): value is Theme =>
  typeof value === 'string' && (THEMES as readonly string[]).includes(value);

/** El atributo de `<html>` sobre el que pivota toda la proyección de tokens (R20). */
export const THEME_ATTRIBUTE = 'data-theme';

/**
 * El script que `__root.tsx` inyecta en línea en el `<head>` para fijar el tema
 * **antes del primer pintado** (R22, D11).
 *
 * No puede importar nada de este módulo: corre en el documento servido, antes de que
 * exista ningún bundle. Por eso duplica la lógica — pero **no los datos**: la clave,
 * el vocabulario, el atributo y el valor por omisión se interpolan de las constantes
 * de arriba, así que el conjunto que acepta el script es, por construcción, el mismo
 * que acepta {@link isTheme}. Añadir un tema al vocabulario lo añade a los dos.
 */
export const THEME_BOOTSTRAP_SCRIPT = [
  '(function () {',
  `  var theme = ${JSON.stringify(DEFAULT_THEME)};`,
  '  try {',
  `    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});`,
  `    if (${JSON.stringify([...THEMES])}.indexOf(stored) !== -1) theme = stored;`,
  '  } catch (error) {}',
  `  document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)}, theme);`,
  '})();',
].join('\n');

export type PaintedTheme = Extract<Theme, 'light' | 'dark'>;

/**
 * El modo que se pinta, a partir de un valor guardado de procedencia dudosa (el
 * almacenamiento o el atributo del DOM) y la preferencia del sistema. Nada que no
 * esté en {@link THEMES} se acepta: se comporta como «Sistema» (R21, R24).
 */
export const resolveTheme = (
  stored: unknown,
  systemPrefersDark: boolean,
): PaintedTheme => {
  const theme = isTheme(stored) ? stored : DEFAULT_THEME;

  if (theme !== 'system') return theme;

  return systemPrefersDark ? 'dark' : 'light';
};

export const persistTheme = (theme: Theme): void => {
  try {
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // R24 y el mismo trato deliberado que la lectura: modo privado, cuota agotada o
    // entorno sin almacenamiento. El tema sí cambia en la pantalla; lo único que se
    // pierde es que sobreviva a la recarga, y eso no justifica romper la interacción.
  }
};

export const readStoredTheme = (): Theme => {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);

    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    // R24, deliberado y no un error tragado: en modo privado el acceso a
    // `localStorage` lanza, con los datos de sitio bloqueados lanza `getItem`, y
    // fuera del navegador no existe. En las tres, el tema es «Sistema» y la lectura
    // no puede tumbar la página — no hay nada que informar ni que reintentar.
    return DEFAULT_THEME;
  }
};
