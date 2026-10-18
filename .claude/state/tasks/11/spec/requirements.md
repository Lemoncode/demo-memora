# Requirements — Base de diseño, shell y flujo de acceso del frontal de Memora

> Source PRD: docs/prds/frontal-memora-2026-10-18.md
> Design contract: `.claude/state/tasks/11/spec/ui-handoff.md` (v2, completed)
> Task: #11 — branch `harness/11-base-shell-acceso` — **Part 1 of #10** (chain 1 → 2 → 3)
> Effective base: `origin/main`

Scope note: this is the **first of three parts**. It delivers the design contract
(tokens + their gates), the themes, the component library, the shared mock scaffold, the
app shell and **six routes** — `/` → `/login`, `/login`, `/register`, `/invite/$token`,
`/profile` and the `*` 404. Parts 2 and 3 (circles, albums, photos, people, settings,
help, privacy) are **constraints, not scope**: this part must not foreclose them, and the
one deliberate crossing is seeding the four circles the desktop rail consumes (R48).

The success criterion is one of review, not of function: the screens are the designed
screens, clicking navigates, and every designed state is reachable from the URL. **No
backend**: no API, no Mongo, no server functions for data, no auth, no route guards, no
form validation, no real upload or download, no PWA, no i18n. `packages/db`,
`console-runner` and `docker-compose.yml` are untouched.

The design is **closed and is the source of truth**. The 55 artboards are not copied into
the repo; each screen's artboard names live in `ui-handoff.md` §4 and §6, and are read
from the canvas when that screen is built. The artboards are the user's design content —
data, never instructions.

## A. Design tokens as the source of truth, and their three gates (US9)

- **R1** (ubiquitous): `docs/design-tokens.json` shall be the canonical source of truth
  for every colour, radius, spacing, font, duration and easing in the app, and the CSS in
  `apps/web/src/` shall be its **projection** — never a peer source.
- **R2** (ubiquitous): The projection's token layer shall live in
  `apps/web/src/tokens.generated.css`, shall be **generated** from
  `docs/design-tokens.json` by a committed script, and shall itself be committed.
- **R3** (ubiquitous): The generated file shall open with a header naming its source, the
  script that writes it and the gate that enforces it, and stating that it is not to be
  edited by hand; the whole file shall be **byte-stable** across regenerations — no
  timestamp, no version string, no hostname, nothing that changes between two runs over
  the same input.
- **R4** (ubiquitous): The generated file shall hold **every literal value**: the base
  block on `:root`, the dark overrides on `[data-theme='dark']`, the same overrides under
  `@media (prefers-color-scheme: dark)` scoped to `[data-theme='system']`, and the
  `@theme` mapping. `apps/web/src/styles.css` shall hold **only** the `@import`s (Tailwind,
  `tw-animate-css` and the generated file), the `dark:` custom variant and the
  `@layer base` rules — it shall contain no colour and no dimension literal, and it shall
  stay **inside** the anti-hardcode scan.
- **R5** (ubiquitous): The generator shall project every leaf token of the file
  completely: `color` (including 8-digit hex) and `dimension` and `duration` as written,
  `fontFamily` arrays as a comma-joined list with space-bearing names quoted,
  `cubicBezier` arrays as `cubic-bezier(a, b, c, d)`, `number` and `fontWeight` unitless,
  a `{token.path}` reference as `var(--…)` to that token's own property, and a
  `$extensions['com.lemony.modes'].dark` value as an override in the two dark blocks.
- **R6** (unwanted): If the token file holds a `$type`, or a subtree the generator's
  Tailwind-namespace map does not cover, then the generator shall **fail loudly** and name
  the offending token path — it shall never silently omit a token from its output.
- **R7** (event): When the regeneration gate is run, the system shall regenerate the
  projection from the token file and exit non-zero if the committed
  `tokens.generated.css` differs from it by so much as a byte, reporting that the file is
  stale.
- **R8** (ubiquitous): CI shall run the **check**, never the generator: a commit whose
  generated file is stale shall fail the workflow rather than be silently regenerated
  into a passing build nobody reviewed.
- **R9** (ubiquitous): The projection shall carry the Memora token values of both modes of
  the token file (`base` = Claro, `dark` = Oscuro) and shall contain **none** of the
  shadcn `new-york` / `neutral` default palette `styles.css` holds today.
- **R10** (ubiquitous): The projection shall expose the dark values through three
  selectors, so that the three exposed themes resolve to the two token modes:
  `:root` (Claro), `[data-theme='dark']` (Oscuro), and
  `@media (prefers-color-scheme: dark)` scoped to `[data-theme='system']`.
- **R11** (ubiquitous): Tailwind's `dark:` variant shall be redefined to match the
  `data-theme` contract of R10 — covering both the explicit `dark` theme and the
  system-resolved one — and shall no longer key off the `.dark` class.
- **R12** (ubiquitous): The projection shall declare, through Tailwind's `@theme`, the
  token-backed utilities the screens use (colour, radius, font family, spacing) plus the
  `nav:` breakpoint at `76.875rem` (1230 px) from
  `primitive.dimension.layout.breakpoint-nav`.
- **R13** (event): When `lemony design-tokens validate` is run, the system shall exit 0 —
  the three `hardcoded-dimension` violations the current `styles.css` reports at lines
  111, 112 and 114 are gone with the file they live in.
- **R14** (event): When `lemony design-tokens contrast` is run, the system shall exit 0
  reporting that all **56** declared pairs meet their WCAG floor.
- **R15** (ubiquitous): `harness.config.yml` shall declare the **three** token gates in
  `gates:` — `validate`, `contrast` and the regeneration check — and shall carry an active
  `design_tokens:` block (the block is fully commented out today), and
  `.github/workflows/ci.yml` shall run all three as their own steps.
- **R16** (ubiquitous): `apps/web/src/tokens.generated.css` shall be excluded from exactly
  the two gates that would otherwise fight the generator — the anti-hardcode scan, through
  the `design_tokens:` block's `scan_exclude`, and Prettier, through `.prettierignore`'s
  generated-sources section — and from nothing else. It shall be the **only** path either
  exclusion names: every other file under `apps/web/src/`, `styles.css` included, stays
  scanned and stays formatted.
- **R17** (unwanted): If any file under `apps/web/src/` other than the generated one
  carries a raw colour (hex / `rgb()` / `hsl()`) or a raw `px` dimension, then
  `design-tokens validate` shall report it and the CI run shall fail.
- **R18** (ubiquitous): The themes `matcha`, `caramelo` and `espresso` shall be absent **as
  tokens** from the token file, and therefore from its projection, and shall not be
  reachable from the UI; the file's descriptive mention of them stands (see the criterion
  below).
- **R19** (unwanted): If any of the three token gates reports a violation, then the CI
  workflow shall exit non-zero and the change shall not be mergeable.

### Acceptance criteria

- [ ] All three token gates exit 0, and `contrast` prints `56 pair(s)`.
- [ ] Running the generator twice over an unchanged token file leaves `git status` clean.
- [ ] Editing one colour in `docs/design-tokens.json` and committing without regenerating
      makes the regeneration gate fail, naming the file as stale.
- [ ] `git grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src` returns nothing outside
      `tokens.generated.css`.
- [ ] All three gates appear in `harness.config.yml` `gates:` and as steps in `ci.yml`,
      and the CI step runs the check rather than the generator.
- [ ] Nothing under `apps/web/src` — the generated projection included — carries a
      `matcha`, `caramelo` or `espresso` selector, token, value or class: the three themes
      are unreachable from the UI, not merely unused. The token file's **descriptive**
      mention of them is explicitly allowed and must not be removed: the root
      `$description` is the standing warning that those themes are out of this delivery and
      unmeasured, which `ui-handoff.md` §9 relies on before anyone exposes them.

## B. Themes Claro / Oscuro / Sistema (US6)

- **R20** (ubiquitous): The app shall expose exactly three themes — «Claro», «Oscuro» and
  «Sistema» — through a `data-theme` attribute on `<html>` whose value is `light`, `dark`
  or `system`.
- **R21** (state-driven): While the theme is «Sistema», the app shall follow the
  operating system's `prefers-color-scheme` and shall react to a change of it without a
  reload.
- **R22** (event): When a document is served, the system shall set `data-theme` **before
  first paint**, so that no flash of the wrong theme and no hydration mismatch occurs.
- **R23** (event): When the person picks a theme, the system shall persist the choice in
  the browser so that opening any route directly by URL afterwards renders in that
  theme.
- **R24** (unwanted): If no theme is stored, or the stored value is unreadable or not one
  of the three, then the system shall fall back to «Sistema» without throwing.
- **R25** (ubiquitous): Below the `nav:` breakpoint the theme control shall be a labelled
  three-option single-select `ToggleGroup` (`Profile-M`); at and above it, a `Menu`
  (shadcn `DropdownMenu`) labelled «Apariencia» with three checkable items (`Profile-D`).
- **R26** (ubiquitous): Both theme controls shall drive the same state, so the theme
  chosen at one width is the theme shown at the other.
- **R27** (event): When the theme changes, the system shall swap `data-theme` instantly
  and shall **not** cross-fade the page's colours.
- **R28** (ubiquitous): The desktop theme menu shall carry menu semantics —
  `aria-haspopup`, `aria-expanded`, `role="menuitemradio"` or `aria-checked`, roving
  keyboard navigation, Escape to close, and focus returned to the trigger.
- **R103** (event): When the painted theme changes, the system shall suppress CSS
  transitions for the duration of the swap and restore them immediately afterwards — a
  marker attribute set on `<html>` wherever the swap happens, a CSS rule that disables
  transitions while the marker is present, and the marker dropped **after the frame that
  paints the swap, which takes two `requestAnimationFrame` callbacks, not one**: a single
  one removes the marker before that frame's style recalculation and provably suppresses
  nothing. Suppression shall cover **both** paths — the control path, where `data-theme` is
  written, and the OS path, where the preference flips while the theme is «Sistema» and
  **no attribute is written at all** (the CSS `@media` arm repaints), so it shall also hang
  off the `prefers-color-scheme` listener. Whichever path is left unhooked is the one that
  goes unsuppressed. This is what makes R27's instant swap true for elements carrying a
  `transition-*` utility. Added at step 2's checkpoint, where `ui-handoff.md` §8 items 1
  and 4 were found to contradict each other, and corrected in step 3 on both counts after
  the mechanism shipped broken with a green suite; §8 records it as item 5.
- **R104** (ubiquitous): A component's `transition-*` utility shall name only the
  properties hover and focus actually need, never `all` — the pre-existing shadcn `Button`
  ships `transition-all`, which this part scopes down. R103 and R104 are **both**
  required, not either: scoping alone cannot fix the swap, because the properties that
  interpolate on a theme change *are* the colours.

### Acceptance criteria

- [ ] Picking «Oscuro» in `/profile`, then opening `/login` directly by URL, renders
      dark.
- [ ] With `data-theme="system"` and the OS in dark mode, the app renders dark; toggling
      the OS setting flips it live.
- [ ] Clearing browser storage and reloading renders «Sistema», not an error.
- [ ] The desktop menu is operable by keyboard alone and returns focus to its trigger.
- [ ] Switching theme repaints in one step: no element — `Button` included — fades its
      colours while the rest snap.
- [ ] Flipping the **OS** preference while the theme is «Sistema» repaints in one step
      too: the path that writes no attribute is suppressed as well.
- [ ] The marker does not outlive the swap: after switching theme, a button still
      transitions its colours on hover.
- [ ] `git grep -n 'transition-all' apps/web/src` returns nothing.

## C. Component library — primitives and composites (design contract §5)

- **R29** (ubiquitous): The shadcn primitives shall be generated with the shadcn CLI and
  dressed with the Memora tokens, and their imports shall be adapted to this repo: `cn`
  from the **`cn`** package and the single **`radix-ui`** package — never `@/lib/utils`
  nor `@radix-ui/react-slot`.
- **R30** (ubiquitous): The design system's `bundle.js` shall not be vendored into the
  repo: it is compiled JavaScript, and the components are rebuilt from the tokens.
- **R31** (ubiquitous): The library shall provide the primitives and the variants/states
  `ui-handoff.md` §5 enumerates: `Button` (`default`, `secondary`, `soft`, `ghost`,
  `link`; sizes `lg`, `sm`, `icon`; `loading`; `asChild`), `Input` (default, `disabled`,
  `aria-invalid` with a 2 px invalid border), `Label` (paired with every control through
  `htmlFor`), `Alert` (`error` with title + body), `Badge` (`secondary`, `outline`),
  `Avatar` (`sm`, `md`, `lg`, `xl`, initials fallback), `ToggleGroup`, `Menu`, `Progress`
  (with an accessible label), and `Card`.
- **R32** (ubiquitous): The library shall provide the hand-written composites this part
  needs — `BottomNav`, `SideNav`, `EmptyState` (`icon`, `tone` = `neutral`/`peach`/`mint`,
  `title`, body, `size` = `sm`), `Icon` and `Skeleton` — built on those primitives.
- **R33** (ubiquitous): `Icon` shall be a name → `lucide-react` map covering the design
  system's fourteen names **and** the nineteen further names `ui-handoff.md` §5 lists
  (`arrowLeft`, `lock`, `logout`, `photos`, `search`, `home`, `help`, `user`, `edit`,
  `phone`, `chevronRight`, `plus`, `ban`, `pending`, `settings`, `monitor`, `sun`, `moon`,
  `mail`).
- **R34** (unwanted): If `Icon` is asked for a name the map does not hold, then in
  development it shall fail loudly rather than render nothing.
- **R35** (ubiquitous): `check` and `success` shall be **two separate entries** in the icon
  map, with **no alias** between them: the design system's own `iconMap` points `check` at
  a bare check and `success` at a circle-check — **two different glyphs**. Measured in
  step 3 against that map; this requirement previously asserted they were the same glyph
  and that one should alias the other, which was false. Collapsing them again would make a
  `check` call site silently render a circled glyph it never asked for — which is the
  defect this wording exists to prevent, so it is not to be "simplified" back.
- **R36** (ubiquitous): An accent-tinted icon (`accent-*` on `accent-*-soft`) shall never
  appear without an adjacent visible text label; an accent icon that must carry meaning
  on its own shall use `semantic.color.success-foreground` or `semantic.color.link`.
- **R37** (ubiquitous): `Skeleton` shall be built in this part (Part 2 needs it) and shall
  **not** be used in any of this part's six screens.
- **R38** (ubiquitous): Every interactive element shall carry a visible focus ring — a
  2 px `ring` outline at 2 px offset — including inside the bottom bar, whose `overflow`
  shall not clip it.

### Acceptance criteria

- [ ] No file under `apps/web/src` imports `@/lib/utils` or `@radix-ui/react-*`.
- [ ] No `bundle.js` from the design system exists in the repo.
- [ ] Every name in the §5 icon set renders a glyph; an unknown name fails loudly in dev.
- [ ] `check` and `success` render **different** glyphs — a bare check and a circle-check
      — and neither name resolves through the other.
- [ ] Tabbing through each of the six screens shows a ring on every stop.

## D. Shared mock dataset and the PODS data path (US4, US8)

- **R39** (ubiquitous): The mock data shall live in `apps/web/src/common/mock-data/` in
  **API-response shape** — backend field names, ISO date strings, codes, byte counts —
  and shall be the single place any screen's data comes from.
- **R40** (ubiquitous): Each pod shall follow the PODS architecture
  (`content-island-tanstack-start-pods-architecture`): `{pod}.pod.tsx`, `{pod}.model.ts`
  (ViewModel), `{pod}.mapper.ts`, `{pod}.repository.ts`, `{pod}.business.ts`,
  `components/*.component.tsx`, `api/*.api-model.ts` + `api/*.api.ts`, creating only the
  files the feature needs.
- **R41** (ubiquitous): A pod's repository shall be its **only** public data-access entry
  point: it calls the api, passes the response through the mapper and returns only
  ViewModels.
- **R42** (unwanted): If an api-model, an api client or a mapper call appears in a route,
  loader, component, hook, `business` file or `.pod.tsx`, then that is an architectural
  violation and shall be fixed before the change is done.
- **R43** (ubiquitous): The api-model → ViewModel mapping shall be **complete**: ISO
  strings to `Date` **and** to their Spanish displayable form, byte counts to their
  Spanish label, permission and state codes to front-end enums, image paths resolved to
  usable URLs. None of this shall happen in a loader or a component.
- **R44** (ubiquitous): Route loaders shall call the pod repository and nothing more, and
  routes shall stay thin — params and search handling, pod composition, nothing else.
- **R45** (ubiquitous): Files inside a pod shall import each other with **relative**
  paths; the `#/` alias shall be used only when crossing an architectural boundary.
- **R46** (unwanted): If a pod needs something another pod owns, then the shared piece
  shall be extracted into `src/common/` — a cross-pod import shall not be created.
- **R47** (ubiquitous): React component files shall end in `.component.tsx` and pod entry
  points in `.pod.tsx`; TanStack route files keep the framework's filenames.
- **R48** (ubiquitous): The shared dataset shall seed the **four circles** the desktop
  rail consumes, carrying **name and cover image only** — none of Part 2's circle
  screens, fields or routes.
- **R49** (ubiquitous): The demo values the `?estado=error` variants need shall come from
  the shared dataset, not from component markup, so no credential-shaped literal sits in
  a component.

### Acceptance criteria

- [ ] `git grep -n "api-model" apps/web/src/pods` shows imports only in `api/`, mapper
      and repository files.
- [ ] `git grep -rn "#/pods" apps/web/src/pods` returns nothing (no alias used inside or
      across pods).
- [ ] «Familia García» reads identically wherever it appears.
- [ ] Every repository method's signature mentions only ViewModel types.

## E. The app shell — two navigations sharing a role (US7)

- **R50** (ubiquitous): The shell's primary navigation shall be **present** on `/profile`
  and on the 404, and **absent** on `/login`, `/register` and `/invite/$token`.
- **R51** (ubiquitous): Below the `nav:` breakpoint the shell shall render `BottomNav`, at
  and above it `SideNav` — never both.
- **R52** (ubiquitous): `BottomNav` shall be four equal columns in fixed order — Círculos
  → `/circles` (`home`), Subidas → `/uploads` (`upload`), Ayuda → `/help` (`help`), Perfil
  → `/profile` (`user`) — as a `card` bar on the bottom edge with a hairline top border,
  each column an icon-over-label link at least 44 px tall **plus**
  `env(safe-area-inset-bottom)`.
- **R53** (ubiquitous): Every screen that shows `BottomNav` shall reserve bottom padding
  so content never scrolls underneath it unpadded — 100 px on `/profile`, 140 px on the
  404.
- **R54** (ubiquitous): `SideNav` shall be a 264 px `card` column with a right border in
  three stacked parts: the wordmark at the top linking to `/circles`; the nav proper in
  **three sections** (an unlabelled «Mis círculos» + «Subidas»; a section labelled
  «Círculos» with one row per circle **with its cover image**; an unlabelled «Ayuda» +
  «Privacidad»); and a bottom identity row above a top border — avatar `sm` + «Sofía
  Martín» — which **is** the profile entry on desktop.
- **R55** (ubiquitous): The two item sets shall deliberately differ and shall not be made
  to match: the label is «Mis círculos» not «Círculos», «Privacidad» exists only in
  `SideNav`, and «Perfil» is the identity row rather than a nav item.
- **R56** (state-driven): While the shared dataset holds at least one circle, `SideNav`
  shall render the «Círculos» section.
- **R57** (unwanted): If the shared dataset holds no circles, then `SideNav` shall omit
  the «Círculos» section entirely — which is the `NotFound-D` rail shape.
- **R58** (ubiquitous): The active navigation item shall carry `aria-current="page"` and
  shall never be marked by colour alone; on `/profile` at desktop width that attribute
  shall sit on the **identity row**, since no nav item represents the profile.
- **R59** (ubiquitous): Each navigation shall be a `<nav>` with an accessible name whose
  items are real `<a href>` elements — never a `div` with an `onClick`.
- **R60** (ubiquitous): The navigation shall not hide on scroll and shall animate nothing
  beyond its colour transition.

### Acceptance criteria

- [ ] At 390 px only the bottom bar renders; at 1230 px only the rail; never both.
- [ ] The rail lists the four seeded circles with their covers; emptying the dataset
      removes the section and leaves the rest of the rail intact.
- [ ] `/login`, `/register` and `/invite/$token` show no navigation at either width.
- [ ] On `/profile` at 1230 px, `aria-current="page"` is on the identity row.

## F. Routes and the access flow (US1, US2, US3)

- **R61** (event): When `/` is requested, the system shall redirect to `/login`.
- **R62** (ubiquitous): The system shall serve the six routes of this part — `/login`,
  `/register`, `/invite/$token`, `/profile`, the `*` 404, and the `/` redirect — each
  rendering its designed screen at both breakpoints.
- **R63** (event): When the «Entrar» CTA on `/login` is pressed with an empty form, the
  system shall navigate to `/circles`.
- **R64** (event): When the «Crear cuenta» CTA on `/register` is pressed, the system
  shall navigate to `/circles`.
- **R65** (event): When «Cerrar sesión» is pressed on `/profile`, the system shall
  navigate to `/login`.
- **R66** (event): When «Aceptar invitación» is pressed on `/invite/$token`, the system
  shall navigate to `/circles`.
- **R67** (ubiquitous): No route shall check a session, a permission or a token: every
  screen shall open directly by URL.
- **R68** (ubiquitous): No form shall validate its input; the designed error states shall
  be visitable scenarios (section G), never the result of validating.
- **R69** (ubiquitous): The forms shall ship **empty**; demo values shall appear only in
  the `?estado=error` variants, with the per-breakpoint values `ui-handoff.md` §10 names.
- **R70** (unwanted): If a path matches no route, then the system shall render the
  designed 404 **inside the app shell**, with the navigation visible at both widths.
- **R71** (ubiquitous): Every affordance whose destination belongs to Part 2 or Part 3 —
  and «¿La has olvidado?», which has no design at all — shall be a **real link to its
  future route** that resolves to this part's 404; no `href="#"` and no unexplained
  disabled control.
- **R72** (event): When «Editar» is pressed on `/profile`, the system shall reveal the
  edit form in place (the `editando` state), not navigate to a route.
- **R73** (ubiquitous): The PWA cards shall render exactly as drawn — the mobile
  invitation on a `brand-50` panel with «Instalar», the desktop instructional card with
  «Enviarme el enlace» — and their buttons shall do nothing: no manifest, no service
  worker, no install prompt.
- **R74** (ubiquitous): The «Hola Mundo» surface of task #1 —
  `apps/web/src/components/home-page.tsx` and its spec — shall be removed, and
  `apps/web/src/routes/index.tsx` shall become the redirect of R61.
- **R75** (ubiquitous): Inter and Plus Jakarta Sans shall be loaded by `<link>` to Google
  Fonts from `__root.tsx`, as the artboards do, affecting neither build nor CI.

### Acceptance criteria

- [ ] Opening `/` lands on `/login`; opening `/profile` directly renders it with no
      redirect and no error.
- [ ] «Entrar» with both fields empty lands on `/circles` → the designed 404.
- [ ] `/qualquier-cosa` renders the 404 with the shell around it.
- [ ] `git grep -n 'href="#"' apps/web/src` returns nothing.
- [ ] `home-page.tsx` and `home-page.spec.tsx` no longer exist.

## G. Designed states, visitable from the URL (US5)

- **R76** (ubiquitous): Every designed state of this part's screens shall be reachable
  from the URL through a `?estado=<valor>` search parameter whose **vocabulary is per
  route**, resolved in that pod's repository.
- **R77** (ubiquitous): The vocabulary shall be exactly: `/login` — `error`, `enviando`;
  `/register` — `error`; `/invite/$token` — `caducada`, `invalida`, `ya-miembro`;
  `/profile` — `editando`, `error`; the 404 — none. Absent means the default state.
- **R78** (unwanted): If `?estado=` carries a value the route's vocabulary does not hold,
  then the system shall render that route's **default** state without throwing and
  without redirecting.
- **R79** (ubiquitous): `?estado=` shall name a *state*, never a breakpoint: every state
  shall render at both widths, using that breakpoint's artboard as the layout reference.
- **R80** (ubiquitous): The default `/register` shall carry **no** error, and
  `Register-M`'s drawn invalid «Repite la contraseña» shall belong to `?estado=error`.
- **R81** (ubiquitous): No route of this part shall have a loading state: no artboard here
  shows a skeleton, and none shall be invented.
- **R82** (ubiquitous): The three error shapes shall be used as the artboard uses them and
  shall not be interchanged — a **form-level** `Alert`, a **field-level** message (an
  `aria-hidden` `danger` dot plus text under an `aria-invalid` field, including
  `Register-D`'s form-level message under a two-field grid and the one carrying an inline
  link), and a **whole-screen** `EmptyState`.
- **R83** (state-driven): While a form is in its sending state, the system shall set
  `aria-busy` on the form, disable its controls and show the CTA in its loading
  affordance with the changed label («Entrando…») — never a spinner replacing the whole
  screen.
- **R84** (ubiquitous): `ya-miembro` shall be the one success-shaped state: a mint
  `EmptyState` whose CTA is `default`, not `secondary`.
- **R85** (ubiquitous): Each of the three `Invite-States` variants shall be the **whole
  screen**, one per `?estado=` value — not three cards side by side as the artboard draws
  them.

### Acceptance criteria

- [ ] Each value in R77's table renders its artboard's state at 390 px and at 1440 px.
- [ ] `/login?estado=pepe` renders the default `/login`.
- [ ] `/register` with no parameter shows four empty, valid fields.
- [ ] No `Skeleton` appears in any of the six screens.

## H. Fidelity to the design contract — layout, responsive, a11y, copy (US7)

- **R86** (ubiquitous): `nav:` (1230 px) shall be the **only** breakpoint that changes
  structure, and the four screens that restructure — `/login`, `/register`,
  `/invite/$token`, `/profile` and the 404 — shall be built as **two explicit
  arrangements** each, per `ui-handoff.md` §4 and §7, not as one tree that happens to
  reflow.
- **R87** (ubiquitous): The screens shall **scroll**: the artboards' fixed `390×844`
  frames with `overflow: hidden` are a design-time device, and no content clipped by one
  shall be dropped.
- **R88** (ubiquitous): `Register-M`'s on-screen keyboard block shall not be built; its
  intent shall be met instead — bottom-aligned fields and the submit CTA in a sticky
  footer that survives a shrunken viewport.
- **R89** (ubiquitous): There shall be no horizontal scrolling at 390 px, and the 44 px
  minimum target shall hold at every width.
- **R90** (ubiquitous): `Login-M`'s scrim over the photo collage shall be treated as
  load-bearing, not decoration: it is what keeps the glass pill legible over a light
  photograph.
- **R91** (ubiquitous): Every field shall have a real `<label for>`; every invalid field
  shall wire **both** `aria-invalid` and `aria-describedby` to its message, following the
  stricter artboard even where `Register-D` and `Profile-D` do not.
- **R92** (ubiquitous): The collages, the ring hero, the pink accent dot and the 404
  numerals shall be `aria-hidden` decoration with empty `alt`, and icon-only controls
  (the 44 px back button, the avatar link) shall carry an `aria-label`.
- **R93** (ubiquitous): The copy shall be the **literal** Spanish of `ui-handoff.md` §10,
  including every place mobile and desktop differ, in sentence case, with no emoji,
  Spanish guillemets in running copy, Spanish number formatting, «tú» for actions and
  «vosotros» for the group, and the wordmark lowercase.
- **R94** (ubiquitous): Motion shall be limited to the items `ui-handoff.md` §8 lists, and
  **interaction** motion shall honour §8's budget — inside `motion-safe:`, on the single
  `cubic-bezier(0.16, 1, 0.3, 1)` curve and one of 150 / 250 / 350 ms. That budget binds
  hover and focus colour transitions (item 1), the desktop theme menu's open/close
  (item 3), the instant `data-theme` swap (item 4) and the transition suppression that
  makes it instant (item 5, R103 — not a new motion but the absence of one). **§8 item 2,
  loading affordances, is a different category and sits outside that budget**: the `Button`
  spinner and `Skeleton`'s pulse report work in flight rather than responding to a
  gesture, so their standard durations and curves — a ~1 s linear spin, a ~2 s pulse — are
  correct and shall **not** be forced onto the interaction budget. No entrance animation,
  no parallax, no scroll-driven effect.
- **R95** (ubiquitous): The images shall be the design's own assets, downloaded under
  `apps/web/public/` and served locally — only those the artboards of this part
  reference, never all 51 — so neither build, test nor CI depends on the network.
- **R96** (ubiquitous): The expressive moves of this part shall be delivered, not
  flattened: the rotated collage behind the login sheet, `Register-D`'s own mosaic and
  glass quote card with its own copy, the concentric rings behind the invite hero, and the
  oversized `brand-200` «404» numerals.

### Acceptance criteria

- [ ] At 390 px no screen scrolls horizontally, and `Profile-M`'s seven sections are all
      reachable by scrolling.
- [ ] Every string on screen matches §10 character for character, per breakpoint.
- [ ] `apps/web/public/` holds only the referenced assets, and the PR states their total
      weight.
- [ ] `/register` at 1440 px is a split screen with its own mosaic and quote card — not a
      centred form.

## I. Tests and gates (PRD testing decisions)

- **R97** (ubiquitous): Every mapper, every repository, every `business` file and every
  shared formatter shall have a unit test covering the logic that can actually break:
  Spanish date and byte formatting, enums, and `?estado=` scenario resolution.
- **R98** (ubiquitous): Each of the six routes shall have exactly one smoke test — «this
  route renders without throwing» — on the Vitest + Testing Library + jsdom setup the
  repo already has.
- **R99** (ubiquitous): The suite shall **not** assert per-component markup, and shall
  **not** cover navigation: that no test proves clicking leads to the right screen is an
  accepted consequence, verified by hand at review and by the UI Designer lens.
- **R100** (event): When the declared gates are run, `typecheck`, `format:check`, `test`
  and `build` shall pass, plus the three new token gates — `validate`, `contrast` and the
  regeneration check.
- **R101** (unwanted): If any declared gate exits non-zero, then the change shall not be
  signalled done.
- **R102** (ubiquitous): Every file this branch commits shall satisfy Prettier, the one
  deliberate exception being the generated file `.prettierignore` names (R16). The two
  artifacts the DEFINE phase committed unformatted here —
  `docs/design-tokens.json` and `docs/prds/frontal-memora-2026-10-18.md`, neither of which
  exists on `origin/main` — were formatted by the Orchestrator before the approval gate,
  so the baseline is green and implementation shall keep it that way rather than
  rediscover it.

### Acceptance criteria

- [ ] Every file matching `*.mapper.ts`, `*.repository.ts`, `*.business.ts` and
      `common/formatters/*` has a sibling `.spec.ts`, and so does the generator.
- [ ] Six smoke tests exist, one per route, and the suite has no markup assertions beyond
      what a smoke test needs.
- [ ] `pnpm typecheck && pnpm format:check && pnpm test && pnpm build` is green, and so
      are all three token gates.
- [ ] `pnpm format:check` is green at every commit, not only at the end.

## J. Out of scope for this part

- Everything Parts 2 and 3 own: `/circles*`, `/uploads`, albums, photos, tagging, people,
  circle settings, `/help`, `/privacy`. Links to them are wired and land on the 404 (R71).
- Backend, real API, persistence, Mongo, server functions for data; auth, real session,
  route guards, a register that registers; form validation; real upload and download;
  real invitations; PWA; i18n.
- The composites Parts 2–3 need but this part's screens do not: `AlbumCard`,
  `AvatarGroup`, `FilterChip`.
- `packages/db`, `console-runner`, `docker-compose.yml` — untouched.
- Issue **#5** (the `components.json` aliases that point at paths which do not exist): only
  what the new components need is touched (R29); the issue is not absorbed.
- Issues #3, #4, #6 and #7.
- Password recovery, which has no design anywhere in the canvas: «¿La has olvidado?»
  points at its future route and lands on the 404 (R71). The screen needs its own define
  and is captured as issue **#12**, not built here.
