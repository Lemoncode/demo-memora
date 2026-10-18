import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import {
  DEFAULT_THEME,
  isTheme,
  persistTheme,
  resolveTheme,
  THEME_ATTRIBUTE,
  type PaintedTheme,
  type Theme,
} from './theme';

interface ThemeContextValue {
  /** El tema elegido: lo que marca el control. */
  theme: Theme;
  /** El modo que se está pintando — «Sistema» ya resuelto. */
  resolvedTheme: PaintedTheme;
  /** Elige el tema: escribe el atributo, lo persiste y actualiza el estado. */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const value = useContext(ThemeContext);

  if (value === null) {
    throw new Error('useTheme necesita un <ThemeProvider> por encima.');
  }

  return value;
};

/**
 * El tema que el script de pre-pintado dejó en `<html>`. El atributo es la única
 * fuente: volver a leer `localStorage` aquí crearía una segunda, y las dos podrían
 * discrepar (D11).
 */
const readThemeFromDocument = (): Theme => {
  if (typeof document === 'undefined') return DEFAULT_THEME;

  const attribute = document.documentElement.getAttribute(THEME_ATTRIBUTE);

  return isTheme(attribute) ? attribute : DEFAULT_THEME;
};

/** La consulta que `tokens.generated.css` usa para el brazo «Sistema». */
const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * `matchMedia` puede no existir (SSR, un entorno de test pelado), y entonces la
 * respuesta honesta es «claro»: es el valor base de `:root`.
 */
const readSystemPrefersDark = (): boolean =>
  globalThis.matchMedia?.(PREFERS_DARK_QUERY).matches ?? false;

const applyThemeToDocument = (theme: Theme): void => {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(readThemeFromDocument);
  const [systemPrefersDark, setSystemPrefersDark] =
    useState<boolean>(readSystemPrefersDark);

  // R21: «Sistema» tiene que seguir al sistema operativo en vivo. Los colores ya los
  // cambia el CSS solo (el brazo `@media` de `tokens.generated.css`), pero
  // `resolvedTheme` es estado de React y lo consumirán los dos controles para decir
  // qué modo está activo — así que la suscripción no es decorativa.
  useEffect(() => {
    const query = globalThis.matchMedia?.(PREFERS_DARK_QUERY);

    if (query === undefined) return;

    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);

    query.addEventListener('change', onChange);
    // La preferencia pudo cambiar entre el primer render y esta suscripción.
    setSystemPrefersDark(query.matches);

    return () => query.removeEventListener('change', onChange);
  }, []);

  // El primer render toma el atributo como verdad; esto lo devuelve al DOM. Cierra
  // dos huecos: que la hidratación revierta `<html>` al valor que serializó el
  // servidor, y que el script en línea no haya corrido (una CSP sin `unsafe-inline`)
  // o haya dejado un valor fuera del vocabulario — en ambos casos el DOM se quedaría
  // con un `data-theme` que ningún selector de `tokens.generated.css` reconoce.
  // En un cambio de tema es un no-op: `setTheme` ya lo escribió de forma síncrona.
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  // El atributo se escribe aquí, en el manejador, y no en un efecto: un efecto pasivo
  // corre después del pintado, así que el cambio se vería un fotograma tarde. R27 pide
  // un cambio instantáneo, y esto es una escritura síncrona con el gesto.
  const setTheme = useCallback((next: Theme) => {
    applyThemeToDocument(next);
    persistTheme(next);
    setThemeState(next);
  }, []);

  // Memoizado para que un re-render del padre (un cambio de ruta mueve `children`)
  // no invalide el contexto y vuelva a renderizar los controles sin que el tema haya
  // cambiado.
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: resolveTheme(theme, systemPrefersDark),
      setTheme,
    }),
    [theme, systemPrefersDark, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
