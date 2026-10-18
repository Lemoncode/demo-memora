# Progress — #11 Base de diseño, shell y flujo de acceso del frontal de Memora

**Status**: spec-in-progress
**Branch**: `harness/11-base-shell-acceso`
**Part 1 of #10** (partition plan, chain 1 → 2 → 3)
**PRD**: `docs/prds/frontal-memora-2026-10-18.md`

## Active

**Status**: implementing — Group 1 (proyección de tokens generada y sus tres gates), step-by-step,
auto-commit **off** (save-points in the git index, zero commits).

**Active subtask**: none — **Group 1 complete (T1–T5), fix-loop iteration 3 applied**, all seven
gates green, everything staged and uncommitted, awaiting the human checkpoint. Group 2 not
started.

Design definition closed earlier: `ui-handoff.md` is at `Status: completed` (v2). The UI Designer
**rejected v1** — it described only mobile for four of six screens and got the desktop shell
navigation factually wrong — and v2 rewrites §4–§11 against all twelve artboards, each read
directly rather than inferred.

### T1 — baseline confirmed (not fixed), 2026-10-18

Measured on `harness/11-base-shell-acceso` at `5cc92b0`, worktree clean but for this file:

- `pnpm typecheck` · `pnpm format:check` · `pnpm test` · `pnpm build` — all four **green**, so the
  Orchestrator's pre-gate `prettier --write` on `docs/design-tokens.json` and the PRD did settle
  R102's debt; nothing to fix here.
- `lemony design-tokens validate` — **exit 1**, exactly the three expected
  `hardcoded-dimension` violations at `apps/web/src/styles.css:111,112,114` (shadcn's
  `calc(var(--radius) ± 4px)`), and nothing else. They die with the file T3 rewrites.
- `lemony design-tokens contrast` — **exit 0**, `56 pair(s) meet their WCAG floor`.

### T2 — the generator, 17 unit tests green

Eleven red → green cycles, one behaviour each, in the order they drove code: a colour into
`:root`; the header; the `fontFamily` list; `cubic-bezier()`; the loud failure on an unknown
`$type` (which drove the type switch, and with it the scalar pinning assertions); reference →
`var(--…)`; a dangling reference; the two dark blocks; `@theme`; the loud failure on an
unmapped subtree; and the acceptance guards over the real token file.

Decisions taken while building, none of them contradicting the spec:

- **Property naming is the token path, kebab-cased**: `primitive.color.ground.page` →
  `--primitive-color-ground-page`, `primitive.fontFamily.sans` → `--primitive-font-family-sans`.
  A mechanical, lossless transform, so the CSS stays eyeball-comparable with the JSON — the
  property D1 chose generation to protect. A `{token.path}` reference is the same transform.
- **Two maps, not one.** D2 names the Tailwind-namespace map; R6 needs coverage over
  *everything* or a token could drop silently. So the generator holds `PROJECTED_SUBTREES`
  (every subtree it will project at all — the R6 gate) and `THEME_SUBTREES` + `THEME_LITERALS`
  (the subset exposed as Tailwind utilities). `component` is one entry rather than one per
  component: every component subtree projects identically, so adding one needs no decision.
- **`primitive.dimension.space.*` → `--spacing-*`** is the fifth namespace entry, which is
  R12's "spacing"; D2's four-entry list did not name it.
- **Two `@theme` blocks.** `@theme inline` for the colour / radius / font / spacing mappings,
  so a utility carries `var(--semantic-…)` and the dark override repaints it with no second
  theme. A plain `@theme` for `--breakpoint-nav`, because Tailwind resolves a breakpoint at
  build time to write its media query and a `var()` cannot express that.
- **A dangling `{token.path}` reference fails loudly too.** Not one of R6's two cases, but the
  same failure mode: it would otherwise project as a `var(--…)` pointing at nothing.
- **The `@theme` literal rule skips a token the file does not hold**, instead of throwing.
  Throwing would make every partial unit fixture unprojectable; that the real file carries
  `breakpoint-nav` is pinned by a test over `docs/design-tokens.json` itself.
- **Colour literals live in `__fixtures__/token-cases.fixture.json`**, the token files *and*
  the values the assertions expect. The anti-hardcode scan reads `.ts` anywhere in the repo
  and R16 allows exactly one excluded path, so a hex in the spec would be a real violation —
  JSON is outside the scan. The scan proved the point mid-task by flagging a hex in one of the
  generator's own comments; the comment lost the example.
- **The CLI is wiring, not TDD'd** (the `tdd` skill's own list): the logic lives in the pure
  `projectTokens`. T5 exercises the gate for real, in both directions.
- `@types/node` (24.19.2, the version `console-runner` already pins) joins `apps/web`'s
  devDependencies with `"types": ["vite/client", "node"]`, because the generator reads the
  filesystem inside a workspace whose `typecheck` covers `.ts`. Same shape as `console-runner`.
- Measured: the real token file projects **147** leaf declarations and **22** dark overrides,
  matching D2's measurement exactly.

### T3 — the projection and the slim `styles.css`

`apps/web/src/tokens.generated.css` is 269 lines: header, `:root` (147), `[data-theme='dark']`
(22), the same 22 under `@media (prefers-color-scheme: dark)` scoped to `[data-theme='system']`,
`@theme inline` (47 utility mappings) and `@theme { --breakpoint-nav: 76.875rem; }`.

**Verified rather than trusted**, with a probe file that Tailwind's content scan picks up,
built and then removed in one trap-guarded command (`git status` clean afterwards):

- `nav:` compiles to `@media (width>=76.875rem)` — the literal breakpoint works.
- `dark:bg-card` compiles to **both** arms: `:where([data-theme=dark], …)` and, under
  `@media (prefers-color-scheme: dark)`, `:where([data-theme=system], …)` (R11).
- `bg-primary`, `rounded-card`, `font-body`, `font-heading`, `ring-ring`, `border-border` and
  `animate-in` all resolve; `p-4` compiles to `padding: var(--primitive-dimension-space-4)`,
  so the spacing scale really is token-backed.
- Byte-stability: two runs over the unchanged token file give an identical md5.

`styles.css` is 44 lines and holds **zero** literals (grep for hex / `rgb(` / `hsl(` / `px`
finds none), so the scan keeps guarding it: `validate` no longer reports anything in it — the
three `hardcoded-dimension` violations died with the old file, as R13 predicted.

**`tw-animate-css` 1.4.0 was installed here, not in Group 3.** T3 requires `styles.css` to
import it, so the `build` gate needs the package present; T11 is left with `lucide-react` and
the components. No other part of T11 was touched.

**Two gates are red between T3 and T4, by construction**: `validate` reports the generated
file's 90 colour literals and `format:check` flags its formatting. Both are what T4's two
exclusions exist for — and the collision R16 warns about is real, measured here: the fix is
`.prettierignore`, never `prettier --write` on the generated file.

### T4 — the regeneration gate and the two exclusions

Root scripts `design-tokens:css` (writes) and `design-tokens:css:check` (the gate, `--check`
mode of the same script so it reports «stale, run pnpm design-tokens:css» instead of a bare
exit code, and works on a dirty tree). One CI step, running the **check** and never the
generator (R8). `harness.config.yml` gained an active `design_tokens:` block with
`file:` + `scan_exclude:`, and `.prettierignore` names the generated file beside
`**/routeTree.gen.ts`. Both exclusions name that one path and nothing else (R16).

With the wiring in place all three went green at once: `css:check` exit 0, `validate` exit 0
reporting «147 token(s), 26 file(s) scanned, no hardcoded values» with one skipped path
(`design_tokens.scan_exclude`), and `format:check` clean again.

### T5 — the three gates declared, and proven in both directions

`gates:` now lists seven; `ci.yml` has seven steps, the token three last, the CSS one running
the check. `design-tokens:validate` and `design-tokens:contrast` joined the root scripts, so a
Reviewer runs a token gate exactly the way it runs the other four (D6).

Proof, run by hand:

- `pnpm design-tokens:validate` → **exit 0**, «147 token(s), 26 file(s) scanned, no hardcoded
  values», one skipped path and it is the generated file (R13, R16, R17).
- `pnpm design-tokens:contrast` → **exit 0**, «56 pair(s) meet their WCAG floor» (R14).
- `pnpm design-tokens:css:check` → **exit 0** on the committed output, and **exit 1** after
  `brand.500` was edited in the token file without regenerating, printing «…is stale — it no
  longer matches docs/design-tokens.json. Run `pnpm design-tokens:css` and commit the result.»
  The probe edit was restored by a trap in the same command; `git status docs/` is clean and no
  `.bak` survives (R7, R8, R19).

### Verify (all seven gates + the real run)

`build` ✅ · `typecheck` ✅ · `format:check` ✅ (the project has no linter by explicit
decision, so this carries that weight) · `test` ✅ **37 tests** (19 web, of which 17 are the
generator's; 7 console-runner; 11 db) · `audit` ✅ no known vulnerabilities ·
`design-tokens:validate` ✅ · `design-tokens:contrast` ✅ · `design-tokens:css:check` ✅.

Real run, SSR: `pnpm dev` serves `/` with **200**, no errors in the dev log, and the stylesheet
it actually delivers carries `--primitive-color-brand-500`, `--semantic-color-primary`,
`[data-theme='system']` (×19) and `prefers-color-scheme: dark` (×8), with **zero** occurrences
of `oklch(`, `--sidebar`, `matcha`, `caramelo` or `espresso` — R9 and R18 confirmed in the
served artifact, not just in the source. `<html lang="es">` carries no `data-theme` yet, which
is Group 2's T7.

### Fix-loop iteration 2 — review REJECT, one blocking finding + four advisories

**Blocking: R6 had a hole for a whole input class, and it was real.** `projectValue`
resolved a `{token.path}` reference and returned **before** the `switch` that owned the
unknown-`$type` throw, so a token with an uncovered `$type` and a reference `$value`
projected silently. Reproduced, then fixed, then re-reproduced against the real module:
`{ $type: 'shadow', $value: '{primitive.color.brand.500}' }` now throws
«Unknown $type "shadow" at token "component.card.shadow"…».

The fix is structural rather than a reordering: the `switch` became **one `PROJECTORS`
table** keyed by `$type`, so the set of types the generator accepts and the set it knows how
to write are the same object and cannot drift. `projectorFor` consults it **before** the
reference branch, so the type gate is order-independent the way `assertProjected` already
was. The old `PROJECTED_TYPES` constant is gone — it was commented as the guard but only
ever interpolated into an error message, which is what let one early `return` defeat it.

Advisories, all four done:

1. **The `--check` message named the wrong file when the output was absent** («…is missing
   docs/design-tokens.json»). The missing case now has its own sentence: «…does not exist.
   Run `pnpm design-tokens:css` to write it, and commit the result.»
2. **`checkProjection(committed, css)` extracted and tested** — pure, exported, three
   outcomes (equal / different / missing). That one comparison is the difference between a
   gate and a gate that is green while guarding nothing, so it is no longer only wiring; it
   also fixes advisory 1 by construction. `main()` is now a four-line adapter around it.
3. **Scalar `$value`s are shape-checked.** `String(value)` turned any shape into
   plausible-looking CSS (`[object Object]`); `color` / `dimension` / `duration` / `number` /
   `fontWeight` now require a string or a number and name the token path otherwise — the same
   guard `asArray` already gave `fontFamily` and `cubicBezier`.
4. **The node type space is split.** `apps/web/scripts/tsconfig.json` is its own project
   (`types: ["node"]`); `apps/web/tsconfig.json` is back to `types: ["vite/client"]` and
   excludes `scripts`; `typecheck` runs both (`tsc --noEmit && tsc --noEmit -p scripts`).

   **Finding on advisory 4, measured rather than assumed.** Reverting my `types` edit does
   **not** stop `src/` from seeing `process` / `Buffer`: `vite/dist/node/index.d.ts` and
   `nitro`'s typings carry their own `/// <reference types="node" />`. Proved by moving
   `apps/web/node_modules/@types/node` aside and typechecking a `process.cwd()` probe in
   `src/` — still exit 0, so the resolution comes from vite's own dependency tree
   (`vite@8.3.4_@types+node@24.19.2_…`), which predates this group. So the loosening I
   introduced is reverted and the generator's node typing is scoped, but node globals remain
   reachable in `src/` as a property of the SSR stack. Making them unreachable would need a
   `typeRoots` restriction that leaves those framework references unresolvable — i.e. a red
   `typecheck`. That is a decision about the stack, not Group 1's to take.

**One authorised edit outside the group's files**: `docs/design-tokens.json`'s root
`$description` said «apps/web/src/styles.css is its projection», which the D1 reversal made
false. One line, naming `tokens.generated.css` as the generated projection, its generator, its
gate and `styles.css`'s slim role. No token value, no `$extensions` touched (`git diff --stat`
= 1 insertion, 1 deletion). A root `$description` is not projected, and `css:check` staying
**green** across the edit proves it; `contrast` still 56 pairs, `validate` still clean.

Re-verified after the fix: **seven gates green**, `pnpm audit` clean, **42 tests** (24 web, of
which 22 are the generator's), both failure directions of the gate re-proved by hand (stale
token → exit 1 naming the file stale; absent output → exit 1 with the corrected sentence),
every probe trap-restored with absolute paths and the tree clean afterwards. The served
stylesheet is byte-identical to iteration 1's: brand-500 and `semantic-color-primary` present,
`[data-theme='system']` ×19, `76.875rem` ×2, zero `oklch(` and zero `sidebar`.

### Fix-loop iteration 3 — review REJECT, three guard-side findings on R6

All three were real; the generated CSS came out byte-identical again (sha1 `a0a81cf5`), as
every change is guard-side.

**Finding 1 — the membership test reached `Object.prototype`.** `PROJECTORS[type]` on an
object literal accepted `constructor`, `toString`, `isPrototypeOf` and friends, so the set
the generator accepted was larger than the table: with a literal `$value` it emitted
`primitive,color,brand,500`, with a reference it emitted a `var()`, and `valueOf` /
`hasOwnProperty` / `__proto__` threw an incidental `TypeError` naming no token path. Same
defect class as iteration 2's early `return`, reached through the prototype.

Fixed with a **`Map`** rather than the one-line `Object.hasOwn` guard the reviewer verified.
Both fix today's symptom; a `Map` has no inherited keys *at all*, so the accepted set cannot
be larger than the table by construction, and this is the second time the two sets drifting
apart has been the bug. Test drives all six inherited names, each with a literal **and** a
reference `$value`.

**Finding 2 — nothing guarded R6's «never silently omit» half.** Three shapes walked past
with no error and no output, now all three stop the generator naming the path:

- a node with **only a mode override and no `$value`** — nothing to declare, so it vanished;
- a **bare value where a token object belongs** — `isRecord` returned `[]` and it vanished;
- an **unrecognised mode key** under `com.lemony.modes`. This is the one that mattered: the
  root `$description` I edited last iteration forecasts `matcha` / `caramelo` / `espresso` as
  themes someone may expose, and the day a mode value for one landed, the projection would
  ignore it while all seven gates stayed green — the committed CSS quietly not matching the
  token file, which is the exact failure the D1 reversal exists to prevent.

Same family, also fixed: a `$value` **mentioning a reference without being exactly one**
(`"{a.b} {c.d}"`) missed the regex and was emitted with its braces intact; it now refuses.

**Finding 3 — the leaf-count test was tautological against that class**, because
`countLeaves` recursed by the same rule `collectLeaves` uses. Kept as a guard against the
projection step dropping a *known* leaf, with its comment corrected to say exactly that (the
counting is independent, the definition of a leaf is not). The new guard it needed asserts
over the file's **nodes**: every node carrying a `com.lemony.modes` extension — found by the
extension's presence, not by `$value` — must have a declaration, **by name**, in both dark
blocks, and the blocks must hold no more than those. Verified non-vacuous by mutant: dropping
one override from `overridden` turns 3 tests red, the new one among them.

Advisories: the vacuous `not.toThrow(/\[object Object\]/)` now asserts the message says what
the type accepts; both tsconfig comments now state what the split does **and does not** buy,
pointing at the measurement (node globals stay reachable in `src/` through vite's and nitro's
own `/// <reference types="node" />`).

**30 web tests** (28 the generator's). All ten reported shapes re-run end-to-end against the
real module: every one throws and names the token path. Seven gates green, `audit` clean,
every probe trap-restored with absolute paths.

## Group 1 — what the human sees at the checkpoint

Nothing visual changed: this group delivers the contract the rest is built on. What to look at:

1. `apps/web/src/tokens.generated.css` — read the header, then spot-check a value against
   `docs/design-tokens.json`. They are meant to be comparable by eye.
2. `apps/web/src/styles.css` — 44 lines, no literal anywhere.
3. `pnpm design-tokens:css:check`, then edit any colour in `docs/design-tokens.json` and run it
   again: it must fail and name the file stale. `git checkout docs/design-tokens.json` after.
4. The `@theme` block decides the utility vocabulary every later group writes
   (`bg-primary`, `rounded-card`, `font-body`, `p-4`, `nav:`). If a name reads wrong, now is
   the cheap moment to say so.

## Decision log

Closed in the DEFINE grill (all recorded in the PRD):

- Alcance partido en 3 partes, forma de cadena; esta es la Parte 1.
- Imágenes: los assets del propio canvas, descargados a `apps/web/public/mock/`.
- Estados visitables por `?estado=` en cada ruta (vocabulario por ruta en el handoff §6).
- Datos mock en `apps/web/src/common/mock-data/`, en forma de respuesta de API; el `api/` de cada
  pod lee de ahí y el mapper del pod produce el ViewModel.
- Tests: lógica pura (mappers, repositorios, business) con test unitario + un smoke test por ruta.
  Consecuencia aceptada: la navegación no la cubre la suite.
- Sin sesión y sin guardas; `/` → `/login`.
- Capacidad de design tokens activada: `docs/design-tokens.json` como fuente canónica + los gates
  `validate` y `contrast`, declarando cada pareja por su uso real.

Closed in the design definition (recorded in `spec/ui-handoff.md`):

- `ink.muted` oscurecido a `#5e6c7e` (el `#64748b` del DS medía 4,34:1 sobre `elevated`).
- Token de borde de control propio, `#7d8da3` / `#5a7190`, porque el `border-strong` del DS da
  1,48:1 en un campo de formulario. Es una desviación visible del artboard, tomada a conciencia.
- `destructive` y los tintes accent no se declaran como parejas medidas: son refuerzo redundante
  junto a texto, nunca el único indicador.
- Los temas `matcha`, `caramelo` y `espresso` quedan **fuera** de la entrega (y `espresso` tiene un
  botón primario a 3,20:1).
- `docs/design-tokens.json` escrito y verificado: `contrast` verde con **56 parejas**; `validate`
  solo marca tres literales del `styles.css` actual, que esta parte sustituye.

Closed after the critique:

- **`signal.danger-strong`** (`#e03131` claro, oscuro se queda en `#f87171`) para el borde de campo
  inválido, declarado `non-text`. Regresión propia: al subir el borde en reposo a 3,23 dejé el de
  error en 2,77 — el error se veía menos que lo normal.
- **El ítem activo del nav inferior usa `semantic.color.link`**, no `primary`: el gate cazó que
  brand-600 sobre la tarjeta oscura da 3,02:1. Es la regla de texto de marca del DS.
- Formularios vacíos (valores de demostración solo en `?estado=error`); afordancias sin destino son
  enlaces reales que caen en el 404; «Editar» es el estado `editando`, no una ruta; las tarjetas de
  PWA se pintan inertes.
- **La Parte 1 siembra los cuatro círculos** (nombre + portada) porque el rail de escritorio los
  consume; el rail pinta la sección cuando hay círculos, lo que reconcilia `Profile-D` con
  `NotFound-D`.
- Los cinco supuestos del checkpoint del grill siguen en pie sin cambios.

## Approval gate

Portada presentada el 2026-10-18. El humano **aprobó con un cambio**, así que la tarea sigue en
`harness:status:spec-ready` y no hay código escrito. Respuestas dadas en el gate, que aplican
cuando el gate se cierre tras la revisión:

**Mode**: step-by-step
**Auto-commit**: off

Cambio pedido, enrutado al Spec Author (dueño del spec):

1. **D1 se reescribe.** En vez de excluir a mano `apps/web/src/styles.css` del escaneo
   anti-hardcode, la proyección se **genera** desde `docs/design-tokens.json` con un script, más
   un gate que comprueba que está al día (regenerar + `git diff --exit-code`). Así la desviación
   entre el JSON y el CSS deja de ser posible en vez de quedar a cargo de la revisión humana, y
   `scan_exclude` pasa a describir lo que de verdad es: salida generada que se comitea.
2. **Las obligaciones de accesibilidad bajan a cada grupo de pantalla** (9–12) y T43 se queda
   como pasada de verificación. Se incluye porque el modo elegido es paso a paso: tal como estaba,
   los checkpoints de las cuatro pantallas se validarían antes de que tuvieran `aria-describedby`,
   los `aria-label` de los botones solo-icono y el `aria-hidden` de la decoración. El humano puede
   vetarlo cuando se le vuelva a presentar la portada.

Portada revisada presentada el 2026-10-18 y **aprobada**. `spec_approved` emitido con
`--iterations=2` (una vuelta de cambios antes de la aprobación: la reversión de D1). Flip a
`harness:status:in-progress`.

Mode: step-by-step
Auto-commit: off

## Step log

**Cadence changed at step 1's checkpoint (2026-10-18), by the human.** Still step-by-step, but
affine `tasks.md` groups now share one checkpoint, so M goes from 13 to **8**. The grouping the
human approved at the spec gate is untouched — only the review-and-checkpoint cadence over it
changes. Resolved step numbers do not shift. The pairing:

| Step | Groups | Why they pair |
| --- | --- | --- |
| 1 ✅ | 1 | tokens — done |
| 2 | 2 | theme: alone, its failure mode (pre-paint on SSR) is its own |
| 3 | 3 + 4 | primitives and composites are one component-library pass |
| 4 | 5 + 6 | the mock dataset and the assets it points at |
| 5 | 7 + 8 | the shell and the first routes that use it |
| 6 | 9 + 10 | login and register — the same split-screen shape |
| 7 | 11 + 12 | invite and profile — one screen plus its states, twice |
| 8 | 13 | the closer: smoke tests, a11y verification, gates |

- step 1/8 (anchor 5cc92b0) — review ×3 (2 rejects: R6's `$type` gate bypassed by a `{token.path}` reference; R6 again — the gate consulted the prototype chain, and nothing guarded its "never silently omit" half) — ledger: criteria 20/20 (basis: requirements), gates 7/7 (basis: config), passes 2/2 → checkpoint: OK

## Next action

Grupo 1 **terminado** (T1–T5), siete gates en verde, todo en el índice y **sin commitear**:
checkpoint humano. Con el OK, el Orchestrator commitea y despacha el Grupo 2 (tema
Claro / Oscuro / Sistema, T6–T8). Si el humano pide cambios, la iteración entra sobre el
índice tal cual está.

## Blockers

None.

## Review evidence — step 1

Per-step review of Group 1 (T1–T5), fresh context, anchor `5cc92b0`, auto-commit OFF.
Verdict: **REJECT** on one point (R6). Everything else listed here passed.
Worktree and index were left exactly as found (`git diff` empty, no untracked leftovers,
no `.bak` stranded); `docs/design-tokens.json` was not modified by the review.

### Gates re-run independently (all seven)

Turbo cache bypassed with `--force` where it applied, so none of these is a replayed log.

| Gate | Result |
| --- | --- |
| `pnpm typecheck` (`turbo run typecheck --force`) | 3/3 packages green, 0 cached |
| `pnpm format:check` | «All matched files use Prettier code style!» |
| `pnpm test` (`turbo run test --force`) | 37 tests green; `scripts/generate-tokens-css.spec.ts` **17 tests** — the `scripts/` include really is collected |
| `pnpm build` (`turbo run build --force`) | built; only the pre-existing `@radix-ui/react-arrow` `"use client"` rolldown warning |
| `pnpm design-tokens:validate` | exit 0 — «147 token(s), 26 file(s) scanned, no hardcoded values», 2 skipped paths: `apps/web/.output/` (git-ignored) and `apps/web/src/tokens.generated.css` (`scan_exclude`) |
| `pnpm design-tokens:contrast` | exit 0 — «56 pair(s) meet their WCAG floor» |
| `pnpm design-tokens:css:check` | exit 0 — «up to date» |

Final `&&`-chained sweep of all seven: green.

### Real run — the gate exercised in both directions, not asserted

Every probe below was one trap-guarded composite command that restored the tree on
every exit path.

- **Byte-stability (R3)** — `shasum` before = `a0a81cf5…`; ran `pnpm design-tokens:css`
  **twice**; `shasum` after = `a0a81cf5…`, identical. `git diff` empty afterwards. No
  date, clock, hostname or version anywhere in the output (the spec also pins this with
  three negative regexes).
- **Path independence** — `--check` run with cwd `apps/web` instead of the repo root:
  still OK. The generator resolves both paths from `import.meta.url`, so a CI step's cwd
  cannot change its answer.
- **R7, falsified for real** — edited `#6c63ff` → `#6c63fe` in `docs/design-tokens.json`
  without regenerating: `--check` **exit 1**, «`apps/web/src/tokens.generated.css` is
  stale — it no longer matches `docs/design-tokens.json`. Run `pnpm design-tokens:css`
  and commit the result.» Token file restored byte-identical.
- **Generated file absent** — exit 1 (message wording flagged below).
- **Generated file hand-edited by one line** — exit 1, «stale».
- **R17 / D2, falsified for real** — a raw `#abcdef` appended to the hand-written
  `styles.css`: `validate` exit 1, `apps/web/src/styles.css:47 [hardcoded-color]`. A raw
  `13px`: exit 1, `[hardcoded-dimension]`. A new `apps/web/src/__probe.tsx` with a hex:
  exit 1. The hand-written half is genuinely still guarded; only the generated path is
  out.

### Mutation probes (hand-probe path; `basis: no-declared-risk`, so beyond the floor)

| Mutant | Outcome |
| --- | --- |
| `generate-tokens-css.ts:212` `if (covered) return;` → `if (!covered) return;` (inverts the subtree coverage gate) | **killed** — 17/17 tests red |
| `generate-tokens-css.ts:117` dangling-reference guard short-circuited with `false &&` | **killed** — 1 test red, 16 pass (precisely attributable) |

No surviving mutant on a changed line. The project can buy the cheap batch instead of
these hand probes by declaring a `test:mutation` script in `package.json`.

### R6 coverage — what was actually checked

`assertProjected` runs over **every** leaf (`for (const leaf of leaves)`) before any
value is projected, so the *subtree* gate is complete, not just over the subset the
namespace map exposes. Verified independently: the spec's own leaf counter
(`countLeaves`, written without reusing the generator) agrees with the `:root`
declaration count on the real file — 147.

The `$type` gate is **not** complete. Probed with a throwaway script
(`/private/tmp/claude-501/-Users-brauliodiez-lemoncode-demo-memora/e1755a81-d274-442a-a863-bad54ef6d592/scratchpad/probe-unknown-type-ref.ts`):

```
input:  component.card.shadow = { $type: 'shadow', $value: '{primitive.color.brand.500}' }
output: NO THROW — "  --component-card-shadow: var(--primitive-color-brand-500);"
```

`projectValue` resolves a `{token.path}` reference and returns **before** the `switch`
that owns the unknown-`$type` throw, so any uncovered `$type` whose value is a reference
is projected silently. `PROJECTED_TYPES` is never consulted as a guard — it only
interpolates into the error message. See the verdict for the fix.

### Spec-side notes (not the Implementer's to fix)

- R18's acceptance criterion reads «No `matcha`, `caramelo` or `espresso` string exists
  in `apps/web/src` or `docs/design-tokens.json`». The strings **do** exist — in the
  token file's `$description`, as the note saying those themes are *not* in this
  delivery. R18's substance holds (absent from the projection; the spec asserts it), and
  the token file is pre-anchor and off-limits to this group. The criterion is literal
  where the requirement is not.
- The same `$description` still says «`apps/web/src/styles.css` is its projection»,
  which D1's reversal made stale: the projection is now `tokens.generated.css`. Editing
  the token file is out of this group's scope, so it is parked here rather than fixed.

## Review evidence — step 1 (re-review, iteration 2)

Per-step review of Group 1 (T1–T5), **fresh context**, anchor `5cc92b0`, auto-commit OFF.
Verdict: **REJECT**, on R6 again — a different hole in the same guard. Everything the
first review passed was re-falsified and still holds. Worktree and index left exactly as
found: every probe ran as a trap-guarded composite, `git status` is byte-identical to the
start, no `.bak` and no probe file anywhere in the tree.

### Gates re-run independently (all seven, turbo cache bypassed with `--force`)

| Gate | Result |
| --- | --- |
| `typecheck` | 3/3 packages green; `@memora/web` ran `tsc --noEmit && tsc --noEmit -p scripts` |
| `format:check` | green — "All matched files use Prettier code style" |
| `test` | 24 web / 42 total green; `scripts/generate-tokens-css.spec.ts` = **22 tests** |
| `build` | green (`vite build` + nitro); only pre-existing `use client` rolldown warnings |
| `design-tokens:validate` | exit 0 — **147 tokens, 26 files scanned, no hardcoded values**, 1 path excluded |
| `design-tokens:contrast` | exit 0 — **56 pair(s)** meet their WCAG floor |
| `design-tokens:css:check` | exit 0 — "up to date" |

### Real run (CLI archetype, both directions)

- `pnpm design-tokens:css` run **twice**: sha1 `a0a81cf5…` before and after, `git status`
  for the generated file unchanged. R3 byte-stability holds in the real process, not only
  inside one test process.
- `pnpm design-tokens:css:check` on the committed output: exit 0.
- Token edited (`#6c63ff` → `#6c63fe`) without regenerating: **exit 1**, "`apps/web/src/
  tokens.generated.css` is stale — it no longer matches `docs/design-tokens.json`. Run
  `pnpm design-tokens:css` and commit the result." Token file restored byte-identical.

### The generated projection is untouched by the fix

sha1 of `apps/web/src/tokens.generated.css` = `a0a81cf5d4638750bb12a20fdbe554f63db12cc1`,
**identical to the hash iteration 1 recorded**. The fix touched guards only, as claimed.
Block shape: `:root` 147 declarations (= every leaf in the token file), `[data-theme='dark']`
+ `[data-theme='system']` 44 between them (22 each, the 22 dark overrides), `@theme inline`
47, `@theme` 1 (`--breakpoint-nav: 76.875rem`). Header names source, generator and gate,
says "do not edit", carries nothing volatile.

### R6 — the type gate, probed rather than read

`projectValue` does call `projectorFor` **before** the reference branch, so the fix is
structural and not a reordering: mutant probe (delete line 184, inline the lookup at line
191 — i.e. restore the pre-fix ordering) was **killed**, with exactly **1 of 22** tests
red, the reference-value test. The two new tests constrain behaviour, not shape.

But the membership test itself is wrong. `PROJECTORS[type]` is a plain-object index, so it
consults `Object.prototype`, and `projector === undefined` is false for inherited members.
Probed against the real module — every one of these **projected silently, no throw**:

```
$type "constructor", literal value   -> --primitive-color-brand-500: primitive,color,brand,500;
$type "constructor", REFERENCE value -> --primitive-color-brand-500: var(--primitive-dimension-radius-lg);
$type "toString"                     -> --primitive-color-brand-500: [object Undefined];
```

and through every path, not just `:root` — the dark override blocks, `@theme inline`
(`--color-primary: var(--semantic-color-primary)`) and the `THEME_LITERALS` breakpoint all
emitted it too. So the answer to "can a value be projected without its `$type` passing the
table" is still **yes**.

**Fix verified in place** (one line, 159): `Object.hasOwn(PROJECTORS, type) ? PROJECTORS[type]
: undefined`. Under it all six prototype cases throw, naming the token path; all **22
existing tests stay green**; the generated file's sha1 is unchanged.

### R6 — the "never silently omit a token" clause

Three node shapes the generator walks past with no error and no output:

```
token with ONLY a dark override and no $value   -> 0 declarations, silent
a bare string where a token object belongs      -> 0 declarations, silent
$extensions['com.lemony.modes'].matcha (no dark) -> the matcha value silently ignored
```

The third is the realistic one: the token file's own root `$description` forecasts matcha /
caramelo / espresso as future themes, so the day someone adds those mode values the
projection ignores them and all seven gates stay green. Also: a `$value` holding two
references (`"{a.b} {c.d}"`) misses `REFERENCE` and is emitted literally as CSS.

Absent-`$type` and DTCG group-level `$type` inheritance both **throw** naming the path
(message reads `Unknown $type "undefined"`), so those are loud, not silent.

### Why the leaf-count test cannot catch any of this

`countLeaves` in the spec recurses with the **same rule** `collectLeaves` uses (`'$value' in
node`, skip `$`-prefixed keys, recurse into objects). It therefore proves the projection
step drops no leaf — a real guard — but it is tautological against a node the generator
does not consider a leaf in the first place, which is exactly this finding's class. The
regression guard has to assert over the token file's **nodes**, not over the generator's
own notion of a leaf.

### Re-falsified, all still passing

- **R16** — exactly one path in `design_tokens.scan_exclude`, exactly one added to
  `.prettierignore`'s generated-sources section, and nothing else. `validate` scanned **26
  files** and excluded **1**, so `styles.css` is demonstrably still inside the scan.
- **R4 / R17** — `styles.css` is imports + `@custom-variant dark` + `@layer base` and
  nothing else. No hex, no `rgb()`/`hsl()`/`oklch()` anywhere under `apps/web/src` outside
  the generated file.
- **R9 / R18** — zero `oklch(`, `--sidebar`, `chart-N`; zero `matcha|caramelo|espresso`
  anywhere under `apps/web/src`. Judged against the **revised** R18: the token file's
  descriptive mention survives the one-line edit.
- **R7** — `checkProjection` is pure, exported and tested on all three outcomes; both
  failure directions re-proved for real (above).
- **R8 / R15 / R19** — `ci.yml` runs `design-tokens:css:check`, never the generator; seven
  entries in `gates:`, seven steps in `ci.yml`, no `continue-on-error`; a red gate really
  does exit non-zero.
- **R10 / R11 / R12** — three selectors present and correctly ordered; `dark:` keyed on
  `data-theme` with no `.dark` left; `@theme inline` carries colour / radius / font /
  spacing and `@theme` the breakpoint literal. `build` green is the proof that
  `styles.css`'s `@apply bg-background text-foreground font-body` resolves against the
  generated `@theme`.
- **`docs/design-tokens.json`** — `git diff --numstat` = **1 insertion, 1 deletion**;
  parsed both versions and compared everything but the root `$description`: **identical**.
  No token value, no `$extensions`. `css:check` green across it confirms a root
  `$description` is not projected.
- **Advisory 4 / type space** — `tsc -p scripts --listFiles` really does load both script
  files and `@types/node`; the app project excludes `scripts`. Premise correction accepted
  and independently re-checked: a `process.cwd()` probe in `src/` typechecks **exit 0**,
  from vite/nitro's own `/// <reference types="node" />`. Pre-existing stack property, not
  a finding.

### Mutation probes (hand path; `basis: no-declared-risk`, so beyond the floor)

| Mutant | Outcome |
| --- | --- |
| line 184 deleted + lookup inlined at 191 (restores the pre-fix ordering) | **killed** — 1/22 red, the reference-value test, precisely attributable |

No surviving mutant on a changed line. The project could buy the cheap batch instead of
hand probes by declaring a `test:mutation` script in `package.json`.

### Spec-side note (not the Implementer's to fix)

R6 and D2 both say "a subtree the generator's **Tailwind-namespace** map does not cover".
The implementation has two maps — `PROJECTED_SUBTREES` (projection coverage) and
`THEME_SUBTREES` (Tailwind namespaces) — and gates on the first. That is the only workable
reading: gating on the Tailwind map would make `primitive.color` itself unprojectable. The
implementation is strictly stronger than the requirement's letter; the wording conflates
the two maps and could be tightened whenever `requirements.md` is next touched.

## Review evidence — step 1 (third review, iteration 3)

Fresh Reviewer, no prior context. Anchor `5cc92b0808a889179f08901b7ee6cc0be4fd2282`,
auto-commit OFF, worktree == index. Verdict **APPROVE**. Ledger
`.claude/state/tasks/11/review-ledger/step-1.json` validated green: criteria 20/20,
gates 7/7 + real run, passes 2/2, no spec-side problems.

### The seven gates, cache bypassed (`TURBO_FORCE=true`)

| Gate | Result |
| --- | --- |
| `typecheck` | ✅ 3/3 tasks, 0 cached — `@memora/web` now checks both projects (`tsc --noEmit && tsc --noEmit -p scripts`) |
| `format:check` | ✅ All matched files use Prettier code style |
| `test` | ✅ 3/3 tasks, 0 cached — 30 green in `apps/web` (28 the generator's spec), 11 `packages/db`, 7 `console-runner` |
| `build` | ✅ successful, 0 cached — only the pre-existing rolldown `"use client"` warnings from radix-ui |
| `design-tokens:validate` | ✅ exit 0 — 147 token(s), 26 file(s) scanned, no hardcoded values; 2 skipped paths |
| `design-tokens:contrast` | ✅ exit 0 — 56 pair(s) meet their WCAG floor |
| `design-tokens:css:check` | ✅ exit 0 — up to date |

`tokens.generated.css` sha1 is still `a0a81cf5d4638750bb12a20fdbe554f63db12cc1`: the
guard-side fix did not move the output by a byte. Regenerating twice left the same sha1
and a clean `git status` for that path (R3).

### R7, both directions, for real

- one colour edited in the token file, not regenerated → rc=1, *"is stale — it no longer
  matches docs/design-tokens.json. Run `pnpm design-tokens:css` and commit the result."*
- generated file moved aside → rc=1, *"does not exist. Run `pnpm design-tokens:css` to
  write it, and commit the result."*

### The live question: can the committed CSS silently stop matching the token file?

Fourteen shapes probed against the generator directly, plus five injected into the **real**
token file. The two headline defect classes of rounds 1 and 2 are closed, and closed
structurally rather than by convention:

| Probe | Outcome |
| --- | --- |
| unknown `$type`, literal value | throws, names path |
| unknown `$type`, **reference** value | throws, names path — round-1 defect closed; the type gate at `projectValue:252` now precedes the reference branch |
| 8 prototype-inherited `$type` names × {literal, reference} = 16 cases | **16/16** throw naming the path — round-2 finding (1) closed by the `Map`, structurally |
| group-level / absent `$type` (DTCG inheritance) | throws `Unknown $type "undefined"`, names path |
| bare value where a token belongs | throws, names path |
| node with only a dark override, no `$value` | throws, names path |
| subtree outside `PROJECTED_SUBTREES` | throws, names path and the generator file |
| reference to a group path / dangling reference | throws, names both paths |
| `$value` mentioning refs without being exactly one (base **and** dark override) | throws, names path |
| `com.lemony.modes` array / `{}` on a real leaf | generator silent, **new node-based guard red** |
| unknown mode `matcha` on a real leaf — the `$description`'s forecast case | **5 tests red** + `css:check` red |
| **group-level** `com.lemony.modes` injected into the real file | `validate` green, `css:check` green — the exact all-gates-green shape — and the **new guard red**, naming `semantic.color` |

The last row is the one that matters: it proves the new guard is **independent of the
generator's own notion of a leaf**, not tautological. `pathsDeclaringModes` finds nodes by
the presence of the extension and recurses through every non-`$` key regardless of
`$value`, so it sees exactly what `collectLeaves` cannot. The set that guards and the set
that writes are now the same set, and the `toHaveLength(declared.length)` on both dark
blocks closes it in both directions — an override can neither go missing nor appear from
nowhere.

### Mutation probes (hand path; `basis: no-declared-risk`, so beyond the floor)

| Mutant | Outcome |
| --- | --- |
| `overridden … .slice(1)` — drop one dark override | **killed**, 3/28 red, the failing assertion names the missing path |
| `children.slice(1)` in `collectLeaves` — drop one child per group | **killed**, 24/28 red |
| `const overridden = leaves` — dark blocks carry every leaf | **killed**, 14/28 red |
| group-level mode injected into the real token file (guard-independence mutant) | **killed**, 1/28 red, `css:check` and `validate` both green — only the new guard speaks |

No surviving mutant on a changed line. Tree verified identical after every probe; no
`.bak` stranded. The project could buy the cheap batch instead of hand probes by declaring
a `test:mutation` script in `package.json`.

### R12 verified end to end, not only in the generated text

`@theme inline` holds 47 keys and `@theme` holds `--breakpoint-nav: 76.875rem`. Built the
app for real against a throwaway probe component and read the emitted stylesheet:

```
.bg-primary{background-color:var(--semantic-color-primary)}
.rounded-card{border-radius:var(--semantic-radius-card)}
.font-body{font-family:var(--semantic-typography-body-family)}
.p-4{padding:var(--primitive-dimension-space-4)}
.text-link{color:var(--semantic-color-link)}
@media (width>=76.875rem)
```

All four namespaces resolve to the generated custom properties and `nav:` compiles to its
media query. Probe removed, committed build output restored. This is D2's Tailwind claim
measured against the shipped generator rather than against the throwaway one.

### R16 / R17 boundary

`scan_exclude` holds one entry and `validate` itself reports one `scan_exclude` path
covering 1 file. `.prettierignore` adds that same single path beside the pre-existing
`**/routeTree.gen.ts`, which T4 names as its intended neighbour. `styles.css` is provably
still inside the scan: appending `.probe { color: #abcdef; padding: 7px; }` to it produced
`[hardcoded-color]` and `[hardcoded-dimension]` at `styles.css:47` and **rc=1** — which is
what makes the CI step fail (R17, R19). Reverted.

### Advisories — none of these blocks the group

All four generator advisories are **latent**: I walked the real token file independently
and it has 147 leaves, no node carrying both a `$value` and children, 22 mode-declaring
nodes all of which are leaves, and no two paths colliding on one custom property. Every
block of the generated file is duplicate-free.

1. **`generate-tokens-css.ts:55` — the one route that is silent at system level.** An
   `$extensions` that is not an object is coerced to `{}`, so a mode override written that
   way vanishes with no error: probed on the real file, `validate` green, `css:check`
   green, 28/28 tests green. It takes replacing an object with a string to reach, which is
   why it is an advisory and not a finding. Two lines in `modesOf` would close it.
2. **`generate-tokens-css.ts:89` — a node holding both a `$value` and child tokens** drops
   the whole child subtree without a word; it is the last unhandled branch of the
   token-vs-group classification, and `countLeaves` shares the early return so it cannot
   see it either. I weighed this as a rejection and then measured it: `design-tokens
   validate` **does** catch it, loudly and by name —
   `[malformed-token-file] token "semantic.color.background" has both a $value and nested
   group(s) (hover) — a token cannot also be a group.` The drift route is mechanically
   closed by a declared gate and a CI step, which is the guarantee the human reversed a
   decision to get; what is missing is only that the *generator* does not also speak. The
   most plausible author mistake here — adding `semantic.color.primary.hover` inside the
   existing `primary` token — is therefore blocked, not silent.
3. **`generate-tokens-css.ts:95`** — `String(node.$type)` coerces, so `$type: ["color"]`
   passes the `Map` as `"color"`. It projects as intended, but it is the one remaining
   place where the accepted set is wider than the table.
4. **`generate-tokens-css.ts:124`** — two distinct paths can kebab to the same custom
   property (`space.4` vs `space-4`); both declarations are emitted and CSS last-wins,
   and the leaf-count guard counts lines rather than names. Reachable only after the
   author regenerates and commits, since any added token first turns `css:check` red.
5. **`generate-tokens-css.spec.ts:29`** — `blockOf` slices to the first `}` after the
   selector. Correct while no declaration block contains a nested brace; a future nested
   at-rule would make the helper silently under-read the block it asserts on.

### Not re-raised

The six items the invocation settled with earlier evidence, and the R6/D2
"Tailwind-namespace map" wording the human owns. I independently reached the same reading
the previous round recorded: gating on `THEME_SUBTREES` would make `primitive.color`
itself unprojectable, so `PROJECTED_SUBTREES` is the only workable gate and the
implementation is stronger than the requirement's letter.
