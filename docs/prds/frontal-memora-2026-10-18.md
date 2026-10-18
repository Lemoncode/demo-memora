# PRD: Frontal navegable de Memora sobre el diseño de Claude Design

**Date**: 2026-10-18
**Mode**: co-creation (diseño ya cerrado, arquitectura e integración por decidir)
**Status**: completed

## Problem Statement

La tarea #1 dejó el terreno montado (monorepo pnpm + Turborepo, `apps/web` con TanStack
Start + Tailwind 4 + shadcn, Mongo local, CI con cuatro gates) y **cero producto**: el
front es un «Hola Mundo» en una única ruta `/`.

Por otro lado existe ya un **diseño completo y cerrado** del producto, hecho con Claude
Design: el canvas «Memora · Pantallas»
(<https://claude.ai/code/artifact/fe98e863-c427-4eca-8a99-4d8d3cc31b79>), con **55
artboards en 11 grupos de flujo**, versión móvil (390×844) y escritorio (1440) de cada
pantalla, y artboards propios para los estados de carga, vacío, error, sin permisos y
tema oscuro. El canvas trae además su **design system `memora`**
(<https://claude.ai/artifact/55PWqQU14xwwAifgCqbgeb>) con `tokens.json`, `tokens.css`,
cinco temas y un mapeo explícito de los tokens Memora a los tokens semánticos de
shadcn.

Falta el frontal. Esta tarea entrega **las pantallas del diseño, navegables entre sí,
con datos mock**, y **nada de backend**: ni API real, ni Mongo, ni validación de
formularios, ni autenticación. El criterio de éxito es de revisión, no funcional:
alguien abre la app, recorre los 11 flujos pinchando, ve datos representativos y puede
visitar cada estado del diseño.

Lo que el acceso a datos sí tiene que cumplir es ser **sustituible**: la arquitectura de
PODS (skill `content-island-tanstack-start-pods-architecture`) pone un repositorio por
pod como única puerta de datos, y el día que exista backend solo cambia la capa `api/`
de cada pod.

Hallazgos del reconocimiento:

- `apps/web/src` tiene 9 ficheros: una ruta `/`, un `__root.tsx`, `styles.css` con los
  tokens por defecto de shadcn (`new-york` / `neutral`), y dos primitivos (`button`,
  `card`). No hay `src/pods/`, ni `src/common/`, ni `src/lib/`.
- `components.json` apunta a alias que **no existen** (`#/lib/utils`, `#/hooks`) — es
  exactamente la issue abierta **#5**. Los primitivos actuales no usan ese alias:
  importan `cn` del paquete `cn` y `Slot` del paquete único `radix-ui`.
- El `bundle.js` del design system es **JavaScript compilado**, no fuente React: sus
  componentes no se pueden copiar, hay que reconstruirlos.
- El canvas tiene **51 assets** subidos (≈5,1 MB): portadas de círculo y fotos de álbum
  de 50–230 KB, avatares de ~8 KB, y el logo.
- `docs/design-tokens.json` no existe: la capacidad de design tokens del harness está
  sin activar.
- El gate `lemony design-tokens contrast` **no tiene flags de excepción**: mide solo las
  parejas declaradas en el fichero de tokens, con su nivel WCAG y suelos por tema.

## User Stories

1. Como persona que revisa el producto, quiero abrir la app y aterrizar en el acceso,
   para empezar el recorrido por donde empieza el diseño.
2. Como persona que revisa el producto, quiero pulsar «Iniciar sesión» con el formulario
   vacío y entrar, para poder recorrer las pantallas sin tener que inventarme datos ni
   esperar a que haya backend.
3. Como persona que revisa el producto, quiero recorrer los 11 flujos del diseño
   pinchando en los sitios naturales (una tarjeta de círculo me lleva al círculo, un
   álbum al álbum, una foto a la foto), para comprobar que la navegación es la que el
   diseño promete.
4. Como persona que revisa el producto, quiero ver datos representativos —círculos con
   nombre y portada, álbumes con conteos, fotos de verdad, avatares— para juzgar las
   pantallas llenas y no cajas vacías.
5. Como persona que revisa el diseño, quiero poder visitar los estados de carga, vacío,
   error y sin permisos de cada pantalla desde la URL, para verificar los 55 artboards
   sin tocar código ni recompilar.
6. Como persona que revisa el diseño, quiero cambiar entre tema claro, oscuro y el del
   sistema desde el perfil, para comprobar los dos temas que el diseño expone.
7. Como persona que usa el móvil, quiero que todas las pantallas funcionen a 390 px con
   su navegación inferior, y en escritorio con su navegación lateral, porque el diseño
   define las dos y el producto es «móvil primero».
8. Como desarrollador que recoja esto cuando haya backend, quiero que cada pod tenga su
   repositorio como única puerta de datos y su mapeo api-model → ViewModel completo,
   para sustituir los datos mock cambiando solo la capa `api/`.
9. Como desarrollador, quiero que el diseño tenga una fuente de verdad en el repo
   (`docs/design-tokens.json`) con sus gates de validación y contraste, para que el
   siguiente que toque la UI no reinvente colores a mano.

## Product / UX Decisions

- **Las 18 rutas del diseño**, con los nombres de ruta que el propio índice del canvas
  declara:

  | Flujo                       | Rutas                                                              |
  | --------------------------- | ------------------------------------------------------------------ |
  | 1 · Acceso y registro       | `/login`, `/register`                                              |
  | 2 · Aceptar invitación      | `/invite/$token`                                                   |
  | 3 · Mis círculos            | `/circles`                                                         |
  | 4 · Crear círculo           | `/circles/new`                                                     |
  | 5 · Detalle de círculo      | `/circles/$circleId`                                               |
  | 6 · Crear álbum             | `/circles/$circleId/albums/new`                                    |
  | 7 · Álbum y cola de subida  | `/circles/$circleId/albums/$albumId`, `/uploads`                   |
  | 8 · Foto y etiquetas        | `…/albums/$albumId/photos/$photoId`, `…/photos/$photoId/tag`       |
  | 9 · Personas                | `/circles/$circleId/people`, `/circles/$circleId/people/$personId` |
  | 10 · Ajustes y perfil       | `/circles/$circleId/settings`, `/profile`                          |
  | 11 · Ayuda, privacidad, 404 | `/help`, `/privacy`, `*`                                           |

- **Sin sesión y sin guardas**. `/` redirige a `/login`; el botón de acceso navega a
  `/circles` aunque el formulario esté vacío; «cerrar sesión» vuelve a `/login`. Ninguna
  ruta comprueba nada: cualquier pantalla se abre por URL — porque el entregable es la
  navegación y las pantallas, y una guarda obligaría a «entrar» para revisar una
  pantalla suelta.
- **Sin validaciones**. Los formularios se pintan con sus estados de error tal como
  están en el diseño, pero el error es un escenario visitable, no el resultado de
  validar — porque validar es lógica de producto que llegará con su backend.
- **La persona que usa la app es un dato mock servido por un repositorio** (Sofía
  Martín y su avatar, los del diseño), no una constante incrustada — para que el día de
  la sesión real cambie en un solo sitio.
- **Temas: Claro, Oscuro y Sistema**, con el selector en `/profile`, porque es
  exactamente lo que el artboard `Profile-M` expone. En escritorio ese selector es un
  **menú**, no un grupo de botones (`Profile-D`). Los otros tres temas del DS —`matcha`,
  `caramelo`, `espresso`— **quedan fuera de la entrega**: no se exponen, y medirlos
  reveló que `espresso` tiene el botón primario a 3,20:1, así que dejarlos en el CSS
  sería dejar temas que fallan al alcance de cualquiera.
- **Los estados se visitan con un parámetro de búsqueda por ruta**: `?estado=<valor>`,
  con **vocabulario propio de cada ruta** (el del flujo de invitación no es el de un
  listado), y el repositorio mock devuelve ese escenario. El parámetro nombra un
  _estado_, nunca un breakpoint: una URL se abre a cualquier ancho. Es lo que permite
  revisar los 55 artboards navegando; el día del backend el parámetro desaparece y el
  estado pasa a venir de la respuesta.
- **Imágenes: los assets del propio diseño**, descargados a `apps/web/public/mock/` y
  servidos en local — fieles al artboard, sin depender de red en build, test ni CI. Se
  traen solo los referenciados por los artboards, no los 51.
- **Responsive, no dos implementaciones**. Cada pantalla es una sola, con la navegación
  inferior en móvil y lateral en escritorio, según los artboards `-M` y `-D`.
- **PWA fuera de alcance**. La tarjeta «Instala Memora» del perfil se pinta porque está
  en el diseño, pero sin manifest ni service worker, y su botón no hace nada.
- **Español incrustado, sin i18n** — el diseño es español de España, con _tú_ para las
  acciones y _vosotros_ para lo del grupo, y el copy literal de los artboards.

## Technical Decisions

- **Arquitectura PODS** (skill `content-island-tanstack-start-pods-architecture`): un pod
  por pantalla o grupo de pantallas en `apps/web/src/pods/`, con
  `{pod}.pod.tsx`, `{pod}.model.ts` (ViewModel), `{pod}.mapper.ts`,
  `{pod}.repository.ts`, `{pod}.business.ts`, `components/*.component.tsx` y
  `api/*.api-model.ts` + `api/*.api.ts`. Rutas finas: el `loader` llama al repositorio y
  nada más. Imports relativos dentro del pod, alias `#/` solo al cruzar frontera.
- **Los datos mock viven en `apps/web/src/common/mock-data/`**, en forma de respuesta de
  API (nombres de campo de backend, fechas ISO, códigos). El `api/` de cada pod lee de
  ahí y devuelve su propio api-model; el mapper del pod lo convierte en su ViewModel.
  Así no hay un solo import cross-pod, «Familia García» es el mismo círculo en las 18
  rutas, y el día del backend solo cambia el `api/`. Descartado dar fixtures propias a
  cada pod (pantallas que se contradicen) y descartado un `packages/mock-api` (otro
  paquete y otro gate para datos provisionales).
- **El shell de escritorio consume la lista de círculos, así que la Parte 1 siembra sus
  datos.** El rail de 264 px de `Profile-D` lleva una sección «Círculos» con cuatro filas
  con portada, y el shell es de la Parte 1 mientras que los círculos eran de la Parte 2.
  La Parte 1 mete esos cuatro círculos (nombre + portada, ninguna de las pantallas de la
  Parte 2) en el dataset compartido y el rail pinta la sección cuando hay círculos — lo
  que además reconcilia los dos artboards, porque el rail de `NotFound-D` no la tiene y
  pasa a ser la forma sin datos.
- **El mapeo api-model → ViewModel es completo**, no un cambio de nombres: fechas ISO a
  `Date` y a su forma mostrable («Hoy», «12 sep»), conteos a su cadena («12 álbumes ·
  1.240 fotos», con el punto de millar español), códigos de permiso a enums del front,
  rutas de imagen resueltas. Nada de esto se hace en un loader ni en un componente.
- **Tokens**: `docs/design-tokens.json` como fuente canónica, en el formato de tres
  niveles del harness, volcado desde el `tokens.json` del DS; el `tokens.css` del DS
  entra en `apps/web/src/styles.css` como proyección y sustituye a los tokens por
  defecto de shadcn. Se declaran los gates `design-tokens validate` y
  `design-tokens contrast` en `harness.config.yml` y en CI.
- **Contraste declarado por uso real**: las parejas de texto a AA 4,5:1, las de texto
  grande a 3:1, y los iconos accent sobre accent-soft **no se declaran como pareja de
  texto** porque el propio README del DS exige acompañarlos siempre de etiqueta visible.
  El único fallo real, `text-muted` sobre `bg-elevated` (4,34:1), se arregla oscureciendo
  ese `muted`. Descartado repintar el DS entero (el código dejaría de coincidir con el
  canvas) y descartado declarar todo y vivir con el gate en rojo (un gate rojo
  permanente deja de informar).
- **Componentes**: los primitivos se generan con el CLI de shadcn y se visten con los
  tokens Memora, que es lo que manda el README del DS. Los compuestos que shadcn no
  tiene (`BottomNav`, `SideNav`, `AlbumCard`, `AvatarGroup`, `FilterChip`, `EmptyState`,
  `Icon`, `Skeleton`) se escriben a mano en `apps/web/src/common/components/` sobre esos
  primitivos. **El `bundle.js` del DS no se usa**: es JS compilado y no hay fuente React
  que copiar.
- **Imports de shadcn adaptados a este repo**: `cn` del paquete `cn` y el paquete único
  `radix-ui`, no `@/lib/utils` ni `@radix-ui/react-slot`. Roza la issue **#5** (alias de
  `components.json` que no existen); se arregla lo que haga falta para que los
  componentes nuevos importen bien, sin absorber esa issue.
- **Iconos**: `lucide-react`, envueltos en un `Icon` común que traduce los nombres del DS
  (`album`, `arrowRight`, `chevronDown`, `heart`, `pin`, `shield`, `sparkles`, `tag`,
  `upload`, `users`…) a su equivalente de lucide.
- **Fuentes**: Inter + Plus Jakarta Sans por `<link>` a Google Fonts en `__root.tsx`,
  igual que los artboards. No afecta a build ni a CI.
- **La referencia de diseño no se copia al repo**: los 55 `.dc.html` son 380 KB de HTML
  generado que no compila. El `ui-handoff.md` de cada parte cita el artifact y el nombre
  exacto de artboard por pantalla y estado. Al repo entran `tokens.css`,
  `docs/design-tokens.json`, el logo y las imágenes mock.
- **Nada de `packages/db`, Mongo, el console-runner ni server functions de datos**: esta
  entrega no toca infraestructura.

## Testing Decisions

- **Lógica pura con test unitario**: cada mapper, cada repositorio y cada fichero
  `business`. Ahí está lo que de verdad puede romperse — fechas, conteos con formato
  español, enums, resolución de escenarios `?estado=`.
- **Un smoke test por ruta**: «esta ruta renderiza sin romperse», con Vitest + Testing
  Library, que es lo que el repo ya tiene montado.
- **Consecuencia aceptada explícitamente**: ningún test comprueba que pinchar lleva a la
  pantalla correcta, y ese es justamente el entregable. La navegación se verifica a mano
  en la revisión y por la lente de la UI Designer, no por la suite. Se eligió esta
  profundidad sobre la de «un test por pod con estados y navegación» para no convertir
  18 pantallas que aún van a cambiar en aserciones de marcado.
- Los cuatro gates del repo (`typecheck`, `format:check`, `test`, `build`) siguen
  valiendo, más los dos nuevos de tokens.

## Out of Scope

- Backend, API real, persistencia, Mongo, server functions de datos.
- Autenticación, sesión real, guardas de ruta, registro que registre.
- Validación de formularios y mensajes de error calculados.
- Subida real de ficheros: la cola de subida y sus barras de progreso son estado mock.
- Descarga real de fotos y de álbumes.
- Invitación por email o por enlace real, y la vista previa al compartir en un chat.
- PWA: manifest, service worker, instalación.
- i18n.
- Los temas `matcha`, `caramelo` y `espresso` como opción de interfaz.
- Las issues abiertas #3, #4, #6 y #7. De la #5 solo se roza lo imprescindible.

## Discarded Alternatives

- **Placeholders remotos (picsum/unsplash)** para las imágenes: cero bytes en el repo,
  pero la galería queda vacía sin red y CI pasa a depender de un tercero.
- **Placeholders generados (SVG con inicial)**: offline y ligeros, pero las pantallas de
  galería y de foto pierden casi todo su sentido frente al diseño.
- **Escenario global conmutable** para los estados: una sola palanca para demos, pero no
  permite ver un vacío en una pantalla y datos en otra.
- **Retardo y fallo simulados** en el API mock: los esqueletos salen solos, pero el error
  es impredecible y los tests y las demos se vuelven poco fiables.
- **Una sola tarea L1 con las 18 rutas**: menos ceremonia, pero un PR imposible de
  evaluar de una pasada.
- **Funciones de servidor de TanStack Start** para servir los datos mock: más realista en
  el flujo cliente-servidor, pero añade serialización y asincronía a 18 pantallas que aún
  no tienen backend.

## Assumptions

- El canvas y su design system son la fuente de verdad del diseño y **no se van a
  rediseñar** en esta tarea; si una pantalla no cuadra, se pregunta, no se inventa.
- Los artboards siguen accesibles desde el artifact durante toda la implementación.
- Los assets del canvas se pueden descargar uno a uno por su id (`/_blob/<id>`).
- El `tokens.json` del DS se puede volcar al formato de tres niveles del harness sin
  pérdida de valores.
- `?estado=` no choca con ningún parámetro de búsqueda real, porque todavía no hay
  ninguno.
- Las 18 rutas del índice del canvas son la lista completa: no falta ninguna pantalla por
  diseñar.

## Risks

- ~~**El contraste puede dar más sorpresas que las tres documentadas.**~~ **El riesgo se
  materializó, y la mitigación funcionó.** El README del DS nombra tres fallos; medir
  sacó **tres más** que no documenta: el borde en reposo de los campos (1,48:1), el botón
  primario de `espresso` (3,20:1) y el ítem activo del nav inferior en oscuro (3,02:1).
  Todos aparecieron en la Parte 1, antes de que hubiera una sola pantalla construida
  encima — que era exactamente para lo que se puso el volcado de tokens en la Parte 1.
- **Peso de los assets.** Las portadas van de 50 a 230 KB; traer demasiadas engorda el
  repo. Mitigación: solo las referenciadas, y revisar el total en el PR.
- **Fidelidad al artboard sin verificación visual automática.** No hay captura ni
  comparación de píxeles: la fidelidad la juzga la lente de la UI Designer leyendo el
  artboard. Es un juicio, no una medida.
- **El `?estado=` es superficie que habrá que retirar.** Si no se retira el día del
  backend, queda un parámetro que fuerza estados en producción. Mitigación: anotarlo como
  deuda explícita en el handoff de cada parte.
- **Los conteos y textos mock pueden contradecirse entre pantallas** si alguien añade
  datos fuera del dataset compartido. Mitigación: el dataset en `src/common/mock-data/`
  es el único sitio, y el gate de review lo mira.

## Open Points

Cerrados durante la definición de diseño de la Parte 1 (detalle en
`.claude/state/tasks/11/spec/ui-handoff.md`):

- ~~El volcado del `tokens.json` del DS al formato de tres niveles~~ — hecho y verificado:
  `docs/design-tokens.json`, `contrast` verde con 56 parejas.
- ~~El botón «Instalar» de la tarjeta de PWA~~ — se pinta y no hace nada. `Profile-D` lo
  zanjó: en escritorio la tarjeta es instructiva y su botón es «Enviarme el enlace», así
  que deshabilitarlo sería incoherente.

Abiertos:

- Si `Tag` en móvil es una ruta propia (`…/photos/$photoId/tag`) o una hoja inferior
  sobre la foto. El artboard `Tag-M` es pantalla completa y el `Tag-D` un diálogo: se
  cierra al construir la Parte 3.
- **Recuperar contraseña no tiene diseño.** «¿La has olvidado?» existe en los artboards
  de acceso pero no hay pantalla para ella en todo el canvas. En esta entrega el enlace
  apunta a su ruta futura y cae en el 404; la pantalla necesita su propio define. Queda
  por capturar como stub.

## Next Steps

El PRD se parte en tres tareas independientemente mergeables (ver la issue padre de
partición). La Parte 1 asienta tokens, temas, shell y el andamio de datos mock, de la que
dependen las otras dos.
