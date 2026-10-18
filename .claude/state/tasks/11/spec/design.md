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
pairs; this part **consumes** it. `apps/web/src/styles.css` is rewritten as its
projection, which simultaneously retires shadcn's `new-york` / `neutral` palette and the
three `hardcoded-dimension` violations the current file reports.

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

- **D1 — The projection `apps/web/src/styles.css` is excluded from the anti-hardcode
  scan, through `design_tokens.scan_exclude`.** [deviates]
  `ui-handoff.md` §11 expects `validate` to go green once the three `calc()` dimensions
  are replaced. Measured against the real CLI, that is **not** what happens: the scan
  flags raw `#rrggbb`, `rgb()` and `hsl()` **anywhere**, including inside a custom-property
  definition, and flags raw `px` (it tolerates `rem`, `ms` and `oklch()` — which is why
  today's shadcn file reports only three dimension violations and no colour ones). A
  Memora projection carries ~60 hex values from the token file plus `9999px` and
  `blur(16px)`, so it would report ~60 violations and the gate would be red from the
  first commit. Alternatives: (a) convert every colour to `oklch()` — passes the scan but
  silently re-encodes the design system's values, makes the JSON and the CSS impossible to
  compare by eye, and still leaves the `px` literals; (b) live with a red gate — the PRD
  explicitly rejects that ("un gate rojo permanente deja de informar"); (c) declare the
  projection as what it is. Taken (c): `scan_exclude: [apps/web/src/styles.css]`, which is
  the documented purpose of the key ("for generated output you commit"). Consequence the
  human signs: the anti-hardcode scan guards **all hand-written UI source** but not the
  projection, so a colour that drifts between `docs/design-tokens.json` and `styles.css`
  is caught by review, not by a gate. (`contrast` reads the JSON, never the CSS, so it
  never guarded that drift either.)
- **D2 — `BottomNav` and `SideNav` stay presentational composites in
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

- **D3 — The shadcn primitives move to `src/common/components/ui/`, and
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
- **D4 — Two dependencies are added to `apps/web`: `lucide-react` and
  `tw-animate-css`.** [preference]
  The PRD fixes `lucide-react` as the icon library but it is not yet installed.
  `tw-animate-css` is the call: shadcn's `DropdownMenu` ships `data-[state=open]:animate-in`
  utilities that need it, and `ui-handoff.md` §8 admits that menu's enter/exit animation
  explicitly rather than treating it as over-delivery. Alternative: strip those utilities
  and hand-roll a 150 ms transition on the system curve — no new dependency, but it edits
  generated output for a motion the design contract already allows. Taken the dependency,
  with its duration and easing constrained to the system's budget. Consequence: one
  CSS-only devDependency, and the menu keeps shadcn's stock behaviour.
- **D5 — The two token gates become root `package.json` scripts named
  `design-tokens:validate` and `design-tokens:contrast`.** [preference]
  The PRD says to declare both gates "en `harness.config.yml` y en CI" without naming
  them. `harness.config.yml`'s `gates:` key is a list of the project's script names, and
  all four existing gates are root scripts that CI calls with `pnpm`. Taken the same
  shape, keeping the PRD's vocabulary in the script names. Alternative: put the bare CLI
  invocation in `gates:` and call the CLI directly from CI — fewer lines, but a Reviewer
  attesting a gate could no longer run it the way it runs the other four. Consequence: six
  entries in `gates:` and six steps in `ci.yml`.
- **D6 — Mock photographs go to `apps/web/public/mock/`, the logo to
  `apps/web/public/brand/`.** [preference]
  The PRD names `apps/web/public/mock/` for the images and says the logo enters the repo
  without saying where. Taken: the logo is brand, not mock data, so it gets its own
  folder — and the day the mock photographs are deleted the wordmark does not go with
  them.

- **D7 — The shell is a pathless layout route `src/routes/_app.tsx` that composes the
  `app-shell` pod; `/profile` and the 404 splat are its children.** [open]
  The PRD lists the routes and the handoff says the 404 sits inside the shell, but neither
  says how the shell is composed. Taken: `_app.tsx` loads the navigation from
  `appShellRepository` and renders the pod around an `<Outlet/>`; `_app/profile.tsx` and
  `_app/$.tsx` sit under it, while `login.tsx`, `register.tsx` and `invite.$token.tsx` stay
  outside it — which is exactly R43's present/absent split, expressed by the file tree
  rather than by a conditional. The 404 is the splat child rather than the router's
  `defaultNotFoundComponent`, so it renders inside the layout like any other screen and
  keeps the unmatched URL in the address bar. Consequence: Parts 2–3 add their signed-in
  routes under `_app/` and inherit the shell for free.
- **D8 — A link whose target route does not exist yet is a plain `<a href>`, rendered
  through one common component, `FutureLink`.** [open]
  R64 requires real links to Part 2–3 routes, and `typecheck` is a declared gate:
  TanStack's `<Link to="/circles">` is typed against the generated route tree, so it fails
  to compile until `/circles` exists. Alternatives: (a) cast the `to` value — hides the
  debt in a type assertion; (b) target the splat route (`to="/$"` with
  `params={{ _splat: 'circles' }}`) — fully typed and client-side, but obscure, and every
  one has to be rewritten anyway when the real route lands; (c) a plain anchor. Taken (c)
  behind a single named component, so every cross-part link is greppable and Parts 2–3
  convert them mechanically. Consequence: clicking «Círculos» costs a full page load until
  Part 2 lands, and it still arrives at the designed 404.
- **D9 — An unrecognised `?estado=` value renders the route's default state, silently.**
  [open]
  The PRD gives each route a vocabulary but not the behaviour for a value outside it.
  Alternatives: throw, redirect to the clean URL, or 404. Taken the silent fallback: the
  parameter exists so a reviewer can type states by hand, and punishing a typo with an
  error screen defeats that; a guard-free app whose every screen opens by URL (R60) should
  not start failing on a query string. Consequence: a misspelt state looks like the
  default state, which is the intended trade.
- **D10 — The theme is persisted in `localStorage` and applied by a small inline script in
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
- **D11 — The Spanish formatters live in `src/common/formatters/`, not in each pod's
  `business` file.** [open]
  The PRD puts the formatting duty in the mappers and the pure logic in `business`, but
  the same two formatters (a long date, «24 de octubre»; a byte count, «3,1 GB de 5 GB
  usados») are needed by different pods, and Parts 2–3 add the thousand-separated counts
  («1.240 fotos»). Keeping a copy per pod guarantees they drift; a cross-pod import is
  forbidden (R39). Taken: shared formatters in common, called by the pods' mappers, each
  with its own unit test. This part builds only the two it needs and does not pre-build
  Part 2's count formatter. Consequence: `src/common/formatters/` becomes the single place
  Spanish formatting is defined, and R90 covers it.
- **D12 — A pod gets a repository only where it has something to resolve; `not-found` has
  none.** [open]
  PODS makes the repository optional for a pure UI pod and mandatory wherever there is an
  api. `login` and `register` hold no domain data, but both resolve a `?estado=` scenario
  and `login`'s error variant needs the demo values from the shared dataset (R42) — so
  both get the full `api/` → mapper → repository path, thin as it is, because that is the
  seam a backend replaces. The 404 has no data and no state, so it is a pure UI pod with
  no repository, no mapper and no api. Consequence: five repositories, five mappers, one
  pod without either.
- **D13 — The six smoke tests mount the pod under a memory `RouterProvider`, through one
  shared test helper.** [open]
  The PRD fixes "un smoke test por ruta" on the repo's existing Vitest + jsdom + Testing
  Library setup, which deliberately excludes the Start/Nitro plugins and renders
  components directly. The screens render TanStack `<Link>` elements, which throw outside a
  router. Taken: `src/common/test/render-with-router.tsx` mounts a component under a
  router built from the app's generated route tree with a memory history, and each smoke
  test renders its pod with the ViewModel its repository returns. Consequence: the suite
  stays hermetic (no SSR pipeline, no network), the helper is the one place router test
  wiring lives, and it must not be named `*.spec.tsx` or Vitest would collect it.
- **D14 — `Icon` throws on an unknown name in development and renders nothing in
  production.** [open]
  `ui-handoff.md` §5 requires an unknown name to "fail loudly in development" and does not
  say what production does. Taken: throw under `import.meta.env.DEV`, render `null`
  otherwise — a missing glyph must stop a developer, but must not blank a screen for a
  reviewer. Consequence: the behaviour differs between dev and the production build, which
  R27's test asserts for the dev path only.

## Files

### Configuration and gates

- `harness.config.yml` — modified — two more entries in `gates:`; the `design_tokens:`
  block uncommented with `file: docs/design-tokens.json` and
  `scan_exclude: [apps/web/src/styles.css]` (R8, R9)
- `package.json` (root) — modified — `design-tokens:validate` and `design-tokens:contrast`
  scripts (R8)
- `.github/workflows/ci.yml` — modified — two steps, one per token gate (R8, R12)
- `apps/web/package.json` — modified — `lucide-react` dependency, `tw-animate-css`
  devDependency (R26, R87)
- `apps/web/components.json` — modified — `components` → `#/common/components`, `ui` →
  `#/common/components/ui`; `utils` / `lib` / `hooks` untouched (R22)
- `docs/design-tokens.json`, `docs/prds/frontal-memora-2026-10-18.md` — modified
  (formatting only) — both were committed unformatted by this task's DEFINE phase and are
  the reason `format:check` is red on this branch today; neither exists on `origin/main`,
  so this is the task's own debt, not a pre-existing one (R95)

### The token projection

- `apps/web/src/styles.css` — **rewritten** — the projection: `:root` (Claro),
  `[data-theme='dark']` (Oscuro), `@media (prefers-color-scheme: dark)` scoped to
  `[data-theme='system']`, the redefined `dark:` custom variant, the `@theme` block
  (colours, radii, font families, `--breakpoint-nav: 76.875rem`), the
  `tw-animate-css` import and the base layer (R1, R2, R3, R4, R5, R6, R11)

### Root, router and routes

- `apps/web/src/routes/__root.tsx` — modified — Google Fonts `<link>`s (Inter + Plus
  Jakarta Sans), the pre-paint theme script, `data-theme` on `<html>` (R15, R68)
- `apps/web/src/routes/index.tsx` — modified — redirect to `/login`, no component (R54,
  R67)
- `apps/web/src/routes/login.tsx` — created — `validateSearch` for `?estado=`, loader →
  `loginRepository`, renders `LoginPod` (R37, R55, R69)
- `apps/web/src/routes/register.tsx` — created — same shape (R37, R55, R69)
- `apps/web/src/routes/invite.$token.tsx` — created — same shape, plus the `$token` param
  (R37, R55, R69)
- `apps/web/src/routes/_app.tsx` — created — the shell layout: loader →
  `appShellRepository`, renders `AppShellPod` around `<Outlet/>` (R43, R44)
- `apps/web/src/routes/_app/profile.tsx` — created — `?estado=`, loader →
  `profileRepository`, renders `ProfilePod` (R55, R69)
- `apps/web/src/routes/_app/$.tsx` — created — the 404 splat, renders `NotFoundPod` (R63)
- `apps/web/src/routeTree.gen.ts` — regenerated — never edited by hand
- `apps/web/src/components/home-page.tsx`, `home-page.spec.tsx` — **deleted** (R67)
- `apps/web/src/components/ui/button.tsx`, `card.tsx` — **moved** to
  `src/common/components/ui/` (R22)

### Common — components, theme, formatters, mock data, test helper

- `apps/web/src/common/components/ui/{button,card,input,label,alert,badge,avatar,toggle-group,dropdown-menu,progress}.tsx`
  — created / dressed — the shadcn primitives on Memora tokens (R22, R24)
- `apps/web/src/common/components/bottom-nav.component.tsx` — created — four fixed
  columns, safe-area inset, `aria-current` (R45, R48, R51, R52)
- `apps/web/src/common/components/side-nav.component.tsx` — created — 264 px rail, three
  sections, conditional «Círculos» section, identity row (R47, R48, R49, R50, R51, R52)
- `apps/web/src/common/components/empty-state.component.tsx` — created — icon + tone +
  title + body + size (R25)
- `apps/web/src/common/components/icon.component.tsx` — created — name → lucide map (R26,
  R27, R28)
- `apps/web/src/common/components/icon.component.spec.tsx` — created — the unknown-name
  path (R27)
- `apps/web/src/common/components/skeleton.component.tsx` — created — unused here, Part 2
  consumes it (R30)
- `apps/web/src/common/components/future-link.component.tsx` — created — the anchor for a
  route that does not exist yet (R64)
- `apps/web/src/common/theme/theme.ts` + `theme.spec.ts` — created — the three-theme
  vocabulary, read/persist, resolution of «Sistema» (R13, R14, R16, R17)
- `apps/web/src/common/theme/theme-provider.component.tsx` — created — holds the current
  theme, writes `data-theme`, listens to `prefers-color-scheme` (R14, R19, R20)
- `apps/web/src/common/formatters/date.formatter.ts` + `.spec.ts` — created — «24 de
  octubre» (R36, R90)
- `apps/web/src/common/formatters/storage.formatter.ts` + `.spec.ts` — created — «3,1 GB de
  5 GB usados · plan Gratis» and its percentage (R36, R90)
- `apps/web/src/common/mock-data/users.mock.ts` — created — Sofía Martín (the viewer) and
  Lucas Vidal (the inviter), API shape (R32)
- `apps/web/src/common/mock-data/circles.mock.ts` — created — the four circles, name +
  cover path only (R32, R41)
- `apps/web/src/common/mock-data/storage.mock.ts` — created — byte counts and plan (R32)
- `apps/web/src/common/mock-data/invitations.mock.ts` — created — token, inviter, circle,
  `expires_at` ISO, state codes (R32)
- `apps/web/src/common/mock-data/form-demo-values.mock.ts` — created — the per-breakpoint
  demo values the `?estado=error` variants need (R42, R62)
- `apps/web/src/common/test/render-with-router.tsx` — created — the smoke-test helper
  (R91)

### Pods

- `apps/web/src/pods/app-shell/` — `app-shell.pod.tsx`, `.model.ts`, `.mapper.ts` +
  `.spec.ts`, `.repository.ts` + `.spec.ts`, `api/navigation.api-model.ts`,
  `api/navigation.api.ts` (R33, R34, R43, R49, R90)
- `apps/web/src/pods/login/` — pod, model, mapper, repository, `business` (scenario
  resolution), `api/`, `components/` (the collage, the glass quote card), specs (R33, R34,
  R69, R90)
- `apps/web/src/pods/register/` — same shape; `components/` holds its own mosaic and quote
  card, **not** login's (R33, R89)
- `apps/web/src/pods/invite/` — same shape; `components/` holds the ring hero and the
  three state cards (R33, R78)
- `apps/web/src/pods/profile/` — same shape; `components/` holds the appearance section,
  the storage panel, the PWA cards and the «Tus datos» form (R33, R65, R66)
- `apps/web/src/pods/not-found/` — `not-found.pod.tsx` only: pure UI, no repository, no
  mapper, no api (R63, D12)

### Assets

- `apps/web/public/mock/*` — created — only the photographs, covers and avatars this
  part's artboards reference (R88)
- `apps/web/public/brand/*` — created — the wordmark / mark (R88)

## Functions / interfaces

- `resolveTheme(stored: unknown, systemPrefersDark: boolean): 'light' | 'dark'` — pure;
  maps a stored value plus the OS preference to the mode to paint, falling back to
  «Sistema» on anything unrecognised (R14, R17)
- `readStoredTheme(): Theme` / `persistTheme(theme: Theme): void` — the only two places
  that touch `localStorage`; both survive a throwing or absent storage (R16, R17)
- `formatLongDate(date: Date): string` — «24 de octubre»; Spanish month names, no year
  (R36)
- `formatStorageUsage(usedBytes: number, limitBytes: number, plan: string): { label: string; percent: number }`
  — «3,1 GB de 5 GB usados · plan Gratis» with the Spanish decimal comma, and the
  `Progress` value (R36)
- `<Icon name={IconName} />` — the closed name union; unknown name → throws in dev,
  `null` in production (R26, R27, R28)
- `<FutureLink href="/circles">` — an `<a href>` for a route that does not exist yet; the
  single grep target Parts 2–3 convert (R64)
- `appShellRepository.getNavigation(): Promise<Navigation>` — `{ identity, circles[] }`;
  `circles` empty is a legitimate answer and drives R50
- `loginRepository.getScreen(estado): Promise<LoginScreen>` — the ViewModel carries the
  resolved `scenario` enum plus any demo field values; the api-model never leaves it (R34,
  R69)
- `registerRepository.getScreen(estado)`, `inviteRepository.getInvitation(token, estado)`,
  `profileRepository.getScreen(estado)` — the same contract per pod (R34, R69)
- `parseEstado<T>(vocabulary, raw): T | undefined` — per-route search validation that
  yields `undefined` for anything outside the vocabulary, so the repository resolves the
  default state (R71, D9)

## Edge cases

- `?estado=` absent, empty, misspelt or repeated → the route's default state, no throw
  and no redirect (R71)
- Stored theme missing, corrupt, or `localStorage` throwing (private mode, blocked site
  data) → «Sistema» (R17)
- OS flips `prefers-color-scheme` while the app is open and the theme is «Sistema» → the
  page re-paints without a reload (R14)
- The shared dataset holds no circles → `SideNav` omits the whole «Círculos» section and
  the rest of the rail is unaffected; this is the `NotFound-D` shape, and the two artboards
  are reconciled by that conditional (R49, R50)
- An unmatched path at desktop width → the 404 inside the shell with the rail visible, the
  unmatched URL still in the address bar (R63)
- A link to a Part 2–3 route → full page load to the designed 404, never a dead `href`
  (R64, D8)
- «¿La has olvidado?» → its future route, hence the 404; the screen has no design anywhere
  in the canvas and is captured as a stub, not invented (R64)
- `Icon` asked for an unknown name → loud failure in dev, `null` in production (R27, D14)
- A viewport shorter than `Register-M`'s form → fields bottom-aligned, CTA in a sticky
  footer; the artboard's fake keyboard is never built (R81)
- `Profile-M`'s content exceeding the 844 px frame → it scrolls; nothing the artboard
  clips is dropped (R80)
- Glass over an arbitrary photograph (the `Login-M` pill, the `Login-D` / `Register-D`
  quote cards) → measured at the worst case and sound (`ui-handoff.md` §9), with the scrim
  load-bearing; flagged for eyeball review in dark mode, where this part has no artboard
  (R83)
- A raw hex or `px` added to a component during implementation → `design-tokens validate`
  fails CI; the projection is the only excluded file (R10, D1)

## Testing approach

**Unit (Vitest, no DOM where none is needed)** — every mapper, every repository, every
`business` file and both shared formatters, plus `theme.ts` and `Icon`'s unknown-name
path. This is where the logic that can actually break lives: Spanish date and byte
formatting with the decimal comma, state-code → enum conversion, `?estado=` scenario
resolution including the out-of-vocabulary fallback, and the stored-theme fallbacks (R90).
A repository test asserts that what comes back is the ViewModel — no backend field name,
no ISO string, no code — which is also how R34's boundary is proven.

**Smoke (Vitest + jsdom + Testing Library)** — exactly six, one per route, each rendering
its pod with the ViewModel its repository returns under the shared memory-router helper,
asserting that it renders without throwing (R91, D13).

**Not tested, by explicit PRD decision** — no per-component markup assertions, and
**navigation is not covered at all**: no test proves that clicking a card leads to the
right screen, which is precisely this part's deliverable. That is verified by hand at
review and through the UI Designer's design-critique and a11y-audit lenses (R92). The
accepted reason: pinning eighteen screens that are still going to change into markup
assertions costs more than it protects.

**Mechanical gates** — `typecheck`, `format:check`, `test`, `build`, plus
`design-tokens:validate` and `design-tokens:contrast`; all six green before the change is
signalled done (R93, R94). Note the starting point is **not** green: `format:check`
already fails on this branch on the two artifacts the DEFINE phase committed, and
`design-tokens validate` already reports three violations in the `styles.css` this part
replaces. T1 and T2 clear both, so every later group is judged against a green baseline
(R95, R6).

**Verified by hand at review** (stated so the Reviewer knows it is deliberate): the
navigation of §3's flow diagram, the two breakpoint arrangements of each restructuring
screen, dark mode on `Login-M` / `Login-D`'s collage (no artboard exists for it in this
part — `Album-D-Dark` from Part 3 is the only dark reference in the canvas), and the
literal copy per breakpoint.
