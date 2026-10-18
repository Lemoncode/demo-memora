# Tasks — Base de diseño, shell y flujo de acceso del frontal de Memora

> Source PRD: docs/prds/frontal-memora-2026-10-18.md
> Design contract: `.claude/state/tasks/11/spec/ui-handoff.md`
> Requirements: `.claude/state/tasks/11/spec/requirements.md`
> Design: `.claude/state/tasks/11/spec/design.md`

Order matters and runs bottom-up: tokens → themes → components → data → shell → screens.
Nothing above can be built honestly before the contract below it exists, which is why the
PRD put the token dump in this part. The thirteen groups are deliberate for a part this
size: each one leaves a surface the human can open and judge at a checkpoint, and the four
screens are separate groups because each is an independently reviewable deliverable.

No group carries a `[risk: …]` tag, and that is a statement rather than an omission: this
part has no auth (explicitly out of scope), writes no data, spawns no process, moves no
money, handles no secret and changes no file mode. Where a group's damage has no name in
the vocabulary, the rationale says what it is.

## Group 1 — Proyección de tokens y gates de diseño _(isolates the contract every other group is built on, and the only decision here that is hard to unwind: what the two token gates measure and what they are allowed to skip; it also gets the gates green first, so every later group is judged against a green baseline)_

- [ ] T1 — Unblock the format gate before anything is built on top of it: Prettier is
      red on this branch already, on the two artifacts the DEFINE phase committed here
      (`docs/design-tokens.json` and the PRD), neither of which exists on `origin/main`.
      Format them so `format:check` is green from the first implementation commit rather
      than at the end (R95)
- [ ] T2 — Rewrite `apps/web/src/styles.css` as the projection of
      `docs/design-tokens.json`: the Memora values of both modes, the three theme
      selectors (`:root`, `[data-theme='dark']`, and `prefers-color-scheme: dark` scoped
      to `[data-theme='system']`), Tailwind's `dark:` variant redefined to match that
      contract, the `@theme` block (colours, radii, font families, `--breakpoint-nav:
      76.875rem`) and the base layer. Nothing of shadcn's `new-york` / `neutral` palette
      survives, and `matcha` / `caramelo` / `espresso` are absent (R1, R2, R3, R4, R5, R11)
- [ ] T3 — Activate the `design_tokens:` block in `harness.config.yml` (it is fully
      commented out today) with `file: docs/design-tokens.json` and
      `scan_exclude: [apps/web/src/styles.css]`, and add the two root scripts
      `design-tokens:validate` and `design-tokens:contrast` (R8, R9)
- [ ] T4 — Declare both token gates in `harness.config.yml`'s `gates:` and as their own
      steps in `.github/workflows/ci.yml`, then prove them: `validate` exits 0 with the
      three `hardcoded-dimension` violations of the old `styles.css` gone, and `contrast`
      exits 0 reporting 56 pairs (R6, R7, R10, R12)

## Group 2 — Tema Claro / Oscuro / Sistema _(isolates a new seam with a real failure mode: the theme must be applied before first paint on a server-rendered page, so getting it wrong shows up as a flash or a hydration mismatch rather than as a test failure)_

- [ ] T5 — Build `common/theme/theme.ts`: the three-theme vocabulary, `readStoredTheme` /
      `persistTheme` over `localStorage`, and a pure `resolveTheme` that maps a stored
      value plus the OS preference to the mode to paint. Unit-test the fallbacks —
      missing, corrupt, out-of-vocabulary, and a storage that throws — all resolving to
      «Sistema» without throwing (R13, R16, R17)
- [ ] T6 — Wire `__root.tsx`: the Google Fonts `<link>`s for Inter and Plus Jakarta Sans
      as the artboards do, and the small inline script that sets `data-theme` on `<html>`
      before first paint (R15, R68)
- [ ] T7 — Add the theme provider: it initialises from the attribute already in the DOM,
      swaps `data-theme` instantly with no cross-fade, reacts to a live
      `prefers-color-scheme` change while the theme is «Sistema», and is the single state
      both theme controls will drive (R14, R19, R20)

## Group 3 — Primitivos shadcn vestidos con los tokens _(mechanical but it relocates the component tree and edits `components.json`, which borders open issue #5; it also retires the «Hola Mundo» of task #1, so the checkpoint is the first one where the app looks like Memora)_

- [ ] T8 — Move `button.tsx` and `card.tsx` to `src/common/components/ui/`, point
      `components.json`'s `components` and `ui` aliases at the new paths while leaving
      `utils` / `lib` / `hooks` untouched, and delete `components/home-page.tsx` and its
      spec (R22, R67)
- [ ] T9 — Generate and dress `Input`, `Label`, `Alert` and `Badge`, adapting every
      import to this repo — `cn` from the `cn` package, primitives from the single
      `radix-ui` package — and vendoring nothing from the design system's compiled
      `bundle.js` (R22, R23, R24)
- [ ] T10 — Add the `lucide-react` dependency and the `tw-animate-css` devDependency, then
      generate and dress `Avatar` (`sm`/`md`/`lg`/`xl` with an initials fallback),
      `Progress` with an accessible label, `ToggleGroup` and `DropdownMenu`, keeping the
      menu's motion inside the system's 150 ms / single-curve budget (R22, R24, R87)
- [ ] T11 — Dress `Button` with the variants and sizes the artboards use — `default`,
      `secondary`, `soft`, `ghost`, `link`; `lg`, `sm`, `icon`; the `loading` affordance;
      `asChild` — and give every interactive element the 2 px ring at 2 px offset
      (R24, R31)

## Group 4 — Compuestos comunes _(isolates the pieces every screen and both later parts consume; `Icon` in particular is a seam whose failure mode is a nav item silently losing its meaning)_

- [ ] T12 — Build `Icon` as a closed name → `lucide-react` map covering the design
      system's fourteen names and the nineteen further ones the design contract lists,
      with `success` and `check` as one canonical entry plus an alias. An unknown name
      fails loudly in development and renders nothing in production; unit-test the
      development path. Record the usage rule that an accent-tinted icon never appears
      without an adjacent visible label (R26, R27, R28, R29)
- [ ] T13 — Build `EmptyState` with `icon`, `tone` of `neutral` / `peach` / `mint`,
      `title`, body and `size` — the message container the invite states and both 404s use
      (R25)
- [ ] T14 — Build `Skeleton`. It is used by none of this part's six screens and must not
      be invented into them; it exists because Part 2's loading artboards need it (R30)
- [ ] T15 — Build `FutureLink`, the plain `<a href>` for a route that does not exist yet.
      It is the single grep target Parts 2 and 3 convert to a typed `Link`, and the reason
      no affordance in this part needs an `href="#"` or an unexplained disabled control
      (R64)

## Group 5 — Dataset mock compartido y formateadores en español _(isolates the data contract Parts 2 and 3 inherit: once «Familia García» and the four circles are written here, every later screen reads them from this one place or contradicts itself)_

- [ ] T16 — Write the API-shaped fixtures in `common/mock-data/`: the viewer (Sofía
      Martín) and the inviter (Lucas Vidal) with their avatars, the storage figures, the
      invitation with its ISO `expires_at` and state codes, and the **four circles with
      name and cover path only** — the deliberate crossing into Part 2's territory that
      the desktop rail consumes, and nothing else of Part 2 (R32, R41)
- [ ] T17 — Add the demo-value fixture the `?estado=error` variants need, with the
      per-breakpoint values the design contract names. They live in the dataset rather
      than in markup, so no credential-shaped literal sits in a component (R42, R62)
- [ ] T18 — Build and unit-test `formatLongDate`: «24 de octubre», Spanish month names,
      no year (R36, R90)
- [ ] T19 — Build and unit-test `formatStorageUsage`: «3,1 GB de 5 GB usados · plan
      Gratis» with the Spanish decimal comma, plus the percentage the `Progress` bar takes
      (R36, R90)

## Group 6 — Assets del diseño _(one task, and it earns its own group: downloading binaries is the least reversible thing in this part — once the bytes are in git history, trimming them is a rewrite — and the damage class is repository weight, which the risk vocabulary does not name)_

- [ ] T20 — Download from the canvas **only** the assets this part's artboards reference —
      the login collage, `Login-D`'s mosaic, `Register-D`'s own seven images, the invite
      avatar, the four circle covers and the wordmark — to `apps/web/public/mock/` and
      `apps/web/public/brand/`, so neither build, test nor CI depends on the network. Report
      the total weight in the PR (R88)

## Group 7 — El shell: pod `app-shell`, navegación inferior y lateral _(isolates the structural seam every later part inherits, and the one place in this part where the PODS boundary is doing real work: the rail is data-driven, so the pod owns data the two composites only receive as props)_

- [ ] T21 — Build the `app-shell` pod end to end: `api/navigation.api-model.ts` +
      `api/navigation.api.ts` reading the shared fixtures, a complete mapper (image paths
      resolved, initials derived, codes to enums), the `Navigation` ViewModel and the
      repository as the pod's only data-access entry point. Unit-test the mapper and the
      repository, asserting that nothing backend-shaped — no field name, no ISO string, no
      code — crosses the boundary. Relative imports inside the pod, `.pod.tsx` and
      `.component.tsx` suffixes, no cross-pod import (R33, R34, R35, R36, R37, R38, R39, R40)
- [ ] T22 — Build `BottomNav`: four equal columns in fixed order — Círculos, Subidas,
      Ayuda, Perfil — as a `card` bar on the bottom edge with a hairline top border, each
      an icon-over-label link at least 44 px tall plus the safe-area inset, a `<nav>` with
      an accessible name, real anchors, `aria-current="page"` on the active one and never
      colour alone, no hiding on scroll and nothing animated but its colour
      (R45, R46, R51, R52, R53)
- [ ] T23 — Build `SideNav`: the 264 px `card` column with its right border in three
      parts — wordmark, the nav proper in three sections, and the bottom identity row that
      **is** the profile entry on desktop. The «Círculos» section renders one row per
      circle with its cover when circles exist and is omitted entirely when none do, which
      is what reconciles `Profile-D`'s rail with `NotFound-D`'s. The two item sets
      deliberately differ from the bottom bar's and are not made to match
      (R47, R48, R49, R50, R51, R52)
- [ ] T24 — Add the pathless layout route `_app.tsx`: its loader calls the shell
      repository and it renders the pod around an `<Outlet/>`, choosing `BottomNav` below
      `nav:` and `SideNav` at and above it, never both. `/login`, `/register` and
      `/invite/$token` stay outside the layout, which is how the shell is absent there
      (R43, R44)

## Group 8 — Rutas base: `/` → `/login` y el 404 dentro del shell _(the first end-to-end runnable slice — the app redirects, routes and renders a designed screen — and the group that fixes the `?estado=` contract the four screen groups then follow)_

- [ ] T25 — Turn `routes/index.tsx` into the redirect to `/login`, with no component of
      its own, retiring the last of task #1's «Hola Mundo» surface (R54, R67)
- [ ] T26 — Build the `not-found` pod as a pure UI pod — no repository, no mapper, no api
      — and mount it on the splat route `_app/$.tsx`, so an unmatched path renders the
      designed 404 inside the shell at both widths with the unmatched URL still in the
      address bar: `NotFound-M`'s wordmark header, decorative numerals and single CTA, and
      `NotFound-D`'s card, 96 px numerals and two CTAs (R55, R63)
- [ ] T27 — Establish the `?estado=` contract: `parseEstado` plus each route's
      `validateSearch`, with the per-route vocabularies — `/login` takes `error` and
      `enviando`, `/register` takes `error`, `/invite/$token` takes `caducada`, `invalida`
      and `ya-miembro`, `/profile` takes `editando` and `error`, the 404 takes none. A
      value outside the vocabulary yields the route's default state without throwing and
      without redirecting; the parameter names a state and never a breakpoint, so each
      state renders at both widths; no route of this part gets a loading state; no route
      checks a session and no form validates (R60, R61, R69, R70, R71, R72, R74)

## Group 9 — `/login` y sus estados _(the first full screen, and the one that proves the hardest visual case in the part: the rotated collage, the scrim the accessibility measurement treats as load-bearing, and a desktop that is a different surface rather than a wider one)_

- [ ] T28 — Build the `login` pod's data path: api, api-model, complete mapper,
      `business` scenario resolution and the repository returning a `LoginScreen`
      ViewModel. Unit-test the mapper, the repository and the scenario resolution,
      including a value outside the vocabulary (R69, R90)
- [ ] T29 — Build both arrangements. `Login-M`: the rotated, scaled, `aria-hidden` collage
      under its top-down scrim, the glass pill over it, and the opaque sheet pinned to the
      bottom edge with its 32 px top radius and heaviest shadow — the two zones stay
      separated and the scrim is not flattened into decoration. `Login-D`: the two-column
      split with its photo mosaic, the glass quote card bottom-left and the form inside a
      bordered card. Literal copy per breakpoint, «Entrar» navigates to `/circles` with an
      empty form, and «¿La has olvidado?» is a real link to its future route
      (R55, R56, R64, R79, R80, R83, R86, R89)
- [ ] T30 — Build the two states. `error`: the form-level `Alert` plus field-level
      messages under `aria-invalid` fields, on mobile as `Login-M-Error` draws it and on
      desktop carried into `Login-D`'s form card. `enviando`: `aria-busy` on the form,
      controls disabled and the CTA in its loading affordance reading «Entrando…» — never
      a spinner over the whole screen. Demo values come from the shared fixture
      (R62, R75, R76)

## Group 10 — `/register` y su estado de error _(its own group because the desktop is a second split-screen with its own mosaic, its own quote card and its own copy — the single mistake the first version of the design contract made — and because its error state is deliberately richer than mobile's)_

- [ ] T31 — Build the `register` pod's data path: api, api-model, complete mapper,
      `business` scenario resolution and the repository. Unit-test all three (R69, R90)
- [ ] T32 — Build `Register-M`: the full-screen `card` ground with its compact header
      (44 px back button, title, «Ya tengo cuenta»), the four bottom-aligned fields and the
      sticky-footer CTA with the terms line. The artboard's fake on-screen keyboard is a
      design-time device and is never built — the intent is met by the bottom alignment and
      a footer that survives a shrunken viewport. «Crear cuenta» navigates to `/circles`
      (R57, R81, R86)
- [ ] T33 — Build `Register-D` as the split screen it is, not a centred form: its **own**
      four-column mosaic with its own spans, its **own** glass quote card with its own
      copy, and on the right the wordmark, the h1 «Crea tu cuenta», the «Inicia sesión»
      subline and a bordered form card whose two password fields sit in a two-column grid.
      No back button and no sticky footer (R79, R86, R89)
- [ ] T34 — Build `?estado=error`, and only there: mobile shows one invalid field with no
      `Alert`; desktop shows the «Revisa 2 campos» `Alert`, two invalid fields, a
      **form-level** password message under the two-field grid and a field message carrying
      an **inline link**. The default `/register` carries no error at all. Every invalid
      field wires both `aria-invalid` and `aria-describedby` (R73, R75, R84)

## Group 11 — `/invite/$token` y sus tres estados _(the only screen whose desktop is restructured rather than widened — the icon list becomes a paragraph, the identity line changes position and tense — and the only persona who meets the product cold, so its copy carries the explanation)_

- [ ] T35 — Build the `invite` pod's data path: api, api-model with the ISO `expires_at`
      and the state codes, a complete mapper producing «24 de octubre», the circle's
      initials and the state enum, `business` scenario resolution and the repository.
      Unit-test the mapper, the repository and the resolution (R36, R69, R90)
- [ ] T36 — Build both arrangements. `Invite-M`: the centred column with the 150 px
      concentric-ring hero — no photograph, because the invitee has not earned access to
      the circle's photos — the inviter line, the circle name as h1, the three-item icon
      list, the expiry line and the bottom-pinned CTA with «No soy yo». `Invite-D`: the top
      header bar with «Has entrado como …», the centred 520 px card with its 180 px hero,
      **one paragraph instead of the icon list**, two side-by-side buttons and the footer
      strip. «Aceptar invitación» navigates to `/circles` (R59, R79, R86, R89)
- [ ] T37 — Build `caducada`, `invalida` and `ya-miembro`, each as the **whole screen**
      rather than the three side-by-side cards the artboard draws: a `secondary` `Badge`
      naming the state, an `EmptyState` with its tone and copy, and one button.
      `ya-miembro` is the one success-shaped state, with a mint `EmptyState` and a
      `default` CTA because it is the one with somewhere to go (R77, R78)

## Group 12 — `/profile` y sus estados _(the densest screen in the part and the only one whose desktop is a different screen rather than a different layout — an editing form with a rail, where the theme control changes component; it is also where the theme of Group 2 finally gets its UI)_

- [ ] T38 — Build the `profile` pod's data path: api, api-model with the raw byte counts
      and the plan, a complete mapper producing the storage label and percentage and the
      identity ViewModel, `business` scenario resolution and the repository. Unit-test all
      of it (R36, R69, R90)
- [ ] T39 — Build `Profile-M`: the h1 «Perfil» over the stack of `card` sections —
      identity with its `soft` «Editar», **Apariencia** as the labelled three-way
      `ToggleGroup` wired to the theme state, Almacenamiento as a labelled `Progress`
      badged «Dato de demostración», the PWA invitation on its `brand-50` panel, the
      two-row link list and the full-width «Cerrar sesión» that navigates to `/login`. The
      content scrolls and reserves 100 px under the bottom bar; the PWA button renders and
      does nothing (R18, R46, R58, R66, R80)
- [ ] T40 — Build `Profile-D`, a different screen: the h1 «Perfil y preferencias», the
      header row whose right-aligned «Tema: Sistema» button opens the theme **`Menu`** with
      full menu semantics — `aria-haspopup`, `aria-expanded`, checkable items, roving
      keyboard, Escape, focus returned to the trigger — and the two-column body of a form
      card beside the panel column with Almacenamiento, the **instructional** PWA card with
      its «Enviarme el enlace» button, and «Cerrar sesión» (R18, R21, R79)
- [ ] T41 — Build the states. Plain `/profile` at desktop width is the mobile section
      stack in the two-column grid beside the rail, **not** the edit form. «Editar» reveals
      the «Tus datos» form in place as `editando`, which is not a route. `error` is
      `Profile-D` as drawn — editing, with the `Alert` and the invalid email — and wires
      both `aria-invalid` and `aria-describedby` even though the artboard does not
      (R65, R75, R84)

## Group 13 — Smoke tests, barrido de accesibilidad y cierre de gates _(closes the delivery: the six tests the PRD asked for, the accessibility obligations that can only be checked once the screens exist, and the six gates going green together)_

- [ ] T42 — Add the memory-router test helper and the six smoke tests, one per route, each
      rendering its pod with the ViewModel its repository returns and asserting it renders
      without throwing. The suite asserts no per-component markup and covers no
      navigation: that clicking leads to the right screen is this part's deliverable and is
      verified by hand at review, which is the consequence the PRD accepted explicitly
      (R91, R92)
- [ ] T43 — Sweep the six screens for the accessibility obligations: a real `<label for>`
      on every field, `aria-invalid` plus `aria-describedby` on every invalid one, the
      collages, ring hero, accent dot and 404 numerals `aria-hidden` with empty `alt`, an
      `aria-label` on every icon-only control, a visible focus ring the bottom bar's
      `overflow` does not clip, no horizontal scroll at 390 px and 44 px targets at every
      width (R31, R82, R84, R85)
- [ ] T44 — Close the gates: `typecheck`, `format:check`, `test`, `build`,
      `design-tokens:validate` and `design-tokens:contrast` all green together, with no raw
      colour or `px` literal anywhere in `apps/web/src` outside the projection
      (R10, R93, R94)
