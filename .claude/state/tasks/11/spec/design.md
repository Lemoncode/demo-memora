# Design — Base de diseño, shell y flujo de acceso del frontal de Memora

> Source PRD: docs/prds/frontal-memora-2026-10-18.md
> Design contract: `.claude/state/tasks/11/spec/ui-handoff.md` (v2, completed)
> Requirements: `.claude/state/tasks/11/spec/requirements.md`
> Architecture: skill `content-island-tanstack-start-pods-architecture` (mandatory here)
> Task: #11 — **Part 1 of #10**, effective base `origin/main`

## Approach

The part is built bottom-up in one direction: **tokens → themes → components → data →
shell → screens**, because everything above depends on the contract below it, and the
PRD put the token dump in Part 1 precisely so a contrast or DTCG surprise hurts five
routes instead of eighteen (it already paid off — six contrast failures surfaced at
DEFINE).

`docs/design-tokens.json` already exists, is validated and is `contrast`-green at 56
pairs; this part **consumes** it. Its CSS projection is **generated, not written**: a
committed script emits `apps/web/src/tokens.generated.css` from the token file, a third
token gate fails the build when the committed output is stale, and a slim hand-written
`apps/web/src/styles.css` imports it alongside Tailwind and keeps the non-token rules.
That retires shadcn's `new-york` / `neutral` palette and the three
`hardcoded-dimension` violations the current file reports, and it makes drift between the
token file and the CSS impossible rather than merely discouraged.

Data follows PODS without exception: five pods with a repository (`app-shell`, `login`,
`register`, `invite`, `profile`) plus one pure-UI pod (`not-found`), each reading
API-shaped fixtures from `src/common/mock-data/` through its own `api/` layer and mapping
them completely into its own ViewModel. That is the whole point of the mock scaffold — the
day a backend exists, only each pod's `api/` changes. Routes stay thin: validate the
search param, call the repository, compose the pod.

The six screens are built last, one per group, each as **two explicit arrangements**
(below and at/above `nav:` = 1230 px) because four of the six restructure rather than
reflow. Every designed state is a `?estado=` value resolved inside the pod's repository,
which is also the seam that disappears when a backend answers.

## Spec gate decisions

- **D1 — The token layer of the projection is generated output: a committed script writes
  `apps/web/src/tokens.generated.css` from `docs/design-tokens.json`, and a third token
  gate fails the build when the committed file is stale.** [deviates]
  `ui-handoff.md` §11 expects `validate` to go green once the three `calc()` dimensions
  are replaced. Measured against the real CLI, that is **not** what happens: the scan
  flags raw `#rrggbb`, `rgb()` and `hsl()` **anywhere**, including inside a custom-property
  definition, and flags raw `px` (it tolerates `rem`, `ms` and `oklch()` — which is why
  today's shadcn file reports only three dimension violations and no colour ones). A
  Memora projection carries 147 token values from the file, 90 of them colours, so a
  hand-written `styles.css` would be red from the first commit. Alternatives: (a) convert
  every colour to `oklch()` — passes the scan but silently re-encodes the design system's
  values, makes the JSON and the CSS impossible to compare by eye, and still leaves the
  `px` literals; (b) live with a red gate — the PRD explicitly rejects that ("un gate rojo
  permanente deja de informar"); (c) `scan_exclude` a hand-maintained `styles.css`, which
  **this spec originally took and the human reversed at the gate**: it buys a green gate by
  declaring a hand-written file generated, and leaves ~60 colour values with no mechanical
  guard against drifting from the token file — a seam Parts 2 and 3 inherit; (d) make the
  file actually generated. Taken (d). Drift stops being possible by construction rather
  than being delegated to a human reader, and `scan_exclude` then means literally what the
  key documents — "for generated output you commit". Consequence the human signs: a colour
  change is a two-step edit (edit the token file, run the generator, commit both) and the
  build fails if the second step is skipped; the project gains a small build script and a
  seventh declared gate. **Feasibility was measured, not assumed** — see D2.
- **D2 — The generator emits the literals and the `@theme` mapping; the imports, the
  `dark:` variant and `@layer base` stay hand-written in `styles.css`, which stays inside
  the scan.** [open]
  D1 says the projection is generated; this settles how far, because a partial generator
  is fine only if the boundary is explicit. Two things were verified against this repo's
  own toolchain before specifying them. **First, the token file projects completely**: a
  throwaway generator over `docs/design-tokens.json` emitted all **147** leaf tokens with
  **0** failures — `fontFamily` arrays as quoted comma lists, the `cubicBezier` array as
  `cubic-bezier(0.16, 1, 0.3, 1)`, `number` and `fontWeight` unitless, 8-digit glass hex
  passed through, `{token.path}` references as `var(--…)` — plus 22 dark overrides, which
  is all the dark mode needs because the semantic tier references the primitive tier, so
  overriding a primitive propagates. Nothing in the file needs hand-writing. **Second,
  Tailwind reads `@theme` from an imported file**: a probe built with this repo's
  `@tailwindcss/vite` 4.3.3 confirmed that `bg-primary` and `rounded-card` resolve from an
  imported `@theme`, that the `nav:` breakpoint compiles to `@media (width>=76.875rem)`,
  that the `dark:` custom variant applies, and that `@apply` works in `@layer base`. So the
  split is: **generated** — the `:root` / `[data-theme='dark']` / system-media blocks and
  the `@theme` mapping, i.e. every literal; **hand-written in `styles.css`** — the three
  `@import`s, the `@custom-variant dark`, and the `@layer base` rules, which contain no
  literal and therefore stay scanned, so a hardcode added there is still caught. The
  generator holds an explicit committed map from token subtree to Tailwind namespace
  (`semantic.color.*` → `--color-*`, `semantic.radius.*` → `--radius-*`,
  `semantic.typography.*` → `--font-*`, `primitive.dimension.layout.breakpoint-nav` →
  `--breakpoint-nav`), and R6 makes it **fail loudly** on a `$type` or a subtree the map
  does not cover rather than silently drop a token. It lives at
  `apps/web/scripts/generate-tokens-css.ts` — beside the file it writes, inside the
  workspace whose `typecheck` and anti-hardcode scan already cover `.ts`, and with its unit
  tests collected by extending `apps/web/vitest.config.ts`'s `include` to `scripts/`. The
  gate is a `--check` mode of the generator itself rather than a `git diff`, so it reports
  "stale, run `pnpm design-tokens:css`" instead of a bare non-zero exit, and works on a
  dirty tree. Consequence: two gotchas are load-bearing and R3/R16 pin them — the header
  must carry **no timestamp** or the check fails on every run, and the file must sit in
  `.prettierignore` or `format:check` and the regeneration gate will disagree about it
  forever.
- **D3 — `BottomNav` and `SideNav` stay presentational composites in
  `src/common/components/`, and the `app-shell` pod owns their data.** [deviates]
  The PODS skill says a pod's subcomponents live in that pod's `components/` directory;
  the PRD explicitly places `BottomNav` and `SideNav` in
  `apps/web/src/common/components/`. Both are closed sources and they disagree.
  Alternatives: (a) move them into `src/pods/app-shell/components/` and deviate from the
  PRD's list; (b) keep them in common and deviate from the PODS placement rule. Taken
  (b), the PRD's letter, with the boundary kept honest: the two composites take **their
  own plain prop types** (items, circles, identity) and never import the pod's ViewModel,
  so nothing flows backwards from a pod into common; the `app-shell` pod maps its
  ViewModel onto those props. Consequence: shared UI lives in one tree, and if Parts 2–3
  ever need a second shell consumer there is nothing to move.

- **D4 — The shadcn primitives move to `src/common/components/ui/`, and
  `components.json`'s `components` / `ui` aliases follow them; `utils`, `lib` and `hooks`
  are left untouched.** [preference]
  The PRD places the hand-written composites in `src/common/components/` but says nothing
  about the two primitives already sitting in `src/components/ui/`. Leaving them there
  splits shared UI across two trees for the whole life of the project. Taken: one tree —
  primitives under `src/common/components/ui/`, composites beside them — with the two
  existing files (`button.tsx`, `card.tsx`) moved and the CLI's output pointed at the new
  path. The broken `utils` / `lib` / `hooks` aliases (issue **#5**) are deliberately
  **not** fixed: the generated primitives are hand-adjusted to import `cn` from the `cn`
  package, exactly as the two existing ones already do, so nothing the new components need
  depends on those aliases. Consequence: #5 stays open and untouched, and a future shadcn
  CLI run still emits a `@/lib/utils` import to correct by hand.
- **D5 — Two dependencies are added to `apps/web`: `lucide-react` and
  `tw-animate-css`.** [preference]
  The PRD fixes `lucide-react` as the icon library but it is not yet installed.
  `tw-animate-css` is the call: shadcn's `DropdownMenu` ships `data-[state=open]:animate-in`
  utilities that need it, and `ui-handoff.md` §8 admits that menu's enter/exit animation
  explicitly rather than treating it as over-delivery. Alternative: strip those utilities
  and hand-roll a 150 ms transition on the system curve — no new dependency, but it edits
  generated output for a motion the design contract already allows. Taken the dependency,
  with its duration and easing constrained to the system's budget. Consequence: one
  CSS-only devDependency, and the menu keeps shadcn's stock behaviour.
- **D6 — The three token gates become root `package.json` scripts named
  `design-tokens:validate`, `design-tokens:contrast` and `design-tokens:css:check`, with a
  fourth non-gate script `design-tokens:css` that writes.** [preference]
  The PRD says to declare the gates "en `harness.config.yml` y en CI" without naming them.
  `harness.config.yml`'s `gates:` key is a list of the project's script names, and all four
  existing gates are root scripts that CI calls with `pnpm`. Taken the same shape, keeping
  the PRD's vocabulary in the script names. Alternative: put the bare CLI invocation in
  `gates:` and call the CLI directly from CI — fewer lines, but a Reviewer attesting a gate
  could no longer run it the way it runs the other four. The writing script is deliberately
  **not** a gate: it is what a developer runs after editing a token, and CI runs only the
  check (R8). Consequence: seven entries in `gates:` and seven steps in `ci.yml`.
- **D7 — Mock photographs go to `apps/web/public/mock/`, the logo to
  `apps/web/public/brand/`.** [preference]
  The PRD names `apps/web/public/mock/` for the images and says the logo enters the repo
  without saying where. Taken: the logo is brand, not mock data, so it gets its own
  folder — and the day the mock photographs are deleted the wordmark does not go with
  them.

- **D8 — The shell is a pathless layout route `src/routes/_app.tsx` that composes the
  `app-shell` pod; `/profile` and the 404 splat are its children.** [open]
  The PRD lists the routes and the handoff says the 404 sits inside the shell, but neither
  says how the shell is composed. Taken: `_app.tsx` loads the navigation from
  `appShellRepository` and renders the pod around an `<Outlet/>`; `_app/profile.tsx` and
  `_app/$.tsx` sit under it, while `login.tsx`, `register.tsx` and `invite.$token.tsx` stay
  outside it — which is exactly R50's present/absent split, expressed by the file tree
  rather than by a conditional. The 404 is the splat child rather than the router's
  `defaultNotFoundComponent`, so it renders inside the layout like any other screen and
  keeps the unmatched URL in the address bar. Consequence: Parts 2–3 add their signed-in
  routes under `_app/` and inherit the shell for free.
- **D9 — A link whose target route does not exist yet is a plain `<a href>`, rendered
  through one common component, `FutureLink`.** [open]
  R71 requires real links to Part 2–3 routes, and `typecheck` is a declared gate:
  TanStack's `<Link to="/circles">` is typed against the generated route tree, so it fails
  to compile until `/circles` exists. Alternatives: (a) cast the `to` value — hides the
  debt in a type assertion; (b) target the splat route (`to="/$"` with
  `params={{ _splat: 'circles' }}`) — fully typed and client-side, but obscure, and every
  one has to be rewritten anyway when the real route lands; (c) a plain anchor. Taken (c)
  behind a single named component, so every cross-part link is greppable and Parts 2–3
  convert them mechanically. Consequence: clicking «Círculos» costs a full page load until
  Part 2 lands, and it still arrives at the designed 404.
- **D10 — An unrecognised `?estado=` value renders the route's default state, silently.**
  [open]
  The PRD gives each route a vocabulary but not the behaviour for a value outside it.
  Alternatives: throw, redirect to the clean URL, or 404. Taken the silent fallback: the
  parameter exists so a reviewer can type states by hand, and punishing a typo with an
  error screen defeats that; a guard-free app whose every screen opens by URL (R67) should
  not start failing on a query string. Consequence: a misspelt state looks like the
  default state, which is the intended trade.
- **D11 — The theme is persisted in `localStorage` and applied by a small inline script in
  `__root.tsx` before first paint.** [open]
  The PRD fixes three themes and the selector's location but not persistence, and the app
  is server-rendered, so a theme read in React would flash the wrong colours and risk a
  hydration mismatch. Alternatives: in-memory only (the theme resets on every direct URL
  open — which is how a reviewer tours the screens, so dark mode becomes nearly
  unverifiable), or a cookie read on the server (works, but adds a server-side concern to
  a delivery with no backend). Taken: `localStorage` plus a blocking inline script that
  sets `data-theme` on `<html>`; React initialises from the attribute already in the DOM.
  Consequence: the theme is per-browser and invisible to the server, and the inline script
  is the one piece of script in `<head>`.
- **D12 — The Spanish formatters live in `src/common/formatters/`, not in each pod's
  `business` file.** [open]
  The PRD puts the formatting duty in the mappers and the pure logic in `business`, but
  the same two formatters (a long date, «24 de octubre»; a byte count, «3,1 GB de 5 GB
  usados») are needed by different pods, and Parts 2–3 add the thousand-separated counts
  («1.240 fotos»). Keeping a copy per pod guarantees they drift; a cross-pod import is
  forbidden (R46). Taken: shared formatters in common, called by the pods' mappers, each
  with its own unit test. This part builds only the two it needs and does not pre-build
  Part 2's count formatter. Consequence: `src/common/formatters/` becomes the single place
  Spanish formatting is defined, and R97 covers it.
- **D13 — A pod gets a repository only where it has something to resolve; `not-found` has
  none.** [open]
  PODS makes the repository optional for a pure UI pod and mandatory wherever there is an
  api. `login` and `register` hold no domain data, but both resolve a `?estado=` scenario
  and `login`'s error variant needs the demo values from the shared dataset (R49) — so
  both get the full `api/` → mapper → repository path, thin as it is, because that is the
  seam a backend replaces. The 404 has no data and no state, so it is a pure UI pod with
  no repository, no mapper and no api. Consequence: five repositories, five mappers, one
  pod without either.
- **D14 — The six smoke tests mount the pod under a memory `RouterProvider`, through one
  shared test helper.** [open]
  The PRD fixes "un smoke test por ruta" on the repo's existing Vitest + jsdom + Testing
  Library setup, which deliberately excludes the Start/Nitro plugins and renders
  components directly. The screens render TanStack `<Link>` elements, which throw outside a
  router. Taken: `src/common/test/render-with-router.tsx` mounts a component under a
  router built from the app's generated route tree with a memory history, and each smoke
  test renders its pod with the ViewModel its repository returns. Consequence: the suite
  stays hermetic (no SSR pipeline, no network), the helper is the one place router test
  wiring lives, and it must not be named `*.spec.tsx` or Vitest would collect it.
- **D15 — `Icon` throws on an unknown name in development and renders nothing in
  production.** [open]
  `ui-handoff.md` §5 requires an unknown name to "fail loudly in development" and does not
  say what production does. Taken: throw under `import.meta.env.DEV`, render `null`
  otherwise — a missing glyph must stop a developer, but must not blank a screen for a
  reviewer. Consequence: the behaviour differs between dev and the production build, which
  R34's test asserts for the dev path only.
- **D16 — The transition-suppression rule lives in the hand-written `styles.css`
  `@layer base`, and the marker is written inside the theme provider — on both of its swap
  paths — rather than in a control's handler or as React state.** [open]
  `ui-handoff.md` §8 item 5 — added at step 2's checkpoint and corrected twice in step 3 —
  fixes the *mechanism* (a marker attribute on `<html>`, a CSS rule while it is present,
  dropped after the frame that paints the swap, which takes **two** `requestAnimationFrame`
  callbacks) but not where either half lives, and in this repo that is not a free choice.
  The CSS half **cannot** go in `tokens.generated.css`: the generator owns that file
  byte-for-byte and the regeneration gate (R7) would report any hand edit as stale, so it
  goes in the hand-written layer D2 carved out for exactly this kind of rule — which also
  keeps it inside the anti-hardcode scan. The marker half goes in the provider, which is
  the only place that sees **both** swap paths: the effect that writes `data-theme`, and
  the `prefers-color-scheme` listener, where the OS flips the painted theme while
  «Sistema» is selected and **no attribute is written at all**. A control's click handler
  would miss that second path entirely. Alternatives for the marker: React state plus a
  conditional class — a re-render on every swap, and it still needs the same two hooks; or
  swapping a stylesheet — heavier and racier than an attribute. Consequence: T46 reaches
  into a file Group 2 owns (its task text says so), and the suppression rule is one of the
  few hand-written CSS rules in the project, so it is reviewed as code rather than
  regenerated.

## Files

### Configuration and gates

- `harness.config.yml` — modified — three more entries in `gates:`; the `design_tokens:`
  block uncommented with `file: docs/design-tokens.json` and
  `scan_exclude: [apps/web/src/tokens.generated.css]` (R15, R16)
- `package.json` (root) — modified — `design-tokens:validate`, `design-tokens:contrast`,
  `design-tokens:css` (writes) and `design-tokens:css:check` (the gate) (R15)
- `.github/workflows/ci.yml` — modified — three steps, one per token gate, the CSS one
  running the **check** and never the generator (R8, R15, R19)
- `.prettierignore` — modified — `apps/web/src/tokens.generated.css` under the existing
  generated-sources section, beside `**/routeTree.gen.ts` (R16)
- `apps/web/vitest.config.ts` — modified — `include` extended to collect
  `scripts/**/*.spec.ts` so the generator's unit tests run under the existing `test` gate
  (R5, R6)
- `apps/web/package.json` — modified — `lucide-react` dependency, `tw-animate-css`
  devDependency (R33, R94)
- `apps/web/components.json` — modified — `components` → `#/common/components`, `ui` →
  `#/common/components/ui`; `utils` / `lib` / `hooks` untouched (R29)
- `docs/design-tokens.json`, `docs/prds/frontal-memora-2026-10-18.md` — already fixed by
  the Orchestrator before the approval gate (formatting only); both were committed
  unformatted by this task's DEFINE phase and neither exists on `origin/main`, so the debt
  was the task's own. The baseline is green; implementation keeps it that way (R102)

### The token projection

- `apps/web/scripts/generate-tokens-css.ts` — created — the generator: reads
  `docs/design-tokens.json`, resolves `{token.path}` references, projects the seven
  `$type`s, applies the committed token-subtree → Tailwind-namespace map, and writes or
  (with `--check`) compares `tokens.generated.css`. Fails loudly on an unmapped subtree or
  an unknown `$type` (R2, R5, R6, R7)
- `apps/web/scripts/generate-tokens-css.spec.ts` — created — its unit tests (R5, R6, R7)
- `apps/web/src/tokens.generated.css` — created, **generated and committed** — the
  do-not-edit header with no volatile content, the `:root` base block, the
  `[data-theme='dark']` overrides, the same overrides under
  `@media (prefers-color-scheme: dark)` scoped to `[data-theme='system']`, and the `@theme`
  mapping (colours, radii, font families, `--breakpoint-nav: 76.875rem`) (R2, R3, R4, R9,
  R10, R12, R18)
- `apps/web/src/styles.css` — **rewritten, slim and hand-written** — the three `@import`s
  (Tailwind, `tw-animate-css`, `./tokens.generated.css`), the redefined `dark:` custom
  variant, the `@layer base` rules and the transition-suppression rule keyed on the theme
  swap's marker attribute. No colour and no dimension literal; stays inside the
  anti-hardcode scan (R1, R4, R11, R13, R103)

### Root, router and routes

- `apps/web/src/routes/__root.tsx` — modified — Google Fonts `<link>`s (Inter + Plus
  Jakarta Sans), the pre-paint theme script, `data-theme` on `<html>` (R22, R75)
- `apps/web/src/routes/index.tsx` — modified — redirect to `/login`, no component (R61,
  R74)
- `apps/web/src/routes/login.tsx` — created — `validateSearch` for `?estado=`, loader →
  `loginRepository`, renders `LoginPod` (R44, R62, R76)
- `apps/web/src/routes/register.tsx` — created — same shape (R44, R62, R76)
- `apps/web/src/routes/invite.$token.tsx` — created — same shape, plus the `$token` param
  (R44, R62, R76)
- `apps/web/src/routes/_app.tsx` — created — the shell layout: loader →
  `appShellRepository`, renders `AppShellPod` around `<Outlet/>` (R50, R51)
- `apps/web/src/routes/_app/profile.tsx` — created — `?estado=`, loader →
  `profileRepository`, renders `ProfilePod` (R62, R76)
- `apps/web/src/routes/_app/$.tsx` — created — the 404 splat, renders `NotFoundPod` (R70)
- `apps/web/src/routeTree.gen.ts` — regenerated — never edited by hand
- `apps/web/src/components/home-page.tsx`, `home-page.spec.tsx` — **deleted** (R74)
- `apps/web/src/components/ui/button.tsx`, `card.tsx` — **moved** to
  `src/common/components/ui/` (R29)

### Common — components, theme, formatters, mock data, test helper

- `apps/web/src/common/components/ui/{button,card,input,label,alert,badge,avatar,toggle-group,dropdown-menu,progress}.tsx`
  — created / dressed — the shadcn primitives on Memora tokens (R29, R31)
- `apps/web/src/common/components/bottom-nav.component.tsx` — created — four fixed
  columns, safe-area inset, `aria-current` (R52, R55, R58, R59)
- `apps/web/src/common/components/side-nav.component.tsx` — created — 264 px rail, three
  sections, conditional «Círculos» section, identity row (R54, R55, R56, R57, R58, R59)
- `apps/web/src/common/components/empty-state.component.tsx` — created — icon + tone +
  title + body + size (R32)
- `apps/web/src/common/components/icon.component.tsx` — created in Group 4, **corrected by
  Group 14's T47** — name → lucide map, with `check` and `success` as two independent
  entries and no alias (R33, R34, R35)
- `apps/web/src/common/components/icon.component.spec.tsx` — created — the unknown-name
  path, plus T47's assertion that `check` and `success` resolve to different components
  (R34, R35)
- `apps/web/src/common/components/skeleton.component.tsx` — created — unused here, Part 2
  consumes it (R37)
- `apps/web/src/common/components/future-link.component.tsx` — created — the anchor for a
  route that does not exist yet (R71)
- `apps/web/src/common/theme/theme.ts` + `theme.spec.ts` — created — the three-theme
  vocabulary, read/persist, resolution of «Sistema» (R20, R21, R23, R24)
- `apps/web/src/common/theme/theme-provider.component.tsx` — created in Group 2, **amended
  by Group 3's T46** — holds the current theme, writes `data-theme`, listens to
  `prefers-color-scheme`, and sets/drops the transition-suppression marker in the same
  effect that writes the attribute (R21, R26, R27, R103)
- `apps/web/src/common/formatters/date.formatter.ts` + `.spec.ts` — created — «24 de
  octubre» (R43, R97)
- `apps/web/src/common/formatters/storage.formatter.ts` + `.spec.ts` — created — «3,1 GB de
  5 GB usados · plan Gratis» and its percentage (R43, R97)
- `apps/web/src/common/mock-data/users.mock.ts` — created — Sofía Martín (the viewer) and
  Lucas Vidal (the inviter), API shape (R39)
- `apps/web/src/common/mock-data/circles.mock.ts` — created — the four circles, name +
  cover path only (R39, R48)
- `apps/web/src/common/mock-data/storage.mock.ts` — created — byte counts and plan (R39)
- `apps/web/src/common/mock-data/invitations.mock.ts` — created — token, inviter, circle,
  `expires_at` ISO, state codes (R39)
- `apps/web/src/common/mock-data/form-demo-values.mock.ts` — created — the per-breakpoint
  demo values the `?estado=error` variants need (R49, R69)
- `apps/web/src/common/test/render-with-router.tsx` — created — the smoke-test helper
  (R98)

### Pods

- `apps/web/src/pods/app-shell/` — `app-shell.pod.tsx`, `.model.ts`, `.mapper.ts` +
  `.spec.ts`, `.repository.ts` + `.spec.ts`, `api/navigation.api-model.ts`,
  `api/navigation.api.ts` (R40, R41, R50, R56, R97)
- `apps/web/src/pods/login/` — pod, model, mapper, repository, `business` (scenario
  resolution), `api/`, `components/` (the collage, the glass quote card), specs (R40, R41,
  R76, R97)
- `apps/web/src/pods/register/` — same shape; `components/` holds its own mosaic and quote
  card, **not** login's (R40, R96)
- `apps/web/src/pods/invite/` — same shape; `components/` holds the ring hero and the
  three state cards (R40, R85)
- `apps/web/src/pods/profile/` — same shape; `components/` holds the appearance section,
  the storage panel, the PWA cards and the «Tus datos» form (R40, R72, R73)
- `apps/web/src/pods/not-found/` — `not-found.pod.tsx` only: pure UI, no repository, no
  mapper, no api (R70, D13)

### Assets

- `apps/web/public/mock/*` — created — only the photographs, covers and avatars this
  part's artboards reference (R95)
- `apps/web/public/brand/*` — created — the wordmark / mark (R95)

## Functions / interfaces

- `projectTokens(tokenFile: unknown): string` — pure; the generator's core, returning the
  complete CSS text for a parsed token file. Pure and string-returning is what makes it
  unit-testable without touching the filesystem, and what makes `--check` a comparison
  rather than a second code path (R2, R4, R5)
- `generate-tokens-css [--check]` — the CLI around it: without the flag it writes
  `tokens.generated.css`; with it, it compares and exits non-zero naming the file as stale
  and the script to run. Fails loudly, naming the token path, on an unknown `$type` or a
  subtree outside the namespace map (R6, R7)
- `resolveTheme(stored: unknown, systemPrefersDark: boolean): 'light' | 'dark'` — pure;
  maps a stored value plus the OS preference to the mode to paint, falling back to
  «Sistema» on anything unrecognised (R21, R24)
- `readStoredTheme(): Theme` / `persistTheme(theme: Theme): void` — the only two places
  that touch `localStorage`; both survive a throwing or absent storage (R23, R24)
- `formatLongDate(date: Date): string` — «24 de octubre»; Spanish month names, no year
  (R43)
- `formatStorageUsage(usedBytes: number, limitBytes: number, plan: string): { label: string; percent: number }`
  — «3,1 GB de 5 GB usados · plan Gratis» with the Spanish decimal comma, and the
  `Progress` value (R43)
- `<Icon name={IconName} />` — the closed name union; unknown name → throws in dev,
  `null` in production (R33, R34, R35)
- `<FutureLink href="/circles">` — an `<a href>` for a route that does not exist yet; the
  single grep target Parts 2–3 convert (R71)
- `appShellRepository.getNavigation(): Promise<Navigation>` — `{ identity, circles[] }`;
  `circles` empty is a legitimate answer and drives R57
- `loginRepository.getScreen(estado): Promise<LoginScreen>` — the ViewModel carries the
  resolved `scenario` enum plus any demo field values; the api-model never leaves it (R41,
  R76)
- `registerRepository.getScreen(estado)`, `inviteRepository.getInvitation(token, estado)`,
  `profileRepository.getScreen(estado)` — the same contract per pod (R41, R76)
- `parseEstado<T>(vocabulary, raw): T | undefined` — per-route search validation that
  yields `undefined` for anything outside the vocabulary, so the repository resolves the
  default state (R78, D10)

## Edge cases

- `?estado=` absent, empty, misspelt or repeated → the route's default state, no throw
  and no redirect (R78)
- Stored theme missing, corrupt, or `localStorage` throwing (private mode, blocked site
  data) → «Sistema» (R24)
- OS flips `prefers-color-scheme` while the app is open and the theme is «Sistema» → the
  page re-paints without a reload, and the suppression marker covers that swap too —
  **this path writes no `data-theme` at all** (the CSS `@media` arm repaints), so the
  marker hangs off the `prefers-color-scheme` listener as well as off the attribute write
  (R21, R103)
- A theme swap with a `transition-*` utility in the tree → suppressed for the swap and
  restored after the frame that paints it, which needs **two** `requestAnimationFrame`
  callbacks: with one, the marker is gone before that frame's style recalculation and the
  colours interpolate anyway — measured in step 3, where the one-frame version shipped
  broken with a green suite. In the other direction, a marker that outlived the swap would
  kill hover and focus motion silently everywhere, which is why section B's criteria check
  a button still transitions on hover **after** a swap (R103)
- A theme control rendering `theme` or `resolvedTheme` during hydration → both disagree
  with the server (no `document`, no `matchMedia` there), so the control needs a mount gate
  or `useSyncExternalStore` with a server snapshot; T40 and T41 carry the constraint and
  must pick the same mechanism (R22)
- The shared dataset holds no circles → `SideNav` omits the whole «Círculos» section and
  the rest of the rail is unaffected; this is the `NotFound-D` shape, and the two artboards
  are reconciled by that conditional (R56, R57)
- An unmatched path at desktop width → the 404 inside the shell with the rail visible, the
  unmatched URL still in the address bar (R70)
- A link to a Part 2–3 route → full page load to the designed 404, never a dead `href`
  (R71, D9)
- «¿La has olvidado?» → its future route, hence the 404; the screen has no design anywhere
  in the canvas and is captured as a stub, not invented (R71)
- `Icon` asked for an unknown name → loud failure in dev, `null` in production (R34, D15)
- A viewport shorter than `Register-M`'s form → fields bottom-aligned, CTA in a sticky
  footer; the artboard's fake keyboard is never built (R88)
- `Profile-M`'s content exceeding the 844 px frame → it scrolls; nothing the artboard
  clips is dropped (R87)
- Glass over an arbitrary photograph (the `Login-M` pill, the `Login-D` / `Register-D`
  quote cards) → measured at the worst case and sound (`ui-handoff.md` §9), with the scrim
  load-bearing; flagged for eyeball review in dark mode, where this part has no artboard
  (R90)
- A raw hex or `px` added to a component during implementation → `design-tokens validate`
  fails CI; `tokens.generated.css` is the only excluded file, and `styles.css` is not one
  of them (R17, D1)
- A colour edited in `docs/design-tokens.json` and committed without regenerating → the
  regeneration gate fails and names the file as stale; the build does **not** silently
  regenerate it (R7, R8)
- A token added to the file in a subtree the namespace map does not cover, or carrying a
  `$type` the generator does not know → the generator fails loudly and names the token
  path, rather than emitting CSS that is quietly missing it (R6)
- A generator whose output is not byte-stable (a timestamp in the header, a non-deterministic
  key order) → the regeneration gate fails on an untouched tree; R3 forbids it and the
  acceptance criterion «running the generator twice leaves `git status` clean» catches it
  (R3, R7)

## Testing approach

**Unit (Vitest, no DOM where none is needed)** — every mapper, every repository, every
`business` file and both shared formatters, plus `theme.ts`, `Icon`'s unknown-name path
and the **generator**: `projectTokens` is a pure function from parsed JSON to CSS text, so
its tests cover each `$type`'s projection (the `fontFamily` array, the `cubicBezier`
array, unitless `number`, 8-digit hex), reference resolution to `var(--…)`, the dark
override blocks, byte-stability across two runs, and the loud failure on an unknown
`$type` or an unmapped subtree. This is where the logic that can actually break lives:
Spanish date and byte
formatting with the decimal comma, state-code → enum conversion, `?estado=` scenario
resolution including the out-of-vocabulary fallback, and the stored-theme fallbacks (R97).
A repository test asserts that what comes back is the ViewModel — no backend field name,
no ISO string, no code — which is also how R41's boundary is proven.

**Smoke (Vitest + jsdom + Testing Library)** — exactly six, one per route, each rendering
its pod with the ViewModel its repository returns under the shared memory-router helper,
asserting that it renders without throwing (R98, D14).

**Not tested, by explicit PRD decision** — no per-component markup assertions, and
**navigation is not covered at all**: no test proves that clicking a card leads to the
right screen, which is precisely this part's deliverable. That is verified by hand at
review and through the UI Designer's design-critique and a11y-audit lenses (R99). The
accepted reason: pinning eighteen screens that are still going to change into markup
assertions costs more than it protects.

**Mechanical gates** — `typecheck`, `format:check`, `test`, `build`, plus
`design-tokens:validate`, `design-tokens:contrast` and `design-tokens:css:check`; all
seven green before the change is signalled done (R100, R101). The four original gates are
green on the branch today (the Orchestrator formatted the two DEFINE artifacts before the
approval gate), and `design-tokens validate` still reports its three violations in the
`styles.css` this part replaces — Group 1 confirms the former and clears the latter, so
every later group is judged against a green baseline (R102, R13).

**Verified by hand at review** (stated so the Reviewer knows it is deliberate): the
navigation of §3's flow diagram, the two breakpoint arrangements of each restructuring
screen, dark mode on `Login-M` / `Login-D`'s collage (no artboard exists for it in this
part — `Album-D-Dark` from Part 3 is the only dark reference in the canvas), and the
literal copy per breakpoint.
