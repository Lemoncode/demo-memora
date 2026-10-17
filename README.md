# Memora

Monorepo de Memora. Esta entrega es **sólo infraestructura**: no hay superficie de
producto todavía (ver `docs/product/memora-brief.md` para el producto y
`docs/prds/` para los PRD).

## Qué hay dentro

| Ruta             | Qué es                                                      |
| ---------------- | ----------------------------------------------------------- |
| `apps/web`       | Front en TanStack Start + Tailwind + shadcn («Hola Mundo»)  |
| `packages/db`    | `@memora/db` — el único sitio que sabe conectar con Mongo   |
| `console-runner` | Herramienta de mantenimiento por consola (menú interactivo) |

## Requisitos

- **Node 24.16.0** — la versión está fijada en `.nvmrc` (`nvm use` / `fnm use`).
- **pnpm 10.19.0** — fijado en `packageManager`; con Corepack habilitado se usa solo.
- **Docker Desktop** arrancado, para los comandos `db:*`.

## Arranque rápido

```bash
pnpm install          # instala y enlaza todos los workspaces
cp .env.example .env  # MONGODB_URI=mongodb://localhost:27017/memora
pnpm db:up            # levanta MongoDB y espera a que esté healthy
pnpm dev              # front en http://localhost:3000
```

El `package.json` de la raíz es la **única puerta de entrada**: no hace falta entrar
en ningún subdirectorio.

## Base de datos

MongoDB 8 en Docker, sin credenciales, en `localhost:27017`, base de datos `memora`.

| Comando         | Qué hace                                                                   |
| --------------- | -------------------------------------------------------------------------- |
| `pnpm db:up`    | Arranca el contenedor en background y **espera** a que reporte healthy.    |
| `pnpm db:down`  | Para y elimina el contenedor. **Los datos sobreviven** (volumen nombrado). |
| `pnpm db:reset` | Elimina el contenedor **y su volumen**, y levanta uno nuevo: base vacía.   |

> `docker-compose.yml` es **sólo para desarrollo local**: la base no tiene
> credenciales. No lo copies a ningún entorno accesible desde fuera de tu máquina.

## Herramienta de consola

```bash
pnpm runner
```

Menú interactivo (se navega con las flechas) con cuatro opciones: comprobar la
conexión con Mongo, limpiar la base de datos, cargar datos de prueba y salir.

- **Limpiar base de datos** pide confirmación nombrando la base y por defecto
  responde **no**: pulsar Enter cancela.
- **Cargar datos de prueba** está reservada: imprime un `TODO` y no toca la base.
  Llegará con el modelo de dominio.

Lee `MONGODB_URI` del `.env` de la raíz si existe; si falta la variable, falla con un
mensaje explícito en vez de inventarse una URI por defecto.

## Gates

Los cuatro comandos que ejecuta CI en cada PR contra `main`
(`.github/workflows/ci.yml`), y los declarados en `harness.config.yml`:

```bash
pnpm typecheck     # tsc --noEmit en todos los workspaces
pnpm format:check  # Prettier
pnpm test          # Vitest
pnpm build         # build de producción
```

No hay linter por decisión explícita: TypeScript en modo estricto hace de red, así
que `typecheck` es el gate que carga el peso.

`pnpm format` arregla el formato. La suite es **hermética**: no necesita Docker, ni
un Mongo vivo, ni red.
