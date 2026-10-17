# Design — Infraestructura y estructura base del monorepo

> Source PRD: docs/prds/infra-monorepo-2026-10-17.md
> Task: #1 — branch `harness/1-infra-monorepo`

## Approach

Greenfield: the repository holds only the Lemony harness, an empty `README.md` and
`docs/`, so everything here is new code and nothing has to be migrated or preserved —
except the harness itself, which must keep working (its launcher resolves
`<root>/node_modules/.bin/lemony`). We turn the root into a pnpm + Turborepo workspace
whose `package.json` is the single entry point, add `apps/web` (TanStack Start +
Tailwind + shadcn) as a «Hola Mundo» that proves the styling chain, a root
`docker-compose.yml` with `mongo:8` for the local database, `packages/db` as the only
module that knows how to reach Mongo, and `console-runner` (at the root, by explicit
request) as an `@inquirer/prompts` menu for maintenance. Quality is carried by
`tsc --noEmit` and Prettier — there is no linter by explicit decision, so `typecheck`
is the load-bearing mechanical gate — and a GitHub Actions workflow runs the four gates
on every PR so the harness merge gate has a real green to read. The database layer
exposes only what this delivery needs (resolve URI, client, ping, drop); the domain
model and real seed data are explicitly out of scope, and the seed menu entry prints a
`TODO` rather than faking work.

## Spec gate decisions

- **D1 — The front end does not consume `@memora/db` in this delivery.** [deviates]
  The PRD says `packages/db` is consumed "tanto por las server functions del front
  como por el runner". With a «Hola Mundo» front and no domain model, the front has
  nothing to read: wiring the dependency now would either leave an unused dependency
  (the PRD's own first risk: scaffolding noise nobody cleans) or require a server
  function that hits Mongo, which would break the hermetic front smoke test (R19, R56)
  and add product surface the PRD puts out of scope. Alternatives: (a) declare the
  dependency unused, (b) add a DB-backed server function, (c) runner-only consumer now.
  Taken (c): `packages/db` is created with its full seam and the runner is its only
  consumer; the front gains the dependency in the first task that actually reads data
  (one line in `apps/web/package.json`). Consequence the human signs: this delivery
  does **not** prove the front→Mongo path end to end; only runner→Mongo is proven.
- **D2 — Prettier's scope is the project's own files; `.claude/` and generated paths
  are excluded.** [deviates]
  The PRD says "Prettier para formato" without a scope. Formatting the vendored harness
  (`.claude/skills/**`, agents, hooks) would reformat files we do not own and make
  `format:check` go red on the next `lemony update` — a gate failing for reasons
  unrelated to the change. Alternatives: format everything, or exclude vendor and
  generated paths. Taken the exclusion, via `.prettierignore` (`node_modules`,
  `.claude/`, `pnpm-lock.yaml`, build outputs, caches). Consequence: harness files are
  never auto-formatted, and the format gate only judges our own code and docs.
- **D3 — The front smoke test runs on Vitest + jsdom + `@testing-library/react`.**
  [preference]
  The PRD fixes Vitest for the runner and `packages/db` but leaves the front's single
  smoke test open (it only says "un único smoke test"). Taken: the same runner (one
  test tool in the repo) with jsdom and Testing Library, which asserts rendered output
  rather than implementation. Consequence: three small devDependencies in `apps/web`
  and a `vitest` environment config; no Playwright / browser-mode anywhere yet.
- **D4 — Workspace packages are scoped `@memora/*`, and `packages/db` is consumed as
  TypeScript source with no build step.** [preference]
  The PRD names the folder, not the package. Taken `@memora/db` with `exports`/`types`
  pointing at `src/index.ts` (the Turborepo "internal package" pattern), consistent
  with the PRD's no-build stance for the runner. Consequence: consumers must be able to
  compile TS from `node_modules` (true for `tsx`, Vite and `tsc`), and `packages/db`
  never emits a `dist/`.
- **D5 — Code and filenames in English; user-facing runner strings, the page greeting
  and the spec/docs prose in Spanish.** [preference]
  The PRD, the product brief and the issue are Spanish; identifiers in the stack are
  English by convention. Consequence: mixed-language repository by design — the human
  reads Spanish, the compiler reads English.
- **D6 — The existing npm install is migrated to pnpm: `package-lock.json` is deleted
  and `@lemoncode/lemony` stays a root devDependency, installed by pnpm.** [open]
  The PRD says pnpm is the package manager and the root `package.json` the single
  entry point, but never mentions the npm lockfile already in the repo. Alternatives:
  keep npm for the harness and pnpm for the product (two lockfiles, two installs), or
  migrate wholesale. Taken the migration; pnpm creates `node_modules/.bin/lemony` for
  root dependencies, so the harness launcher keeps resolving (R5 makes that an explicit
  check). Consequence: `pnpm install` is the only install command from now on, and
  anyone running `npm install` here regenerates a lockfile we no longer want.
- **D7 — Versions are pinned to exactly what this machine runs: `.nvmrc` `24.16.0`,
  `engines.node` `>=24.16.0 <25`, `packageManager` `pnpm@10.19.0`.** [open]
  The PRD says "fijada" without the values. Taken the measured versions (Node v24.16.0,
  pnpm 10.19.0). Consequence: CI pins the same pair, and a Node 25 upgrade is a
  deliberate edit rather than a silent drift.
- **D8 — `pnpm db:reset` removes the named volume; `db:down` does not.** [open]
  The PRD wants data to survive `db:down` and wants `db:reset` to "empezar de cero" —
  so the only thing reset can add is dropping the volume. Taken
  `docker compose down -v` followed by `up -d --wait`. Alternative considered: making
  `db:reset` call the runner's `dropDatabase`, rejected because that leaves the
  container and volume state untouched and duplicates the runner's job. Consequence:
  `db:reset` is destructive by definition and has no confirmation prompt (it is an
  explicitly typed command, unlike the runner's one-keystroke menu entry).
- **D9 — The Mongo service gets a healthcheck and `db:up` waits for it.** [open]
  Not in the PRD. Without it, `pnpm db:up` returns while Mongo is still starting and
  the very next step of the manual verification (runner → check connection) can fail
  for a reason that is not a defect. Taken: a `mongosh --eval 'db.adminCommand("ping")'`
  healthcheck in the service plus `--wait` on `db:up`. Consequence: `db:up` takes a few
  seconds longer and fails loudly if the container never becomes healthy.
- **D10 — `docker-compose.yml` carries a header comment marking it local-only.** [open]
  The PRD flags the credential-less database as a risk but prescribes no mitigation.
  Taken the cheapest one that travels with the file: a comment stating no credentials /
  local development only / never for an externally reachable environment.
- **D11 — `.env` is loaded at the entry point, from the repository root, and the root
  `runner` script runs `tsx console-runner/src/main.ts` from the root.** [open]
  The PRD specifies `MONGODB_URI` by environment variable with `.env` ignored and
  `.env.example` versioned, but not who loads the file nor where it lives. Taken: a
  single `.env` at the repository root; `packages/db` stays pure (it reads the env
  record it is handed, never a file), and the runner loads the file on start —
  preferring Node's native `--env-file-if-exists=.env` passed through `tsx`, falling
  back to `dotenv` in the entry module if `tsx` does not forward the flag. Running the
  runner from the root (rather than `pnpm --filter`) makes the cwd deterministic.
  Consequence: a `.env` inside a workspace package is not read, and the front will need
  its own env wiring when it first touches the database (Vite does not populate
  `process.env` from `.env`).
- **D12 — A single root `tsconfig.base.json`, extended by each workspace.** [open]
  Alternative: a `packages/tsconfig` workspace package (common in Turborepo), rejected
  because the PRD's structure lists exactly three workspaces and a fourth package that
  holds only JSON adds a moving part for no gain at this size.
- **D13 — The menu has an explicit «Salir» entry and loops until it is chosen.** [open]
  The PRD describes a menu of operations without saying what happens after one runs.
  Taken: run → report → back to the menu; `Salir` closes the Mongo client and exits 0.
  Alternative (one operation per invocation) rejected as worse for a maintenance tool
  the human is exploring.
- **D14 — The clean-database confirmation defaults to «no».** [open]
  The PRD requires an explicit confirmation; the default is unstated. Taken: default
  no, so Enter cancels. Consequence: accepting costs a deliberate keystroke, which is
  the point of having the prompt next to a one-key menu entry.
- **D15 — `README.md` gains a quickstart section.** [open]
  The PRD's success criterion is that someone who clones the repo can bring everything
  up, but it never mentions documentation and the README is empty. Taken: the minimum
  that makes the criterion true — install, `db:*`, `dev`, `runner`, gates.
- **D16 — CI runs on `pull_request` targeting `main` (not on every push).** [open]
  The PRD says "en cada PR". Taken exactly that, plus `workflow_dispatch` omitted, so
  the check the harness merge gate reads is the PR check. Consequence: a direct push to
  `main` runs no CI — acceptable because the flow always merges through a PR.

## Files

Root:

- `package.json` — modified — private workspace root: `packageManager`, `engines`, the
  ten scripts of R6, and the devDependencies shared by the gates (`turbo`, `prettier`,
  `typescript`, `tsx`, `vitest`, `@lemoncode/lemony`).
- `pnpm-workspace.yaml` — created — `apps/*`, `packages/*`, `console-runner`.
- `pnpm-lock.yaml` — created — committed; `package-lock.json` deleted.
- `turbo.json` — created — tasks `dev` (persistent, no cache), `build`, `test`,
  `typecheck`.
- `tsconfig.base.json` — created — strict TS options every workspace extends.
- `.nvmrc` — created — `24.16.0`.
- `.prettierrc` / `.prettierignore` — created — format config and the exclusions of D2.
- `.gitignore` — modified — `.env`, `.turbo/`, build outputs (`dist/`, `.output/`,
  whatever the TanStack Start version emits), test caches. The existing
  `# BEGIN lemony` block stays untouched.
- `.env.example` — created — `MONGODB_URI=mongodb://localhost:27017/memora`.
- `docker-compose.yml` — created — `mongo:8`, `27017:27017`, named volume
  `memora-mongo-data:/data/db`, healthcheck, local-only header comment.
- `README.md` — modified — quickstart (R57).
- `harness.config.yml` — modified — uncomment/declare `gates:` with the four names
  (R55); nothing else.
- `.github/workflows/ci.yml` — created — the PR workflow (R52–R54).

`packages/db` (`@memora/db`):

- `package.json` — created — `exports`/`types` → `src/index.ts`, dependency `mongodb`,
  scripts `typecheck`, `test`.
- `tsconfig.json` — created — extends the root base.
- `src/config.ts` — created — `resolveMongoUri`.
- `src/client.ts` — created — `createMongoClient`, `pingDatabase`, `dropDatabase`.
- `src/index.ts` — created — the package's public surface (re-exports + types).
- `src/config.spec.ts`, `src/client.spec.ts` — created — Vitest units.

`console-runner`:

- `package.json` — created — name `console-runner`, dependencies `@inquirer/prompts`
  and `@memora/db` (workspace), scripts `typecheck`, `test`.
- `tsconfig.json` — created.
- `src/main.ts` — created — entry: load `.env`, build the menu loop, dispatch, handle
  `ExitPromptError`, close the client, exit codes.
- `src/actions/check-connection.ts` — created — prompt-free operation.
- `src/actions/clean-database.ts` — created — prompt-free operation (receives the
  already-granted confirmation as an argument).
- `src/actions/seed-data.ts` — created — returns the pending marker, prints the `TODO`.
- `src/actions/*.spec.ts` — created — Vitest units against a Mongo double.

`apps/web`:

- `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts` (or the
  `test` block inside the Vite config) — created.
- Tailwind + shadcn configuration and the generated `Button` / `Card` components under
  the path shadcn's init chooses (`src/components/ui/`).
- the root route rendering the «Hola Mundo» page inside a `Card` with a `Button`.
- one `*.spec.tsx` smoke test for that page.

## Functions / interfaces

- `resolveMongoUri(env: NodeJS.ProcessEnv | Record<string, string | undefined>): string`
  — returns the trimmed `MONGODB_URI`; throws `Error` naming the variable and
  `.env.example` when absent, empty or whitespace-only. Pure: no file reads, no
  `process.env` access of its own (R30, R31).
- `createMongoClient(uri: string): MongoClient` — the official driver, configured with
  `serverSelectionTimeoutMS` ≤ 5000 so failures are fast (R32).
- `pingDatabase(client: MongoClient): Promise<{ host: string; database: string }>` —
  runs `db().command({ ping: 1 })` on the database encoded in the URI and returns what
  it reached, for the runner's success line (R33, R40).
- `dropDatabase(client: MongoClient): Promise<{ database: string }>` — drops the
  URI-encoded database; no hard-coded name (R33, R49).
- `checkConnection(deps): Promise<CheckResult>` — runner operation; `{ ok: true, host,
  database }` or `{ ok: false, error }`; never throws (R40, R41).
- `cleanDatabase(deps, confirmed: boolean): Promise<CleanResult>` — `{ status:
  'cancelled' }` when `confirmed` is false **without touching the client**, else
  `{ status: 'dropped', database }`, or `{ status: 'failed', error }` (R47–R51).
- `loadSeedData(): SeedResult` — synchronous, returns `{ status: 'pending' }` and takes
  no client at all, so "no database access" is structural, not a promise (R43).
- The menu layer (`src/main.ts`) owns every `@inquirer/prompts` call — `select` for the
  menu, `confirm` (default `false`) for the destructive operation — and no operation
  module imports `@inquirer/prompts` (R45).

## Edge cases

- `MONGODB_URI` set to `"   "` → treated as absent, explicit error (R31).
- `.env` missing but the variable exported in the shell → works; the file is optional
  (R35).
- `.env` missing and the variable unset → explicit configuration error, printed, menu
  stays usable (R42).
- Docker stopped during `db:up` → Docker's own error, non-zero exit (R27).
- Port 27017 already bound by a local Mongo → Docker's bind error; the documented way
  out is changing the published port and `MONGODB_URI` (PRD assumption), not silent
  fallback (R27).
- Mongo container up but still starting → `db:up` waits for healthy (R24); the runner's
  check would otherwise fail misleadingly.
- Mongo unreachable when «check connection» runs → fails within the 5 s timeout with
  the driver's message plus the `pnpm db:up` hint, returns to the menu (R41).
- `dropDatabase` against an already-empty database → succeeds, reported as dropped
  (Mongo is idempotent here).
- Ctrl+C at any prompt → `@inquirer/prompts` throws `ExitPromptError`; caught at the
  entry point, client closed, quiet exit (R44).
- shadcn / Tailwind version incompatibility → pin the working combination and record it
  (R21).
- A scaffolding CLI leaving demo routes, logos or dependencies → pruned before done
  (R18); `git status` must be clean after a build/test/dev cycle (R12).

## Testing approach

- **Unit (Vitest), `packages/db`**: `resolveMongoUri` present / absent / empty /
  whitespace — the error path asserts the message names `MONGODB_URI`. `pingDatabase`
  and `dropDatabase` against a client double (no driver socket).
- **Unit (Vitest), `console-runner`**: one spec per operation, against a Mongo double —
  `checkConnection` ok and failure (double rejects); `cleanDatabase` confirmed ⇒
  `dropDatabase` called once, declined ⇒ **no** method called on the double and
  `status: 'cancelled'`; `loadSeedData` ⇒ `status: 'pending'`.
- **Smoke (Vitest + jsdom + Testing Library), `apps/web`**: render the root route
  component, assert the greeting text and the `Button`. No routing integration, no
  styling or layout assertions.
- **Not tested, by decision**: the prompt layer itself (`select` / `confirm` wiring) —
  it is a thin adapter and testing it would mean driving a TTY; the operations it calls
  are fully covered. Docker, the real Mongo, `turbo` and CI are not exercised by the
  suite either: the suite stays hermetic (R56).
- **Manual, part of done (R58)**: `pnpm db:up` → `pnpm runner` → «check connection»
  green → `pnpm dev` → the page loads in a browser → `pnpm db:down`. This is the only
  thing that proves the infrastructure actually runs, and it is recorded in
  `progress.md`.
