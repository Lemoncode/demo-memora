# Tasks — Infraestructura y estructura base del monorepo

> Source PRD: docs/prds/infra-monorepo-2026-10-17.md
> Requirements: `.claude/state/tasks/1/spec/requirements.md`
> Design: `.claude/state/tasks/1/spec/design.md`

Order matters: the root workspace is the tracer bullet — nothing else can be installed,
typechecked or run until it exists. Each group leaves something the human can run at the
checkpoint.

## Group 1 — Workspace root _(isolates the package-manager migration: it replaces the live npm install the harness depends on and is the hardest step to reverse)_

- [x] T1 — Turn the root into a private pnpm workspace: `pnpm-workspace.yaml`
      (`apps/*`, `packages/*`, `console-runner`), root `package.json` with
      `packageManager: pnpm@10.19.0` and `engines.node >=24.16.0 <25`, `.nvmrc` with
      `24.16.0`, `@lemoncode/lemony` kept as a root devDependency; delete
      `package-lock.json`, run `pnpm install`, commit `pnpm-lock.yaml`, and prove the
      harness launcher still resolves (`.claude/hooks/lib/lemony.sh --version` or an
      `emit`, which needs `node_modules/.bin/lemony`) (R1, R2, R3, R4, R5)
- [x] T2 — Add `turbo.json` (tasks `dev` persistent + uncached, `build`, `test`,
      `typecheck`) and the ten root scripts of the single entry point, with the
      workspace-spanning four delegating to Turborepo (R6, R7)
- [x] T3 — Add `tsconfig.base.json` with strict mode and wire `pnpm typecheck` so it
      runs `tsc --noEmit` per workspace and fails on any type error (R8, R9)
- [x] T4 — Add Prettier (`.prettierrc`), `.prettierignore` excluding `node_modules`,
      `.claude/`, `pnpm-lock.yaml` and build outputs, the `format` / `format:check`
      scripts, and extend `.gitignore` with `.env`, `.turbo/` and the build outputs so
      a build/test/dev cycle leaves `git status` clean (R10, R11, R12)

## Group 2 — Front end «Hola Mundo» _(isolates the stack integration the PRD calls the most fragile part of this delivery: TanStack Start + Tailwind + shadcn)_

- [x] T5 — Scaffold `apps/web` as a TanStack Start app in strict TypeScript, reachable
      through the root `dev`, `build` and `typecheck` scripts, declaring no dependency
      on `@memora/db` and touching no database (R14, R17, R20)
- [x] T6 — Configure Tailwind and initialise shadcn (`new-york`, `neutral`), install
      `Button` and `Card`, and render the «Hola Mundo» page inside a `Card` with a
      `Button`, using default tokens only — no theme switcher; if shadcn and the
      installed Tailwind disagree, pin the working combination and record the versions
      in `progress.md` (R13, R15, R16, R21)
- [x] T7 — Add the single front smoke test (Vitest + jsdom + Testing Library) that
      renders the page and asserts the greeting text and the `Button`, green with
      Docker stopped and no network (R19)
- [x] T8 — Prune the scaffolding noise: remove every demo route, asset, script and
      dependency the CLI left that the page, the tests, the gates or the build do not
      use (R18)

## Group 3 — Local MongoDB in Docker _(isolates the data surface: `db:reset` deletes the named volume, so the mistake here destroys local data)_ [risk: data-loss]

- [x] T9 — Add the root `docker-compose.yml`: single `mongo:8` service, `27017:27017`,
      no credentials, named volume at `/data/db`, a `ping` healthcheck, and the header
      comment marking it local-development-only; database `memora` at
      `mongodb://localhost:27017/memora` (R22, R23, R28)
- [x] T10 — Add `db:up` (detached, waiting for healthy) and `db:down` (container
      removed, volume preserved), each surfacing Docker's own error and exiting
      non-zero when the daemon is down or the port is bound (R24, R25, R27)
- [x] T11 — Add `db:reset`: remove the container **and** its volume, then bring up a
      fresh healthy container so the database comes back empty (R26)

## Group 4 — `packages/db`, the only door to Mongo _(isolates a new seam every future consumer will depend on: configuration resolution and the client factory)_

- [x] T12 — Create `packages/db` as `@memora/db`: `exports`/`types` pointing at
      `src/index.ts` (no build step, no `dist/`), the official `mongodb` driver and no
      ODM, typechecking on its own, and the only place in the repository that imports
      the driver (R29, R36, R37)
- [x] T13 — TDD `resolveMongoUri(env)`: returns the configured URI; throws an explicit
      error naming `MONGODB_URI` and `.env.example` when absent, empty or
      whitespace-only, with no default fallback (R30, R31)
- [x] T14 — TDD the client primitives against a double: `createMongoClient` with
      `serverSelectionTimeoutMS` ≤ 5000, `pingDatabase` returning the host and database
      reached, and `dropDatabase` operating on the URI-encoded database with no
      hard-coded name (R32, R33)
- [x] T15 — Add the versioned `.env.example` with
      `MONGODB_URI=mongodb://localhost:27017/memora` and confirm `.env` is ignored by
      git (R34)

## Group 5 — Console runner menu _(isolates the interactive entry point and its non-destructive operations; the destructive one is deliberately left to the next group)_

- [x] T16 — Create the `console-runner` workspace at the repository root and the root
      `runner` script running `tsx console-runner/src/main.ts` from the root, loading
      the root `.env` when it exists and not failing when it does not (R35, R46)
- [x] T17 — Build the `@inquirer/prompts` `select` menu with its four entries and the
      loop that returns to it after each operation; «Salir» closes the client and exits
      0, and a Ctrl+C (`ExitPromptError`) exits quietly with no stack trace
      (R38, R39, R44)
- [x] T18 — TDD the prompt-free `checkConnection` operation against a Mongo double —
      success reports host and database, failure reports the driver message plus the
      `pnpm db:up` hint and returns to the menu without crashing — and wire it to the
      menu (R40, R41, R45)
- [x] T19 — TDD `loadSeedData` returning the pending marker and printing a `TODO` with
      no database access at all, and the unresolved-`MONGODB_URI` path printing the
      configuration error and returning to the menu without connecting (R42, R43)

## Group 6 — Clean database _(isolates the only operation in the delivery that destroys data, one keystroke away from the connection check)_ [risk: data-loss]

- [x] T20 — TDD the prompt-free `cleanDatabase(deps, confirmed)` operation: confirmed ⇒
      `dropDatabase` called exactly once and the outcome reported; declined ⇒ no method
      called on the client double and a cancelled marker returned; a driver failure ⇒
      reported, runner still usable (R47, R49, R50, R51)
- [x] T21 — Wire the operation to the menu behind an `@inquirer/prompts` `confirm` that
      names the target database and defaults to no, so Enter cancels (R48)

## Group 7 — CI, declared gates and the real-run verification _(closes the delivery: the gates the harness reads, the documentation a fresh clone needs, and the only proof the infrastructure actually runs)_

- [x] T22 — Add `.github/workflows/ci.yml` running on pull requests to `main`: pnpm
      install `--frozen-lockfile` with the store cached, Node from `.nvmrc` and pnpm
      from `packageManager`, then `typecheck`, `format:check`, `test` and `build`, with
      no step allowed to swallow a red gate (R52, R53, R54)
- [x] T23 — Declare `gates:` in `harness.config.yml` as exactly `typecheck`,
      `format:check`, `test`, `build`, leaving `merge.allow_no_checks` at its default
      `false`, and confirm the whole suite is hermetic (green with Docker stopped and
      no network) (R55, R56)
- [x] T24 — Write the `README.md` quickstart: `pnpm install`, `db:up` / `db:down` /
      `db:reset`, `dev`, `runner` and the four gate commands (R57)
- [x] T25 — Run the manual real-run verification and record its outcome in
      `progress.md`: `pnpm db:up` → `pnpm runner` → «check connection» green →
      `pnpm dev` → the «Hola Mundo» page loads in a browser → `pnpm db:down`; a green
      suite alone is not evidence the infrastructure runs (R58, R59)
