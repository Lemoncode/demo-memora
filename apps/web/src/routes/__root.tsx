import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_BOOTSTRAP_SCRIPT,
} from '#/common/theme/theme';
import { ThemeProvider } from '#/common/theme/theme-provider.component';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Memora' },
    ],
    links: [
      // Inter y Plus Jakarta Sans por `<link>` a Google Fonts, igual que los
      // artboards (R75). Los rangos de peso cubren los cinco que proyecta el fichero
      // de tokens (400/500/600/700/800); ambas familias son variables, así que es un
      // fichero por familia y no uno por peso.
      //
      // **Sin `preconnect`, y medido.** Los dos que recomienda Google Fonts estuvieron
      // aquí, pero React 19 iza los `<link rel="stylesheet">` por encima de ellos, así
      // que en el documento servido acaban *detrás* de la hoja que debían precalentar.
      // Medido en Chrome contra el build de producción con el dominio Network de CDP:
      // la petición de `css2` abre ella misma la conexión a `fonts.googleapis.com`
      // (`connectStart` 8,9 ms) y de los dos ficheros `.woff2` de `fonts.gstatic.com`
      // uno abre la conexión (`connectStart` 0) y el otro la reutiliza — o sea que
      // ninguno de los dos `preconnect` llegó a calentar nada. Se quitan en lugar de
      // dejar dos etiquetas inertes con un comentario que las excuse.
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=Plus+Jakarta+Sans:wght@400..800&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // El servidor no conoce la preferencia del navegador (D11: vive en
    // `localStorage`), así que sirve «Sistema» — el valor que ya pinta bien por
    // `prefers-color-scheme` gracias a `tokens.generated.css`, y el único honesto sin
    // leer nada del cliente. El script de abajo lo corrige antes del primer pintado
    // cuando hay un tema explícito guardado.
    //
    // El nombre del atributo se toma de `THEME_ATTRIBUTE` en lugar de escribirlo:
    // así el `<html>` servido y el script en línea no pueden desincronizarse.
    //
    // `suppressHydrationWarning`: el atributo que el cliente encuentra en el DOM es
    // el que puso el script, no el que serializó el servidor, así que `<html>`
    // divergir es el diseño (R22), no un fallo. **Medido, no supuesto**: con React
    // 19.3 y el `shellComponent` de Start, quitarlo no produce ningún aviso — se
    // comprobó en Chrome contra el build de producción. Se queda de todas formas,
    // porque la divergencia es real y deliberada y lo que no debe depender de que
    // una versión de React siga sin avisar; no cuesta nada.
    <html lang="es" {...{ [THEME_ATTRIBUTE]: DEFAULT_THEME }} suppressHydrationWarning>
      <head>
        {/*
          El único script en línea de la aplicación (D11). Lo que garantiza R22 es que
          esté en el `<head>` y sea bloqueante: el parseo se detiene aquí, el atributo
          queda fijado y sólo después se parsea el `<body>`, así que no hay destello
          del tema equivocado. Está escrito antes de `HeadContent`, pero no cuentes con
          esa posición: React 19 iza las hojas de estilo por encima y en el documento
          servido este script acaba al final del `<head>` — da igual, sigue
          ejecutándose antes de cualquier pintado. Su contenido se genera desde el
          vocabulario de `theme.ts`, no se escribe a mano.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {/*
          El proveedor va en la raíz y no en el shell `_app`: el tema tiene que valer
          en las cuatro rutas, también en las que se abren directamente por URL y
          quedan fuera del shell (R23), y los dos controles de `/profile` han de leer
          un único estado (R26).
        */}
        <ThemeProvider>{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
