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

/**
 * El marcador que vive en `<html>` **sólo durante** el cambio de tema (R103, §8
 * punto 5). La regla que lo lee está en el `@layer base` de `styles.css`, que es
 * donde D16 la puso: no puede ir en `tokens.generated.css`, porque el generador es
 * dueño de ese fichero byte a byte y el gate de regeneración reportaría la edición
 * como obsoleta.
 */
export const THEME_SWITCHING_ATTRIBUTE = 'data-theme-switching';

/** La consulta que `tokens.generated.css` usa para el brazo «Sistema». */
const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * `matchMedia` puede no existir (SSR, un entorno de test pelado), y entonces la
 * respuesta honesta es «claro»: es el valor base de `:root`.
 */
const readSystemPrefersDark = (): boolean =>
  globalThis.matchMedia?.(PREFERS_DARK_QUERY).matches ?? false;

/**
 * Apaga las transiciones mientras el tema cambia (R103). Sin esto, R27 («cambio
 * instantáneo, sin cross-fade») y el punto 1 de §8 («transiciones de color de 150 ms
 * en hover y foco») se contradicen: lo que interpola al cambiar `data-theme` son
 * precisamente los colores, así que acotar `transition-*` no basta — por eso R103 y
 * R104 son las dos mitades de lo mismo y no una u otra.
 */
const suppressTransitionsForSwap = (): void => {
  const root = document.documentElement;

  root.setAttribute(THEME_SWITCHING_ATTRIBUTE, '');

  const drop = () => root.removeAttribute(THEME_SWITCHING_ATTRIBUTE);

  // **Dos fotogramas, y la razón está medida.** §8 punto 5 dice «suéltalo en el
  // fotograma siguiente», y con un solo `requestAnimationFrame` eso no suprime nada:
  // su callback corre *antes* del recálculo de estilo del fotograma, así que el
  // marcador ya no está cuando el navegador computa los colores nuevos y la
  // transición arranca igual — el mecanismo puesto y sin ningún efecto, con todos los
  // tests en verde. Medido en Chrome sobre una página aislada con las seis variantes:
  // sin supresión interpola; un rAF interpola también, tanto forzando el estilo
  // computado del root como forzando layout; y sólo suprimen el rAF **doble** y el
  // flush *después* de escribir el tema.
  //
  // Se toma el rAF doble por dos razones: no depende del orden de las escrituras — el
  // camino del sistema operativo no escribe ningún atributo tras el que flushear, así
  // que allí no hay «después» — y no fuerza un reflow sincrónico en cada cambio. El
  // marcador vive así el fotograma que pinta el cambio y se suelta en el siguiente,
  // unos 33 ms, que es lo que §8 pide de verdad: el tiempo que dura el cambio.
  //
  // Sin `requestAnimationFrame` (servidor, un entorno de test pelado) se suelta en el
  // acto: allí no hay transiciones que suprimir, y lo que no puede pasar nunca es que
  // el marcador sobreviva — entonces morirían en silencio todas las transiciones de
  // hover y foco de la aplicación.
  if (typeof globalThis.requestAnimationFrame === 'function') {
    globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(drop));
  } else {
    drop();
  }
};

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

    const onChange = (event: MediaQueryListEvent) => {
      // R103 por el camino del sistema operativo. Aquí `data-theme` no cambia: con el
      // tema en «Sistema» el repintado lo hace el brazo `@media` del CSS, así que el
      // efecto con dependencia `[theme]` no corre y la supresión tiene que colgarse
      // de este oyente — que es la razón por la que la letra de D16 («en el efecto
      // que ya escribe `data-theme`») no cubre este caso aunque su intención sí lo
      // pida. Se suprime incluso con un tema explícito, donde no hay repintado: un
      // fotograma sin transiciones no se ve, y la alternativa era una ref con el tema
      // que puede quedarse vieja.
      suppressTransitionsForSwap();
      setSystemPrefersDark(event.matches);
    };

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
    suppressTransitionsForSwap();
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
