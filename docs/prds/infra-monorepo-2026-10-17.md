# PRD: Infraestructura y estructura base del monorepo

**Date**: 2026-10-17
**Mode**: validation
**Status**: completed

## Problem Statement

Memora (ver `docs/product/memora-brief.md`) no tiene todavía ni una línea de código de
producto: el repositorio contiene únicamente el harness Lemony y un `README.md` vacío.
Antes de poder construir cualquier funcionalidad del MVP (registro, círculos, álbumes,
fotos) hace falta un terreno de trabajo: un monorepo con el proyecto front, una base de
datos local reproducible y una herramienta de mantenimiento desde consola.

Esta tarea entrega ese terreno y **nada de producto**. El criterio de éxito es
operativo, no funcional: alguien que clona el repositorio puede levantar la base de
datos, arrancar el front y ejecutar el runner de mantenimiento con comandos del
`package.json` raíz, y el PR pasa los gates mecánicos.

Hallazgos del reconocimiento del entorno:

- Repo `Lemoncode/demo-memora`, limpio, sin código previo ni `CLAUDE.md` / `CONTEXT.md`.
- Node v24.16.0, npm 12.0.2, **pnpm 10.19 ya disponible**.
- Docker 27.3.1 + Compose v2.29 operativos.
- `gh` autenticado; las etiquetas del harness existen en el repo.
- No hay CI: con `merge.allow_no_checks: false` en `harness.config.yml`, el gate de
  merge preguntaría a un humano en cada PR mientras no haya checks.

## User Stories

1. Como desarrollador que acaba de clonar el repositorio, quiero instalar dependencias
   con un solo comando y tener todos los paquetes del monorepo enlazados, para empezar
   a trabajar sin configuración manual.
2. Como desarrollador, quiero levantar MongoDB en local con un comando del
   `package.json` (`pnpm db:up`), para no tener que instalar Mongo en mi máquina ni
   recordar flags de Docker.
3. Como desarrollador, quiero poder tirar la base de datos y volver a empezar de cero
   (`pnpm db:reset`), para probar desde un estado limpio.
4. Como desarrollador, quiero arrancar el front con `pnpm dev` y ver una página «Hola
   Mundo» que use un componente de shadcn, para confirmar que la cadena TanStack Start
   → Tailwind → shadcn funciona de punta a punta.
5. Como desarrollador, quiero lanzar la herramienta de consola con `pnpm runner` y ver
   un menú de operaciones de mantenimiento, para tener un sitio donde ir añadiendo
   tareas de administración a medida que crezca el proyecto.
6. Como desarrollador, quiero que el runner compruebe la conexión a Mongo y pueda
   limpiar la base de datos, para verificar que la infra está viva y para reiniciar mi
   entorno de pruebas.
7. Como desarrollador, quiero ver en el runner la opción de cargar datos de prueba
   marcada explícitamente como pendiente, para saber que el hueco existe y está
   reservado, sin que finja hacer algo.
8. Como desarrollador, quiero que cada PR ejecute typecheck, formato, tests y build en
   CI, para que no entre a `main` nada que no compile.

## Product / UX Decisions

- **Superficie de producto en esta entrega**: ninguna. El front es un «Hola Mundo» —
  porque el objetivo es validar la cadena de herramientas, no diseñar pantallas.
- **Tema claro / oscuro**: fuera de esta entrega, aunque esté en el MVP — porque
  implica decisiones de diseño (paleta, ubicación del selector) que merecen su propia
  tarea con su fase de diseño, en vez de colarse en el scaffolding.
- **UX del runner**: menú interactivo con flechas (no flags de línea de comandos) —
  porque es una herramienta de mantenimiento humano y se quiere descubrible: entras y
  ves qué operaciones hay sin leer documentación.
- **Operación destructiva**: «Limpiar base de datos» pide confirmación explícita antes
  de ejecutar el `dropDatabase` — porque es irreversible y estará a una tecla de la
  opción de comprobar la conexión.
- **La opción de datos de prueba no se oculta**: aparece en el menú e imprime un `TODO`
  — porque un hueco señalizado comunica la intención; una opción ausente parece olvido.

## Technical Decisions

- **Monorepo**: Turborepo con pnpm workspaces — porque es la combinación estándar con
  este stack, y los filtros `--filter` y el enlazado estricto de pnpm evitan
  dependencias fantasma que compilan en local y revientan en CI.
- **Gestor de paquetes**: pnpm (ya instalado, 10.19), fijado con el campo
  `packageManager` en el `package.json` raíz.
- **Estructura**:

  ```
  demo-memora/
  ├─ apps/web/            TanStack Start + TypeScript + Tailwind + shadcn
  ├─ console-runner/      CLI de mantenimiento (en la raíz, por petición explícita)
  ├─ packages/db/         cliente Mongo + resolución de configuración (compartido)
  ├─ docker-compose.yml
  ├─ turbo.json
  └─ pnpm-workspace.yaml
  ```

  `console-runner` vive en la raíz y no en `apps/` por petición explícita; es un
  workspace de pnpm como cualquier otro.

- **Acceso a datos**: driver oficial `mongodb` con tipado genérico de colecciones, sin
  ODM — porque no añade capa intermedia, no pelea con TypeScript estricto y no oculta
  lo que se envía a Mongo. La validación de forma se hará con zod en la frontera
  (server functions), que es donde de verdad hace falta.
- **`packages/db` es el único sitio que sabe conectar a Mongo**: expone el cliente y la
  resolución de `MONGODB_URI`, y lo consumen tanto las server functions del front como
  el runner — porque cuando lleguen los modelos de dominio ya tienen casa y no hay que
  refactorizar dos consumidores.
- **API**: sin proyecto de API separado; la lógica de servidor irá en **server
  functions de TanStack Start** — por petición explícita.
- **Mongo local**: imagen `mongo:8` vía Docker Compose, puerto 27017, **sin
  credenciales**, con volumen nombrado para que los datos sobrevivan a `db:down`. Base
  de datos `memora`, URI `mongodb://localhost:27017/memora` — porque la fricción cero
  para arrancar pesa más que parecerse a producción en un entorno local.
- **Configuración**: `MONGODB_URI` por variable de entorno, con `.env` ignorado por git
  y `.env.example` versionado; `packages/db` falla de forma explícita si falta.
- **Ejecución del runner**: `tsx` directamente sobre TypeScript, sin paso de build —
  porque es una herramienta de desarrollo y un build intermedio sólo añade latencia.
- **Prompts del runner**: `@inquirer/prompts` — porque es el estándar maduro para menús
  interactivos en Node y su API por funciones se testea bien.
- **Calidad de código**: Prettier para formato, **sin linter**; TypeScript en modo
  estricto hace de red. **Consecuencia asumida y explícita**: `typecheck` pasa a ser el
  gate mecánico que carga el peso, y los errores que detectaría un linter (hooks mal
  usados, promesas sin `await`) quedan para la revisión humana.
- **CI**: workflow de GitHub Actions en cada PR — install con pnpm (cacheado),
  `typecheck`, `format:check`, `test` y `build` — porque el gate de merge del harness
  necesita un verde real que comprobar, y sin él pregunta a mano en cada PR.
- **Gates declarados**: `typecheck`, `format:check`, `test`, `build` en la clave
  `gates:` de `harness.config.yml`, para que el Reviewer los exija en su ledger.
- **Node**: versión fijada con `.nvmrc` y `engines` en el `package.json` raíz.
- **Scripts del `package.json` raíz** (única puerta de entrada): `dev`, `build`,
  `test`, `typecheck`, `format`, `format:check`, `db:up`, `db:down`, `db:reset`,
  `runner`.
- **shadcn**: estilo `new-york`, color base `neutral`, con `Button` y `Card` instalados
  y usados en la página «Hola Mundo» para demostrar que la cadena de estilos aplica.

## Testing Decisions

- **Runner (lógica)**: Vitest. Las acciones se escriben desacopladas de los prompts
  (una función por operación) y se testean contra un doble del cliente de Mongo: la
  acción de limpiar invoca `dropDatabase`; la acción de datos de prueba devuelve su
  marca de pendiente; la confirmación denegada **no** borra nada.
- **`packages/db` (configuración)**: Vitest. Resolución de `MONGODB_URI` — valor
  presente, variable ausente (error explícito, no caída silenciosa).
- **Front**: un único smoke test de que la página «Hola Mundo» renderiza. No se testea
  estilo ni layout.
- **Suite hermética**: los tests **no** requieren Docker ni un Mongo vivo — porque una
  suite que depende de servicios externos se vuelve frágil y lenta justo cuando más se
  usa.
- **Verificación de la infra real**: manual y explícita en la definición de terminado —
  `pnpm db:up`, `pnpm runner` → comprobar conexión en verde, `pnpm dev` → la página
  carga. Es lo único que esta entrega hace de verdad y la suite no lo cubre.

## Out of Scope

- Modelo de dominio del MVP (usuarios, círculos, álbumes, fotos, personas/etiquetas) y
  cualquier esquema de colección.
- Generación de datos semilla reales, incluido el usuario `admin@email.com` con su
  contraseña y los usuarios fake: la opción del menú existe pero imprime un `TODO`.
- Autenticación, sesiones, registro e inicio de sesión.
- Almacenamiento de binarios de las fotos (disco local / MinIO / Cloudinary) y subida
  de ficheros.
- Tema claro / oscuro / sistema y cualquier decisión de diseño visual.
- PWA e instalabilidad en la pantalla de inicio.
- Despliegue, entornos remotos, Mongo gestionado, credenciales de producción.
- Proyecto de API separado.
- Linter.

## Discarded Alternatives

- **npm workspaces**: descartado porque el hoisting plano invita a dependencias
  fantasma y la ergonomía de filtrado es peor; pnpm ya estaba instalado.
- **Mongoose**: descartado porque añade una capa de abstracción con su propio tipado
  que pelea con TypeScript estricto, y sus modelos globales molestan con el hot-reload.
- **Prisma con MongoDB**: descartado porque su conector exige replica set (complica el
  contenedor), no cubre todo Mongo y añade un paso de generación al build.
- **Sembrar el dominio completo ahora**: descartado porque el modelo nacería sin UI que
  lo valide — acertar a medias y refactorizar cuesta más que esperar.
- **Decidir ya el almacenamiento de fotos**: descartado porque es una decisión de
  arquitectura con peso propio y no cabe dentro de una tarea de scaffolding.
- **Runner enteramente simulado (todo `TODO`)**: descartado porque dejaría la infra sin
  verificar; limpiar la base de datos no necesita modelo de dominio y sí demuestra que
  la cadena funciona.
- **Mongo con credenciales / con mongo-express**: descartados para reducir fricción de
  arranque y contenedores en marcha; se puede añadir cuando haya datos que inspeccionar.
- **ESLint + Prettier** y **Biome**: descartados por decisión explícita del usuario a
  favor de sólo Prettier (ver la consecuencia asumida en Decisiones Técnicas).
- **Sin CI** y **sin CI con `allow_no_checks: true`**: descartados porque dejan entrar a
  `main` código que no compila, o desactivan una salvaguarda de forma permanente.
- **Tema oscuro en el esqueleto**: descartado para esta entrega porque convierte el
  scaffolding en una tarea de diseño.

## Assumptions

- La versión actual de shadcn soporta la versión de Tailwind que instale TanStack
  Start; si no, se fija la combinación que sí funciona (y se anota en el PR).
- Puerto 27017 libre en la máquina de desarrollo; si hay un Mongo local en marcha, se
  resuelve cambiando el puerto publicado en `docker-compose.yml` y la `MONGODB_URI`.
- Docker Desktop está arrancado cuando se usan los scripts `db:*`.
- La lógica de servidor con server functions será suficiente para el MVP; no se
  necesitará un servicio de API separado.

## Risks

- **Scaffolding generado que nadie revisa de verdad**: los CLI de creación de proyectos
  dejan ficheros de ejemplo y dependencias que no se usan; si no se limpian, el repo
  arranca con ruido que se arrastra durante meses.
- **Versiones del stack en movimiento**: TanStack Start, Tailwind y shadcn evolucionan
  rápido y su integración mutua es la parte más frágil de esta entrega.
- **Sin linter**: errores que un linter detecta en frío llegarán a la revisión humana o
  a producción; el riesgo crece cuando entre más gente al repo.
- **El hueco del seed se queda hueco**: una opción que imprime `TODO` puede vivir ahí
  mucho tiempo; conviene que la tarea del modelo de dominio la retome pronto.
- **La base de datos sin credenciales** es cómoda en local y peligrosa si el mismo
  compose se copia hacia un entorno accesible desde fuera.

## Open Points

- [ ] Modelo de dominio del MVP y datos semilla reales (usuario `admin@email.com` /
      `test` + usuarios fake + círculos, álbumes y fotos de prueba).
- [ ] Almacenamiento de los binarios de las fotos: disco local, MinIO o un servicio
      gestionado.
- [ ] Estrategia de autenticación y sesiones.
- [ ] Tema claro / oscuro / sistema y dirección visual del producto.
- [ ] PWA e instalabilidad.
- [ ] Despliegue y entorno remoto (incluido el Mongo gestionado).

## Next Steps

- [ ] Hand off to the Spec Author (`prd-to-spec`) to turn this PRD into a spec.
- [ ] Declarar los gates en `harness.config.yml` como parte de la implementación.
- [ ] Abrir la tarea del modelo de dominio + datos semilla cuando esta cierre.
