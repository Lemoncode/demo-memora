# Requirements — Infraestructura y estructura base del monorepo

> Source PRD: docs/prds/infra-monorepo-2026-10-17.md
> Task: #1 — branch `harness/1-infra-monorepo`

Scope note: this delivery is **infrastructure only**. No product surface, no domain
model, no auth. The success criterion is operational: a fresh clone can bring up the
database, start the front and run the maintenance runner from root `package.json`
scripts, and the PR passes the mechanical gates.

## A. Monorepo root — one install, one entry point (US1)

- **R1** (ubiquitous): The repository root shall be a private pnpm workspace whose
  `pnpm-workspace.yaml` declares `apps/*`, `packages/*` and `console-runner` as
  workspace packages.
- **R2** (ubiquitous): The root `package.json` shall pin the package manager with
  `packageManager: "pnpm@10.19.0"` and declare the supported Node version in `engines`
  (`node: ">=24.16.0 <25"`), matched by a committed `.nvmrc` holding `24.16.0`.
- **R3** (event): When `pnpm install` is run at the repository root, the system shall
  install and link every workspace package's dependencies in a single command, with no
  further manual configuration.
- **R4** (ubiquitous): After the migration the repository shall contain exactly one
  lockfile — `pnpm-lock.yaml` — and no `package-lock.json`.
- **R5** (ubiquitous): The harness CLI shall stay resolvable at
  `<repo-root>/node_modules/.bin/lemony` after a pnpm install, because
  `.claude/hooks/lib/lemony.sh` resolves that exact path.
- **R6** (ubiquitous): The root `package.json` shall be the only entry point and expose
  exactly these scripts: `dev`, `build`, `test`, `typecheck`, `format`, `format:check`,
  `db:up`, `db:down`, `db:reset`, `runner`.
- **R7** (event): When one of the workspace-spanning root scripts (`dev`, `build`,
  `test`, `typecheck`) is run, the system shall delegate the work to Turborepo through
  `turbo.json`, not to a hand-written loop over directories.
- **R8** (ubiquitous): Every workspace package shall compile under TypeScript strict
  mode (`strict: true`) from a shared root `tsconfig.base.json`.
- **R9** (event): When `pnpm typecheck` is run, the system shall run `tsc --noEmit` for
  every workspace and exit non-zero if any workspace reports a type error.
- **R10** (event): When `pnpm format:check` is run, the system shall verify Prettier
  formatting across the project's own tracked files and exit non-zero if any file is
  unformatted.
- **R11** (ubiquitous): The Prettier scope shall exclude vendor and generated paths —
  `node_modules`, `.claude/`, `pnpm-lock.yaml`, build outputs and caches — so a harness
  vendor update can never fail the format gate.
- **R12** (event): When `pnpm build`, `pnpm test` or `pnpm dev` has been run,
  `git status --porcelain` shall report no new untracked and no modified tracked files
  (every build output and cache is gitignored).

### Acceptance criteria

- [ ] A fresh clone + `pnpm install` + `pnpm typecheck` + `pnpm test` + `pnpm build`
      succeeds with no step outside the root `package.json`.
- [ ] `pnpm-lock.yaml` is committed; `package-lock.json` is gone from the worktree and
      from the index.
- [ ] `.claude/hooks/lib/lemony.sh emit …` still works after the install (the launcher
      finds the local bin).
- [ ] `git status --porcelain` is empty after a full `build` + `test` + a `dev` session.

## B. Front end — «Hola Mundo» proving the TanStack Start → Tailwind → shadcn chain (US4)

- **R13** (ubiquitous): `apps/web` shall be a TanStack Start application in TypeScript
  strict mode, with Tailwind configured and shadcn initialised with style `new-york`
  and base colour `neutral`.
- **R14** (event): When `pnpm dev` is run, the system shall serve `apps/web` on a local
  port and its root route shall render the «Hola Mundo» page.
- **R15** (ubiquitous): The «Hola Mundo» route shall render its content inside a shadcn
  `Card` and shall include a shadcn `Button`, so the styling chain is demonstrably
  applied end to end.
- **R16** (ubiquitous): The page shall use the shadcn/Tailwind default tokens only — no
  theme switcher, no dark-mode toggle, no custom palette (deferred by the PRD).
- **R17** (event): When `pnpm build` is run, the system shall produce a production build
  of `apps/web` and exit zero.
- **R18** (ubiquitous): The repository shall contain no file, route, asset, script or
  dependency left behind by a scaffolding CLI that is not used by the «Hola Mundo»
  page, the tests, the gates or the build.
- **R19** (event): When the front smoke test runs, it shall render the «Hola Mundo»
  route component and assert both the greeting text and the presence of the shadcn
  `Button`, without Docker, a live Mongo or network access.
- **R20** (ubiquitous): The front end shall perform no database access in this delivery,
  and `apps/web` shall declare no dependency on `@memora/db`.
- **R21** (unwanted): If the current shadcn release is incompatible with the Tailwind
  version TanStack Start installs, then the implementation shall pin the exact
  combination that works and state the pinned versions in `progress.md` and the PR
  description, instead of leaving a broken or half-working styling chain.

### Acceptance criteria

- [ ] `pnpm dev` serves a page showing the greeting inside a `Card` with a styled
      `Button` (Tailwind classes visibly applied).
- [ ] `pnpm test` runs the smoke test green with Docker stopped and no network.
- [ ] `apps/web/package.json` lists no unused dependency and no `@memora/db`.

## C. MongoDB in Docker — reproducible local database (US2, US3)

- **R22** (ubiquitous): `docker-compose.yml` at the repository root shall define a
  single service built from image `mongo:8`, publishing port `27017`, with no
  credentials, a **named volume** mounted at `/data/db`, and a healthcheck that reports
  the server as ready.
- **R23** (ubiquitous): `docker-compose.yml` shall carry a header comment stating it is
  for local development only — no credentials, never for an externally reachable
  environment.
- **R24** (event): When `pnpm db:up` is run, the system shall start the Mongo container
  detached and return only once the container reports healthy.
- **R25** (event): When `pnpm db:down` is run, the system shall stop and remove the
  container while **preserving** the named volume, so the data survives.
- **R26** (event): When `pnpm db:reset` is run, the system shall remove the container
  **and its named volume** and then start a fresh healthy container, so the database
  comes back empty.
- **R27** (unwanted): If the Docker daemon is not running, or port 27017 is already
  bound, then the `db:*` script shall surface Docker's own error message unchanged and
  exit non-zero — no masking, no retry loop, no silent success.
- **R28** (ubiquitous): The database name shall be `memora` and the canonical local URI
  `mongodb://localhost:27017/memora`.

### Acceptance criteria

- [ ] `pnpm db:up` → `docker compose ps` shows the service healthy.
- [ ] Data written between `db:up` and `db:down` is still there after `db:up` again.
- [ ] After `pnpm db:reset` the `memora` database is empty.
- [ ] With Docker stopped, `pnpm db:up` exits non-zero and prints Docker's error.

## D. `packages/db` — the only place that knows how to reach Mongo (technical decision)

- **R29** (ubiquitous): `packages/db`, published in the workspace as `@memora/db`, shall
  be the only location in the repository that resolves `MONGODB_URI` or constructs a
  Mongo client; no other workspace shall import the `mongodb` driver directly.
- **R30** (ubiquitous): `@memora/db` shall expose a pure resolver
  (`resolveMongoUri(env)`) that returns the configured URI for a given environment
  record, without reading global state itself.
- **R31** (unwanted): If `MONGODB_URI` is absent, empty or whitespace-only in the given
  environment, then the resolver shall throw an explicit error naming the variable and
  pointing at `.env.example`, and shall **not** fall back to any default URI.
- **R32** (ubiquitous): `@memora/db` shall expose a client factory
  (`createMongoClient(uri)`) that applies a server-selection timeout of at most
  5000 ms, so an unreachable server fails fast instead of hanging on the driver's
  default.
- **R33** (ubiquitous): `@memora/db` shall expose the two maintenance primitives the
  runner needs — a connectivity check (`ping`) and a database drop — operating on the
  database encoded in the URI, with no hard-coded database name.
- **R34** (ubiquitous): `.env.example` shall be versioned at the repository root with
  `MONGODB_URI=mongodb://localhost:27017/memora`, and `.env` shall be gitignored.
- **R35** (event): When an entry point starts, the system shall load the
  repository-root `.env` into the process environment if the file exists, and shall not
  fail when it is absent — the missing-variable failure of R31 is the only
  configuration failure path.
- **R36** (ubiquitous): `@memora/db` shall be consumed as TypeScript source (no build
  step, no emitted `dist/`) and shall typecheck on its own via `pnpm typecheck`.
- **R37** (ubiquitous): The driver shall be the official `mongodb` package with generic
  collection typing; no ODM (no Mongoose, no Prisma) shall be added.

### Acceptance criteria

- [ ] A unit test proves `resolveMongoUri` returns the value when present.
- [ ] A unit test proves the absent/empty variable throws, and the message names
      `MONGODB_URI`.
- [ ] `grep` for `from 'mongodb'` outside `packages/db` returns nothing.

## E. Console runner — discoverable maintenance menu (US5, US7)

- **R38** (event): When `pnpm runner` is run, the system shall display an interactive
  arrow-key menu offering exactly: check Mongo connection, clean database, load seed
  data, exit — requiring no command-line flags.
- **R39** (event): When an operation finishes, the system shall return to the menu, and
  when `exit` is chosen it shall close any open Mongo client and exit with code 0,
  leaving no hanging process.
- **R40** (event): When «check connection» is chosen, the system shall connect with the
  resolved URI, issue a `ping`, and report success naming the host and database it
  reached.
- **R41** (unwanted): If the connection or `ping` fails (server down, timeout), then the
  system shall report the failure with the driver's message plus a hint to run
  `pnpm db:up`, return to the menu, and not crash with an unhandled-exception stack
  trace.
- **R42** (unwanted): If `MONGODB_URI` cannot be resolved when an operation needs it,
  then the runner shall print that explicit configuration error (R31) and return to the
  menu without attempting a connection.
- **R43** (event): When «load seed data» is chosen, the system shall print a message
  marking the operation as pending (`TODO`), perform **no** database access, and return
  a pending result marker — it shall never report work it did not do.
- **R44** (unwanted): If the user interrupts a prompt (Ctrl+C), then the runner shall
  terminate quietly — no unhandled-exception stack trace — closing any open client.
- **R45** (ubiquitous): Each runner operation shall be a function independent of the
  prompt layer, receiving its Mongo client/db as a parameter, so it can be tested
  against a double.
- **R46** (ubiquitous): The runner shall be executed with `tsx` directly over
  TypeScript, with no build step.

### Acceptance criteria

- [ ] `pnpm runner` shows the four-entry menu and navigates with arrow keys.
- [ ] With Mongo down, «check connection» reports the failure and the menu is still
      usable.
- [ ] «Load seed data» prints a `TODO` and the test proves no client method was called.
- [ ] Unit tests cover every operation function against a Mongo double.

## F. Clean database — the destructive operation (US6)

- **R47** (event): When «clean database» is chosen, the system shall first ask for an
  explicit confirmation that names the target database, before touching anything.
- **R48** (ubiquitous): The confirmation prompt shall default to **no**, so proceeding
  requires a deliberate keystroke.
- **R49** (state+event): While the confirmation has been accepted, the system shall call
  `dropDatabase` on the database resolved from the URI and report the outcome.
- **R50** (unwanted): If the confirmation is declined, then the system shall perform no
  write of any kind — `dropDatabase` shall not be called — and shall return a cancelled
  marker.
- **R51** (unwanted): If `dropDatabase` fails, then the system shall report the error
  and return to the menu, leaving the runner usable.

### Acceptance criteria

- [ ] A unit test proves accepted confirmation ⇒ `dropDatabase` called exactly once.
- [ ] A unit test proves declined confirmation ⇒ no method called on the double, result
      marked cancelled.
- [ ] Manual check: cleaning the real local database actually empties it.

## G. CI and declared gates (US8)

- **R52** (event): When a pull request targeting `main` is opened or updated, GitHub
  Actions shall run a workflow that installs with pnpm (`--frozen-lockfile`, with the
  pnpm store cached) and then runs `typecheck`, `format:check`, `test` and `build`.
- **R53** (unwanted): If any of those four commands exits non-zero, then the workflow
  shall fail — no `continue-on-error`, no step allowed to swallow a red gate.
- **R54** (ubiquitous): The workflow shall take the Node version from `.nvmrc` and the
  pnpm version from the root `packageManager` field, so CI and local use the same
  versions.
- **R55** (ubiquitous): `harness.config.yml` shall declare `gates:` as exactly
  `typecheck`, `format:check`, `test`, `build`, and shall leave `merge.allow_no_checks`
  at its default `false`.
- **R56** (ubiquitous): The whole test suite shall be hermetic — no test shall require
  Docker, a live Mongo instance or network access.
- **R57** (ubiquitous): `README.md` shall document the quickstart for a fresh clone:
  install, `db:up` / `db:down` / `db:reset`, `dev`, `runner`, and the gate commands.

### Acceptance criteria

- [ ] The PR for this task shows a green GitHub Actions check with the four gate steps.
- [ ] A deliberately broken type (locally) turns the `typecheck` step red.
- [ ] `harness.config.yml` lists the four gates under `gates:`.

## H. Definition of done — manual real-run verification

- **R58** (event): When the implementation is signalled done, `progress.md` shall record
  the outcome of the manual real-run sequence, executed in this order: `pnpm db:up` →
  `pnpm runner` → «check connection» reports success → `pnpm dev` → the «Hola Mundo»
  page loads in a browser → `pnpm db:down`.
- **R59** (ubiquitous): This manual sequence shall be treated as part of done; the
  hermetic suite does not cover it, and a green suite alone shall not be read as
  evidence that the infrastructure runs.

### Acceptance criteria

- [ ] `progress.md` contains the six-step verification with its result.
