# Progress — #11 Base de diseño, shell y flujo de acceso del frontal de Memora

**Status**: spec-in-progress
**Branch**: `harness/11-base-shell-acceso`
**Part 1 of #10** (partition plan, chain 1 → 2 → 3)
**PRD**: `docs/prds/frontal-memora-2026-10-18.md`

## Active

**Status**: implementing — Group 2 (tema Claro / Oscuro / Sistema), step-by-step,
auto-commit **off** (save-points in the git index, zero commits).

**Active subtask**: none — **Group 2 complete (T6–T8)**, all seven gates green, the real path
exercised in Chrome against the production build, everything staged and uncommitted, awaiting
the human checkpoint. Group 3 not started.

Group 1 (T1–T5) is done, reviewed over three rounds and committed at `6ea1697`; its record
below is kept verbatim.

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

## Group 2 — Tema Claro / Oscuro / Sistema (T6–T8), 2026-10-18

Tres tareas, treinta cycles de TDD en total contando los que salieron verdes de nacimiento
(dicho abajo cuáles y por qué), 85 tests nuevos: 63 en `theme.spec.ts` y 22 en
`theme-provider.component.spec.tsx` (19 + los 3 de la iteración 2). El suite de `@memora/web`
pasa de 93 a 115.

**Entorno de test declarado.** `theme.spec.ts` → **jsdom**, porque `readStoredTheme`,
`persistTheme` y el script de arranque mueven `localStorage` y `document.documentElement`, que
son DOM y no lógica pura. `theme-provider.component.spec.tsx` → **jsdom + Testing Library**,
que es la convención que ya tiene el repo (`vitest.config.ts` con `environment: 'jsdom'`,
`vitest.setup.ts` con el `cleanup`, `home-page.spec.tsx`, y D14). La tabla del skill `tdd`
pide un navegador de verdad para los specs de componente; este repo no tiene browser mode por
decisión explícita, así que se aplica la convención del repo y **queda dicho** aquí.

**Playbooks cargados**: ninguno. `docs/playbooks/` sólo tiene el `README.md` de la convención
de lookup; no hay ningún playbook de tema, y su ausencia no es un blocker.

### T6 — `common/theme/theme.ts`

Nueve cycles rojo → verde, uno por comportamiento, en el orden en que empujaron el código:

1. `readStoredTheme` devuelve el tema guardado → el vocabulario `THEMES` y la clave.
2. Sin nada guardado cae en «Sistema» → `DEFAULT_THEME` y el `??`.
3. **Catorce valores hostiles** guardados (`matcha`, `espresso`, `Dark`, `LIGHT`, ` dark `,
   `''`, `'   '`, `light,dark`, JSON, `'"dark"'`, `null`, `undefined`, `0`, `true`) → esto es
   lo que mató el `??` y trajo `isTheme`. El conjunto aceptado es **exactamente** los tres
   literales: ni se recorta, ni se baja a minúsculas, ni se coacciona. Deliberado, y es la
   lección de las tres rondas del Grupo 1 — el conjunto que una guarda acepta tiene que ser
   el que de verdad maneja, y estrechar es el lado seguro.
4. Las **tres** formas en que el almacenamiento puede fallar → `try` + `?.`: el acceso a
   `window.localStorage` lanza (modo privado), `getItem` lanza (datos de sitio bloqueados),
   y no existe `localStorage` (fuera del navegador). Ninguna propaga.
5. `persistTheme` ida y vuelta con los tres temas.
6. `persistTheme` contra las mismas tres formas de fallo, más cuota agotada.
7. `resolveTheme` con tema explícito ignora al sistema operativo.
8. `resolveTheme('system', …)` sigue a `prefers-color-scheme`.
9. `resolveTheme` con once valores no reconocidos (nulo, indefinido, `matcha`, `System`,
   `''`, ` system `, `0`, `false`, un objeto, un array, `NaN`) sigue al sistema.

**El cycle 9 salió verde de nacimiento, y conviene decir por qué.** El paso mínimo del cycle
7 fue `stored === 'light' || stored === 'dark' ? stored : …`, que es **extensionalmente igual**
a la guarda completa: no existe ninguna entrada que distinga las dos implementaciones, así que
no había rojo posible. El refactor posterior pasó `resolveTheme` por `isTheme`, para que el
vocabulario viva en un solo sitio y no en dos listas que puedan separarse.

**Probe a mano (A)** — ensanchar `isTheme` con `.trim().toLowerCase()`: **5 tests en rojo**.
La batería hostil muerde.

### T7 — `__root.tsx`: fuentes y script de pre-pintado

El script en línea **no se escribe a mano**: `THEME_BOOTSTRAP_SCRIPT` se genera en `theme.ts`
interpolando `DEFAULT_THEME`, `THEME_STORAGE_KEY`, `THEMES` y `THEME_ATTRIBUTE`. Corre en el
documento servido, antes de que exista ningún bundle, así que **duplica la lógica pero no los
datos** — y por construcción el conjunto que acepta el script es el mismo que acepta `isTheme`.
Añadir un tema al vocabulario lo añade a los dos a la vez. Decisión de diseño, no comodidad:
era el sitio exacto donde dos listas se habrían separado en silencio.

Tres cycles (10–12): el script pinta el tema guardado; cae en «Sistema» con los catorce
valores hostiles y sin nada guardado; y pinta «Sistema» **sin lanzar** con las tres formas de
almacenamiento inservible. Los cycles 11 y 12 **salieron verdes de nacimiento**, que es
precisamente la consecuencia de haber generado el script desde el vocabulario en el cycle 10 —
no puede ser más ancho. Como no hubo rojo, se probaron a mano:

- **Probe B** — meter el `setAttribute` dentro del `try`: el `perl` dejó el script en error de
  sintaxis en lugar de la mutación buscada (21 tests en rojo). Prueba que los tests cazan un
  script roto, pero no la semántica que se quería; la cubre la C.
- **Probe C** — quitar el `try/catch`: **3 tests en rojo**, los tres de almacenamiento
  inservible. Es decir: si el error escapase, nunca se llegaría al `setAttribute` y `<html>`
  se quedaría sin atributo — y eso se cazaría.

El wiring de `__root.tsx` en sí es configuración (el skill `tdd` lo excluye explícitamente):
se verifica ejecutando, no aseverando. Nueve comprobaciones estructurales sobre el documento
**realmente servido** (dev y prod) en `check-prepaint.mjs`.

**Un hallazgo del run real que cambió un comentario.** El script está escrito antes de
`HeadContent`, pero **React 19 iza las hojas de estilo por encima** y en el documento servido
acaba al final del `<head>`. Da igual para R22 — lo que garantiza el pre-pintado es que esté
en el `<head>` y sea bloqueante, no su posición relativa — pero el comentario afirmaba lo
contrario y se corrigió. Un comentario que miente es exactamente lo que una review falsadora
encuentra.

**Fuentes (R75)**: los dos `preconnect` que indica Google Fonts (`fonts.googleapis.com` para
el CSS y `fonts.gstatic.com`, otro origen, con `crossorigin`) más una hoja `css2` con rangos
de peso variables `400..800` por familia — cubre los cinco pesos que proyecta el fichero de
tokens (400/500/600/700/800) con un fichero por familia en vez de uno por peso.

### T8 — el proveedor de tema

Seis cycles (13–18). Los reds de verdad: el proveedor no existía (13), `setTheme` no existía
(14), `resolvedTheme` estaba cableado a `false` (15), no había suscripción a
`prefers-color-scheme` (16), y el atributo del DOM podía quedarse suelto (17 — cuatro tests en
rojo). El cycle 18 (la guarda de `useTheme` sin proveedor y R26 con dos consumidores) salió
verde de nacimiento: el contexto y la guarda venían del primer verde del cycle 13.

Las decisiones que no se leen en el código:

- **Arranca del atributo, no del almacenamiento.** El script de pre-pintado ya decidió; volver
  a leer `localStorage` en React crearía una segunda fuente de verdad que puede discrepar de la
  primera (D11). El primer test del fichero lo falsa poniendo el atributo en `dark` y el
  almacenamiento en `light`. **Probe D** — cambiar `readThemeFromDocument` por
  `readStoredTheme`: **5 tests en rojo**.
- **`setTheme` escribe el atributo de forma síncrona, en el manejador, no en un efecto.** Un
  efecto pasivo corre *después* del pintado, así que el cambio se vería un fotograma tarde;
  R27 pide instantáneo.
- **Además hay un efecto con dependencia `[theme]` que reconcilia el atributo.** Cierra dos
  huecos reales: que la hidratación revierta `<html>` al valor del servidor, y que el script en
  línea no haya corrido (una CSP sin `unsafe-inline`, una extensión) o haya dejado basura —
  en los dos casos el DOM se quedaría con un `data-theme` que ningún selector de
  `tokens.generated.css` reconoce. En un cambio de tema es un no-op.
- **El servidor sirve «Sistema»**, que es el único valor honesto sin leer nada del cliente y
  además el que ya pinta bien por `prefers-color-scheme` gracias al brazo `@media` del Grupo 1.
- **El proveedor se monta en la raíz, no en el shell `_app`**: el tema tiene que valer también
  en las rutas que se abren directamente por URL y quedan fuera del shell (R23), y los dos
  controles de `/profile` han de leer un único estado (R26).
- **Superficie pensada para dos consumidores** (R26, sin construir ninguno): `theme` (lo que
  marca el control), `resolvedTheme` (el modo que se pinta, «Sistema» ya resuelto — lo que el
  botón «Tema: Sistema» de escritorio necesita para su icono) y `setTheme`. El test de R26
  monta dos consumidores hermanos y cambia desde uno.
- **`useMemo` en el valor del contexto**: un re-render del padre (un cambio de ruta mueve
  `children`) no debe invalidar el contexto sin que el tema haya cambiado.

**`suppressHydrationWarning`: medido, no supuesto.** El comentario original decía que era
«obligado». **Probe E** lo quitó, rebuildeó y volvió a correr Chrome: con React 19.3 y el
`shellComponent` de Start **no aparece ningún aviso**, y todo sigue funcionando. Se queda —
la divergencia servidor/cliente en `<html>` es real y deliberada, y silenciarla no debe
depender de que una versión de React siga sin avisar — pero el comentario se reescribió para
decir lo que se midió. El primer intento de esta probe fue un **no-op** (el patrón no casaba
con el JSX de una línea tras prettier) y se repitió; queda dicho para que nadie dé por
medido lo que no se midió.

### Verify — Grupo 2

Los siete gates declarados, en orden, parando al primer fallo:

| Gate                      | Resultado                                                           |
| ------------------------- | ------------------------------------------------------------------- |
| `typecheck`               | ✅                                                                  |
| `format:check`            | ✅                                                                  |
| `test`                    | ✅ 115 en `@memora/web` (93 → 115), 133 en el monorepo              |
| `build`                   | ✅                                                                  |
| `design-tokens:validate`  | ✅ 147 tokens, 30 ficheros, sin hardcodes                           |
| `design-tokens:contrast`  | ✅ 56 pares                                                         |
| `design-tokens:css:check` | ✅ `tokens.generated.css` al día (no se tocó)                       |

`pnpm audit --audit-level=moderate` → sin vulnerabilidades conocidas. No hay linter (decisión
explícita del proyecto: sólo Prettier).

**El camino real, ejercitado y no aseverado** (archetype SSR). El riesgo de este grupo no está
en los tests: un tema leído en React en vez de antes del primer pintado produce un destello o
un desajuste de hidratación, y **ninguna de las dos cosas sale en rojo en un test**. Así que
se levantó el build de producción (`node .output/server/index.mjs`) y se condujo **Chrome de
verdad** por CDP sobre el `WebSocket` global de Node — sin añadir ninguna dependencia al repo.
**25/25 comprobaciones**:

- Sin nada guardado: `<html>` queda en «system», sin avisos de hidratación y sin excepciones.
- Con «dark», «light» y «system» guardados: el documento **hidratado** se queda en el tema
  guardado, los tres sin aviso de hidratación. Esto es lo que prueba que el pre-pintado
  sobrevive a React, que es la pregunta de verdad.
- Con `matcha`, `Dark`, `''`, `'  '`, `{"theme":"dark"}` y `null` guardados: los seis caen en
  «system» y ninguno lanza en la página.
- Ni `<html>` ni `<body>` tienen transición (`transition-duration: 0s`), así que el cambio de
  `data-theme` no puede hacer cross-fade (R27).
- Con «Sistema», emular `prefers-color-scheme: dark` **repinta sin recargar** (el
  `background-color` computado de `<body>` cambia de verdad) y el atributo sigue siendo
  «system» (R21).
- Con «Claro» explícito, emular el SO en oscuro **no cambia nada** (R20).

Los dos scripts del run quedan fuera del repo, en el scratchpad de la sesión:
`check-prepaint.mjs` (estructura del documento servido) y `cdp-theme-check.mjs` (Chrome).

Lo que **no** se pudo ejercitar en navegador: `setTheme` desde un control, porque en este
grupo no hay control — `ToggleGroup` y `Menu` llegan en los grupos 3–4 y el control en el 12.
En unit está cubierto que, para los tres temas, `setTheme` deja el atributo, la persistencia y
el estado donde deben estar, **y que la escritura del atributo ocurre dentro del manejador,
antes de que React vacíe los efectos** — lo segundo sólo desde la iteración 2, y la primera
versión de esta frase afirmaba una garantía que ningún test imponía (ver abajo).

### Lo que este grupo deja pendiente a otros, dicho antes de que sorprenda

**El `transition-all` de los primitivos y R27.** §8 del handoff admite dos cosas a la vez:
transiciones de color de 150 ms en hover/focus de botones, enlaces y nav (punto 1), y un
cambio de tema **instantáneo y sin cross-fade** (punto 4). Hoy no hay conflicto: no existe
control de tema, y ni `<html>` ni `<body>` tienen transición — medido arriba. Pero el `Button`
de shadcn que ya está en el repo lleva `transition-all`, y una utilidad `transition-*` en un
componente hace que **ese** componente sí interpole su color cuando `data-theme` cambia. No es
de este grupo (el `Button` lo viste el Grupo 3 y el control lo monta el 12), y **no se ha
inventado aquí ningún mecanismo** de supresión de transiciones: §8 dice que todo lo que no
esté en su lista es over-delivering, y ese mecanismo no está en la lista. Queda anotado para
que el Grupo 3 acote la transición a hover/focus en vez de a `all`, o para que el 12 lo
resuelva a la vista del control real. Decidirlo aquí, sin control que mirar, habría sido
improvisar.

**`resolvedTheme` en SSR desacuerda con la hidratación — restricción para el Grupo 12.**
`readSystemPrefersDark` devuelve `false` en el servidor (no hay `matchMedia`), así que el
servidor resuelve siempre `system` → `'light'`, mientras que el render de hidratación del
cliente resuelve la preferencia real. **Hoy el grupo está limpio**: nadie consume
`resolvedTheme`, así que no hay nada que pueda desacordar. Pero el botón «Tema: Sistema» de
`Profile-D` (§4 del handoff) renderiza exactamente eso, y en un sistema operativo en oscuro
**hidratará en desacuerdo con el servidor**. Quien monte el control necesita una de dos: una
puerta de montaje (no pintar el modo resuelto hasta después de montar) o `useSyncExternalStore`
con un snapshot de servidor. **No se ha inventado aquí ese mecanismo** — no hay consumidor
contra el que probarlo, y es la misma decisión que con el `transition-all`: construir sin nada
que mirar es improvisar. Queda escrito aquí para que el Grupo 12 no pueda no verlo.

**Clave de almacenamiento**: `memora.theme`. D11 fija `localStorage` pero no el nombre; no
parecía un bifurcación que merezca un discovery.

**Nota de la review que conviene no perder**: el vocabulario de temas vive en **cuatro**
sitios, no tres — `theme.ts`, el script generado, la lectura del atributo en el proveedor y
**el CSS** (`tokens.generated.css`, que es el cuarto). El cuarto queda fuera de alcance porque
R20 fija tres temas y el CSS lo genera el Grupo 1 desde el fichero de tokens.

### Fix-loop iteration 2 — review REJECT (rechazo 1 de 3 como máximo)

**El hallazgo bloqueante, y tenía razón.** Borrar `applyThemeToDocument(next)` de `setTheme`
dejaba el suite en **82/82 verde**. El efecto reconciliador con dependencia `[theme]` vuelve a
poner el atributo y `act()` lo vacía antes de que corra cualquier aserción, así que **ningún
test podía distinguir la escritura síncrona de una con un fotograma de retraso**. La
implementación era correcta; lo que no existía era la restricción. Y lo que lo hacía
bloqueante en vez de advisory: `progress.md` — el documento que el humano lee en el
checkpoint — afirmaba que esa escritura síncrona estaba cubierta. Es la clase de defecto del
Grupo 1 una capa más arriba: **una garantía afirmada más ancha que la garantía realmente
impuesta**, esta vez en la prosa en lugar de en una guarda.

Arreglado con tres tests (uno por tema) que leen el atributo **dentro** del callback de `act`,
justo después de `setTheme`, que es el instante que vería un manejador de click real. Y
**verificado contra el mutante**, no sólo pasando: con `applyThemeToDocument(next)` borrada,
**3 tests en rojo** (85 → 3 failed / 82 passed) donde antes sobrevivía a 82/82.

**Advisory 1 — arreglado, y el gate estaba sucio de verdad.** `TURBO_FORCE=true pnpm test`
imprimía `The current testing environment is not configured to support act(...)`, y sólo se
reproduce a través de turbo, que es exactamente como está declarado el gate y como corre CI.
Causa: `theme-provider.component.spec.tsx` es el único spec que importa `act` de `'react'`
directamente, y el `act` envuelto de Testing Library pone y restaura
`IS_REACT_ACT_ENVIRONMENT` en cada llamada, así que el desnudo la encuentra sin poner. Con eso
el suite entero perdía la red de React de «update not wrapped in act». Arreglado con una línea
en `apps/web/vitest.setup.ts`. **Medido en los dos sentidos**: con la bandera **0** avisos;
quitándola (probe con trap), **11** — 8 antes de los tres tests nuevos de esta iteración, que
cuadra con lo que midió la review. El suite verde en los dos casos, así que los tests no eran
inválidos; lo que faltaba era la red.

**Advisory 3 — quitados los dos `preconnect`, y por medición.** React 19 iza los
`<link rel="stylesheet">`, así que en el documento servido los dos `preconnect` acaban detrás
de la hoja `css2` que debían precalentar. En vez de decidirlo por lectura, se midió en Chrome
con el dominio `Network` de CDP contra el build de producción: la petición de `css2` **abre
ella misma** la conexión a `fonts.googleapis.com` (`connectStart` 8,9 ms), y de los dos
`.woff2` de `fonts.gstatic.com` **uno abre la conexión** (`connectStart` 0) y el otro la
reutiliza. Conclusión: ninguno de los dos `preconnect` calentó nada. El primer sondeo parecía
decir lo contrario — la primera respuesta de gstatic salía como «reutilizada» — y habría dado
un comentario falso más; mirar **las dos** respuestas en vez de la primera es lo que lo
deshizo. Se quitan. R75 sólo pide el `<link>` a Google Fonts y se sigue cumpliendo.

Van ya **cuatro** afirmaciones de este grupo falsadas por un run real (el orden del script en
el `<head>`, la necesidad de `suppressHydrationWarning`, la cobertura de la escritura síncrona
y la utilidad de los `preconnect`). No es casualidad: en este grupo el comportamiento que
importa no está en el suite, así que cualquier cosa que se afirme sin medir es una apuesta.

**Trampa de entorno, anotada porque invalidó una medición de la review.** Había un `pnpm dev`
viejo escuchando en `[::1]:3000`, y un `node .output/server/index.mjs` que se bindea a `*:3000`
hace que `curl http://localhost:3000` resuelva al **servidor de desarrollo**. Todas las
mediciones de esta iteración se hicieron en **puertos explícitos y libres**: `3241` para el run
de fuentes y `3242` para el run final de producción. Al medir producción, puerto explícito
siempre; `3000` no.

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
- step 2/8 (anchor 6ea1697) — review ×2 (1 reject: R27's synchronous write is constrained by no test — the mutant survives — while progress.md claimed it covered) — ledger: criteria 8/8 (basis: requirements), gates 7/7 (basis: config), passes 2/2 → checkpoint: OK

## Next action

Grupo 2 **terminado** (T6–T8), siete gates en verde, 25/25 comprobaciones en Chrome contra el
build de producción, todo en el índice y **sin commitear**: checkpoint humano. Con el OK, el
Orchestrator commitea y despacha el Grupo 3 (primitivos shadcn vestidos con los tokens,
T9–T12). Si el humano pide cambios, la iteración entra sobre el índice tal cual está.

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

## Review evidence — step 2

**Verdict: REJECT** — one blocking finding, two advisories. Anchor
`6ea16975870a749628a08aba9df71cc3dbdfe00b`, group diff reviewed uncommitted from the index
(worktree == index confirmed). Fresh context; nothing from the Implementer's record trusted
without re-derivation. The tree was exactly as found at the end: no stranded mutant, no `.bak`,
no change to the five reviewed files.

### Gates re-run independently (all seven, `TURBO_FORCE=true`)

| Gate | Result |
| --- | --- |
| `typecheck` | ✅ 3 packages, cache bypassed |
| `format:check` | ✅ all matched files |
| `test` | ✅ 112 in `@memora/web`, 130 in the monorepo — **but see advisory 1: 8 stderr errors** |
| `build` | ✅ (the `"use client"` MODULE_LEVEL_DIRECTIVE warnings are radix's, pre-existing) |
| `design-tokens:validate` | ✅ 147 tokens, 30 files, no hardcoded values, 1 excluded path |
| `design-tokens:contrast` | ✅ 56 pairs |
| `design-tokens:css:check` | ✅ `tokens.generated.css` untouched by this group |

`pnpm audit --audit-level=moderate` not re-run as a gate (undeclared); no dependency was added
by this group.

### Real run — the production build in real Chrome, re-derived not trusted

**A stale `pnpm dev` (vite, pid 67168) was listening on `[::1]:3000` throughout.** The first
`node .output/server/index.mjs` bound `*:3000`, so `curl http://localhost:3000` resolved to the
**dev** server and returned dev-marked HTML (`data-tanstack-router-dev-styles`,
`/@id/virtual:tanstack-start-dev-client-entry`). Re-run on `PORT=3123` to measure the real
production build. Anyone measuring "prod" on port 3000 on this machine is measuring dev.

Served production bytes (`http://127.0.0.1:3123/`): `<html lang="es" data-theme="system">`, and
the inline bootstrap is the **last element inside `<head>`**, a classic script with no `async`,
no `defer`, no `type=module` — so it is parser-blocking and cannot be reached after `<body>`
starts painting. R22's mechanism is sound in the bytes, not only in the comment. The two
Google Fonts `preconnect`s and the `css2` stylesheet are there (R75).

A CDP driver written for this review (`rev-cdp.mjs`, scratchpad) installs a `data-theme`
`MutationObserver` **via `Page.addScriptToEvaluateOnNewDocument`, i.e. before the page's own
inline script runs**, so a flicker (script sets `dark` → hydration reverts to `system` → effect
restores `dark`) cannot hide behind a post-load snapshot. Chrome 155 headless,
`Emulation.setEmulatedMedia` for the OS preference. **66/66 passed**:

- **The attribute is set before first paint, measured.** stored `light`/`dark`/`system`: first
  mutation at 73.2 / 69.9 / 61.3 ms, `first-contentful-paint` at 84 / 88 / 76 ms. The attribute
  was already the stored value at the first `requestAnimationFrame` in all three.
- **No flicker, ever.** The full mutation trace per load is exactly two entries and both carry
  the same value — the script's set (`system`→`dark`) then the provider's effect re-asserting it
  (`dark`→`dark`). Hydration never reverted `<html data-theme>`. This is the group's load-bearing
  claim and it holds.
- No hydration warning or page exception on any load (the only console error is
  `/favicon.ico` 404 — pre-existing, no favicon is in scope yet).
- 13 hostile stored values (`matcha`, `Dark`, `LIGHT`, `' dark '`, `''`, `'   '`, `light,dark`,
  `{"theme":"dark"}`, `'"dark"'`, `null`, `undefined`, `0`, `true`) → all `system`, all already
  `system` at the first rAF, none throwing.
- Nothing stored → `system`, **and the provider wrote nothing into storage** — D11's "the
  attribute is the only source" verified from the storage side, not just the read side.
- A `Storage.prototype.getItem` that throws, installed in real Chrome before page scripts: the
  page still renders and `data-theme` is a valid token.
- R27's no-cross-fade half: `transition-duration` is `0s` on both `<html>` and `<body>`.
- R21: under `system`, emulating `prefers-color-scheme: dark` repaints with no reload —
  `<body>` background `rgb(248,250,252)` → `rgb(8,15,25)` — and the attribute stays `system`.
- R20: with `light` stored, an OS switch to dark changes nothing (`rgb(248,250,252)` both
  sides); with `dark` stored and the OS on light the page really is dark (`rgb(8,15,25)`).
- R23 beyond the index route: `/profile` (a 404 today) still serves `data-theme="system"` and
  the bootstrap script, so the pre-paint path rides the root shell and will cover every route
  the later groups add.

### The cross-layer vocabulary question — falsified, and it holds

The theme vocabulary lives in four places, not three: `isTheme`, the generated bootstrap
script, the provider's attribute read, and `tokens.generated.css` (`:root` light /
`[data-theme='dark']` / `@media(dark) [data-theme='system']`, plus `styles.css`'s `dark:`
variant). I looked for a value that one layer accepts and another does not:

- The script's accepted set is `["light","dark","system"].indexOf(stored) !== -1` — SameValueZero
  on strings, **generated from `THEMES`**, so it cannot be wider than `isTheme`. No trimming, no
  case folding, no coercion in any of the three.
- Every writer to `data-theme` is gated: the server JSX writes `DEFAULT_THEME`; the script writes
  only vocabulary values; the effect writes `theme`, sourced either from the `isTheme`-gated
  attribute read or from `setTheme`.
- `setTheme` is the one writer with no runtime re-validation — its accepted set is `Theme`,
  enforced by the compiler only. There is no caller yet and no `as` cast, so it is unreachable
  today; a session-local garbage value would also self-heal on the next load (script → `system`).
  Narrower than Group 1's defect, and deliberately on the safe side. Noted, not a finding.
- The CSS vocabulary is **not** generated from `THEMES` (it comes from the token file's dark
  block), so a fourth theme would reach `isTheme` and the script but not the CSS. R20 fixes
  exactly three themes, so this is out of scope — but the code comment's "adding a theme to the
  vocabulary adds it to both" is true only of the two JS layers.

### Mutation probes (hand path; the group declares no `[risk: …]`, so all eight are beyond the floor)

Each one composite trip, trap-guarded, `src/common/theme` as the focused suite (82 tests).

| # | Mutation | Outcome |
| --- | --- | --- |
| M1 | `setTheme` loses its synchronous `applyThemeToDocument(next)` (line 106) | **SURVIVED — 82/82 green** |
| M2 | the reconciling effect no longer applies the theme (line 99) | killed, 4 red |
| M3 | `readStoredTheme`'s `isTheme` gate → a null check | killed, 14 red |
| M4 | the bootstrap script accepts everything (`indexOf(...) !== -2`) | killed, 15 red |
| M5 | `resolveTheme`'s `isTheme` gate → a null check | killed, 9 red |
| M6 | the provider initialises from `readStoredTheme` instead of the attribute (D11) | killed, 5 red |
| M7 | `readThemeFromDocument`'s `isTheme` gate dropped | killed, 3 red |
| M8 | `useMemo` deps lose `systemPrefersDark` | killed, 1 red |

Seven of eight killed, and the three hostile batteries bite hard — the Group-1 defect class
(an accepted set wider than the handled set) is genuinely guarded here, in all three JS layers.
M6 reproduces the Implementer's Probe D at the same count (5 red), so that claim checks out.

**The project can buy the cheap batch**: declaring a `test:mutation` script in `package.json`
(Stryker or any mutation tool) switches the next review to the scripted path instead of eight
hand-probe round trips.

### BLOCKING — M1: R27's "instantly" is constrained by nothing, and the record says otherwise

Deleting `applyThemeToDocument(next)` from `setTheme` leaves **82/82 green**. The suite cannot
tell the synchronous write from a frame-late one, because the `[theme]` reconciling effect
re-applies the attribute and `act()` flushes it before any assertion runs. So R27's defining
property — "swap `data-theme` **instantly**" — rests on a code comment, not on a test.

The implementation is **correct**; the constraint is missing. What makes it blocking rather than
advisory is the second half: `progress.md` tells the human, at the checkpoint, *"Su escritura
síncrona está cubierta en unit (los tres temas, atributo + persistencia + estado)"*. That claim
is false, and M1 is its counter-example — the same shape as Group 1's rejections, one layer up: a
claimed guarantee wider than the guarantee actually imposed. The human is being asked to approve
a checkpoint partly on it, and Group 12 is where the control that can break this property gets
built — long after this step closes.

**The gap is closable in one pass, and the test is written and verified.** Reading the attribute
synchronously inside the `act` callback, before React flushes, separates the two
implementations — `setThemeState` is batched and effects run at `act`'s exit, so only the
synchronous write can have landed yet:

```tsx
describe('ThemeProvider · R27 — la escritura es síncrona con el gesto', () => {
  it('el atributo ya está puesto antes de que React vacíe los efectos', () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light');
    renderConProveedor();

    let atributoDuranteElManejador: string | null = null;
    act(() => {
      cambiarTema('dark');
      atributoDuranteElManejador =
        document.documentElement.getAttribute(THEME_ATTRIBUTE);
    });

    expect(atributoDuranteElManejador).toBe('dark');
  });
});
```

Measured both ways: **83/83 green on the real code**, and **1 failed / 82 passed against M1**.
It kills the survivor. Take it or write a better one, and correct the coverage sentence in
`progress.md` to say what is actually covered.

### Advisory 1 — the `test` gate prints 8 errors to stderr, and the record calls it clean

`TURBO_FORCE=true pnpm test` emits `The current testing environment is not configured to support
act(...)` **8 times**, all from `theme-provider.component.spec.tsx`. Introduced by this group —
it is the only spec importing `act` from `'react'` directly, and RTL's own wrapped `act` sets and
then restores `IS_REACT_ACT_ENVIRONMENT`, so the bare one sees it unset.

Reproduces only through turbo (`pnpm test` → 8; `pnpm --filter @memora/web test` → 0;
`npx vitest run` → 0; `CI=true` → 0), i.e. exactly the way the project declares the gate and CI
runs it. The tests are **not** invalid — removing an `act()` wrapper makes 2 tests fail, so `act`
is really flushing — but the suite loses React's "an update was not wrapped in act" net, and a
green gate that prints eight errors trains the reader to skim.

Verified fix, one line in `apps/web/vitest.setup.ts`:

```ts
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
```

→ turbo warning count **8 → 0**, suite still green. (Importing `act` from
`@testing-library/react` instead of `'react'` is the equivalent fix.)

### Advisory 2 — `resolvedTheme` will hydration-mismatch the moment a control renders it

`readSystemPrefersDark` returns `false` on the server (no `matchMedia`), so the server always
resolves `system` → `'light'`, while the client's hydration render resolves the real preference.
Nothing consumes `resolvedTheme` yet, so there is no mismatch today — this group is clean. But
Group 12's «Tema: Sistema» button is specified to render exactly that (handoff §4, the `monitor`
icon), and on a dark-preferring OS it will hydrate text/icon that disagrees with the server.
Whoever builds it needs a mount-gate or a `useSyncExternalStore` with a server snapshot. Flagged
here because this group installed the surface, not to be fixed here.

### Advisory 3 — the `preconnect` hints land after the stylesheet they are for

React 19 hoists stylesheets to the top of `<head>`, so in the served production HTML both
`preconnect`s to `fonts.googleapis.com` / `fonts.gstatic.com` appear **after** the `css2`
stylesheet `<link>` that triggers the connection. R75 asks only for `<link>` loading from
`__root.tsx` and is satisfied; the hints are simply inert where they end up. Cosmetic.

### Spec compliance — step 2's slice

| Req | Summary | Status |
| --- | --- | --- |
| R20 | exactly three themes via `data-theme` on `<html>` | ✅ PASS — `THEMES`/`isTheme`; browser: explicit theme ignores the OS both ways |
| R21 | while «Sistema», follow and react to `prefers-color-scheme` live | ✅ PASS — subscription + cleanup tested (M8 killed); browser repaint measured |
| R22 | `data-theme` set **before first paint**, no flash, no hydration mismatch | ✅ PASS — parser-blocking classic script last in `<head>`; mutation at ~70 ms vs FCP ~84 ms; two-entry mutation trace, no wrong intermediate value, no warning |
| R23 | persisted so a direct URL renders in that theme | ✅ PASS — round-trip tested; browser-verified across reloads for all three; script + attribute ride the root shell |
| R24 | no / unreadable / out-of-vocabulary → «Sistema» without throwing | ✅ PASS — three layers × hostile battery × three storage-failure modes; browser-verified incl. a throwing `getItem` |
| R26 | both controls drive one state | ✅ PASS for what this group owns — two sibling consumers of one context; provider at the root |
| R27 | swap `data-theme` **instantly**, no cross-fade | ⚠️ **PARTIAL** — no cross-fade verified (`0s` on html/body); "instantly" unconstrained (M1 survives) |
| R75 | Inter + Plus Jakarta Sans by `<link>` to Google Fonts from `__root.tsx` | ✅ PASS — verified in the served production HTML; build/CI unaffected |

**Covered 7/8 · Partial 1 · Failing 0.** Every task references at least one requirement
(T6 → R20/R23/R24, T7 → R22/R75, T8 → R21/R26/R27), so there is no un-referenced task to
account for.

### Quality pass — nothing else to report

Test quality: happy / error / edge paths all present, AAA throughout, `toBe` correct here (every
assertion is on a primitive), no mock-and-assert — the `matchMedia` double is a genuine fake that
drives listeners the way the OS does, and the R21 test asserts the resulting state, not the fake.
Listeners cleaned up on unmount and tested. No floating promises (nothing async), no `any` or
unsafe cast in the source, no non-null assertions, no dead code. The two `catch` blocks in
`theme.ts` and the empty one in the generated script are R24-mandated, each documented with why
and each covered by a test that drives the failure — deliberate, not swallowed. `__root.tsx` is
configuration and was verified by running rather than asserting, which is the right call.
`resolvedTheme` is exposed without a consumer, justified by R26 and the handoff's desktop button.

### Not re-raised

`ring-[3px]` (Group 3/T12), `home-page.spec.tsx` (T9/T26), node globals in `src/` (pre-existing
stack property), Group 1's token files and gates (untouched here, correctly), issue #13's missing
shadow/letter-spacing families, and the `ui-handoff.md` §8 item 1 ↔ item 4 transition
contradiction — which is a handoff defect routed to the human, not an implementation defect, and
which no code can hit yet because this group ships no control.

## Review evidence — step 2 (re-review, iteration 2)

Fresh Reviewer, no prior context. Anchor `6ea1697`; auto-commit OFF, so the reviewed change is
the staged, uncommitted diff against it: six files, 819 insertions. Worktree == index at review
time and the tree was returned byte-identical afterwards (`git status --porcelain` before and
after is the same eight lines; no stranded `.bak`). No issue comment — per-step.

### The seven declared gates, re-run by me with the turbo cache bypassed

`TURBO_FORCE=true`, in the declared order, stopping at the first failure. Nothing relayed.

| Gate                      | Result                                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| `typecheck`               | ✅ 3/3 packages, 0 cached                                                  |
| `format:check`            | ✅ all matched files use Prettier style                                    |
| `test`                    | ✅ 115/115 in `@memora/web` (4 files), 133 in the monorepo, 0 cached       |
| `build`                   | ✅ nitro output generated; only the pre-existing radix `"use client"` warns |
| `design-tokens:validate`  | ✅ 147 tokens, 30 files, no hardcoded values                               |
| `design-tokens:contrast`  | ✅ 56 pairs meet their WCAG floor                                          |
| `design-tokens:css:check` | ✅ `tokens.generated.css` up to date (untouched by this group)             |

`pnpm audit --audit-level=moderate` → no known vulnerabilities. No linter by project decision.

### The real run — real Chrome against the production build, on an explicit free port

The trap was respected: port `3000` was left alone, `node .output/server/index.mjs` was bound to
`127.0.0.1:3317` (confirmed free beforehand), and the served bytes were checked for dev markers
before anything was trusted — `grep -c '@vite/client|@react-refresh|vite/dist/client|__vite'`
on the served HTML returns **0**. Headless Chrome 155 driven over CDP from my own harness
(`$SCRATCH/cdp/theme-check.mjs`, outside the repo, no repo dependency), **15 scenarios**.

**R22 — pre-paint, proven rather than argued.** A `MutationObserver` injected through
`Page.addScriptToEvaluateOnNewDocument` (so it runs before any page script) records every
`data-theme` change together with `document.readyState` and whether `document.body` exists yet.
In every scenario the first mutation is:

```
system->dark  readyState=loading  bodyExists=false  bodyChildren=0
```

`<body>` does not exist yet, so nothing can have been painted. The second mutation is the
provider's `[theme]` reconciling effect at `readyState=interactive` writing the **same** value
(`dark->dark`) — i.e. hydration does not revert the attribute. Served `<html>` is
`data-theme="system"`; the inline script is the single `<script>` in `<head>`, inline, **not**
`async`, **not** `defer`, classic type. Served head order confirms the hoisting the code comment
claims: `meta, meta, link[stylesheet], link[stylesheet], title, link[modulepreload] ×2, script`.

**Per-scenario results** (`bodyBg` is the computed `background-color` of `<body>`):

| Stored value       | OS    | attr after hydration | bodyBg               |
| ------------------ | ----- | -------------------- | -------------------- |
| (nothing)          | light | `system`             | `rgb(248, 250, 252)` |
| (nothing)          | dark  | `system`             | `rgb(8, 15, 25)`     |
| `dark`             | light | `dark`               | `rgb(8, 15, 25)`     |
| `light`            | dark  | `light`              | `rgb(248, 250, 252)` |
| `system`           | dark  | `system`             | `rgb(8, 15, 25)`     |
| `matcha`           | dark  | `system`             | `rgb(8, 15, 25)`     |
| `Dark`             | dark  | `system`             | `rgb(8, 15, 25)`     |
| `''`               | dark  | `system`             | `rgb(8, 15, 25)`     |
| `'   '`            | dark  | `system`             | `rgb(8, 15, 25)`     |
| `{"theme":"dark"}` | dark  | `system`             | `rgb(8, 15, 25)`     |
| `null` (string)    | dark  | `system`             | `rgb(8, 15, 25)`     |
| `LIGHT`            | dark  | `system`             | `rgb(8, 15, 25)`     |
| `' dark '`         | light | `system`             | `rgb(248, 250, 252)` |

**Zero** console errors, **zero** `Runtime.exceptionThrown`, **zero** hydration warnings in all
15 scenarios. The only browser log is `404 /favicon.ico` — pre-existing, nothing to do with this
group (`__root.tsx` declared no icon before this change either).

**R21, live.** Stored `system`, OS light: `Emulation.setEmulatedMedia prefers-color-scheme=dark`
with the document mounted moves `bodyBg` `rgb(248, 250, 252)` → `rgb(8, 15, 25)` with no reload,
the attribute stays `system`, and flipping back returns to `rgb(248, 250, 252)`.

**R20, the negative.** Stored `light`, OS flipped to dark with the document mounted: `bodyBg`
does **not** move (`rgb(248, 250, 252)` before and after), attribute stays `light`.

**R27, no cross-fade.** `transition-duration` is `0s` on both `<html>` and `<body>` in every
scenario, so a `data-theme` swap cannot interpolate at the document level.

**R75, fonts, re-derived not trusted.** Served bytes carry the `css2` stylesheet link and
**no** `preconnect` (`document.querySelectorAll('link[rel=preconnect]')` is empty in all 15
scenarios). Network: `css2` → **200**, `fonts.gstatic.com/.../inter/...woff2` → **200**,
`.../plusjakartasans/...woff2` → **200**; `document.fonts` reports `Inter|400 800|loaded` **and**
`Plus Jakarta Sans|400 800|loaded`, and `<body>`'s computed `font-family` resolves to `Inter`
first. **Font delivery did not regress** — the `css2` link alone satisfies R75, which asks for
the `<link>` and nothing more. Neither `ui-handoff.md` nor `requirements.md` nor `design.md`
mentions `preconnect` anywhere, so removing it contradicts no design contract. I did **not**
re-derive the connection-reuse measurement that motivated the removal (the hints are gone, and
a shared Chrome connection pool across tabs makes `connectionReused` unreadable without a cold
profile per probe): I read every response for both hosts rather than the first, which is the trap
named, and the only claim I can and do confirm is the structural premise — the served head order
above shows React hoisting both stylesheets **above** everything else in `links`, so a
`preconnect` declared in that array necessarily lands behind the sheet it was meant to warm.
That is an optimisation rationale, not a requirement; R75 is met either way.

### The rejected finding, re-verified against the mutant

Ten hand probes, one composite trip each, `EXIT` trap installed before the mutation
(hand-probe path: `package.json` declares no `test:mutation`).

| #   | Mutation                                                                          | Outcome                           |
| --- | --------------------------------------------------------------------------------- | --------------------------------- |
| 1   | delete `applyThemeToDocument(next)` from `setTheme` (**the mutant that survived**) | **killed** — 3 failed / 82 passed |
| 2   | `setTimeout(() => applyThemeToDocument(next), 0)` — a frame-late write             | **killed** — 3 failed / 82 passed |
| 3   | delete `persistTheme(next)` from `setTheme`                                        | killed — 2 failed / 83 passed     |
| 4   | delete `applyThemeToDocument(theme)` from the `[theme]` effect                     | killed — 4 failed / 81 passed     |
| 5   | `if (next !== 'system') persistTheme(next)`                                        | **survived — 85/85**              |
| 6   | `resolveTheme` flips the «Sistema» arm                                             | killed — 17 failed                |
| 7   | bootstrap script `indexOf(stored) !== -1` → `=== -1`                               | killed — 17 failed                |
| 8   | `readSystemPrefersDark` `?? false` → `?? true`                                     | **survived — 85/85**              |
| 9   | drop the `removeEventListener` cleanup                                             | killed — 1 failed                 |
| 10  | drop `setSystemPrefersDark(query.matches)` after subscribing                        | **survived — 85/85**              |

**The rejection is answered.** Probe 1 is exactly the mutant that previously survived 82/82; it
now kills the three new R27 tests. And it is not shape-matching: probe 2 replaces the synchronous
write with a genuinely frame-late one and dies the same way. A third probe (13) moved the write
into a `useLayoutEffect` keyed on `[theme]` — still before paint in a real browser, but after
React processes the update — and that **also** fails the three tests. So the new tests pin
*"written inside the handler, before React flushes"*, which is narrower than R27's literal «before
paint» but is precisely the mechanism D11 and the code comment commit to. That is a deliberate,
documented over-constraint, not a defect; worth knowing because a future refactor to a layout
effect would read as a regression.

### What the three survivors mean (all on lines this change added → advisories, not side-findings)

**S1 (probe 5) — the «Sistema» row of the `setTheme` test is vacuous.** The test seeds nothing
into storage and then asserts `readStoredTheme()).toBe(tema)`; for `tema === 'system'` the
no-storage fallback *is* `'system'`, so the assertion passes whether or not the choice was
persisted. Consequence if the code were wrong: pick «Oscuro», then pick «Sistema», reload — and
«Oscuro» comes back, an R23 violation no test could see. The code is right (one unconditional
`persistTheme(next)`, no branch — the deletion mutant of probe 3 still dies on the other two
rows), and the mutant had to *introduce* a conditional that does not exist in order to survive,
which is weaker evidence than a deletion that survives. One-line fix: seed a different theme
first (`persistTheme('dark')` before the `act`) or assert
`window.localStorage.getItem(THEME_STORAGE_KEY)` directly.

**The record still overstates this one.** The Group 2 narrative says «en unit está cubierto que,
**para los tres temas**, `setTheme` deja el atributo, la persistencia y el estado donde deben
estar». For the attribute and the state that is true of all three; for **persistence** it is true
of two of three. Stated here so the human reads the accurate version at the checkpoint.
Unlike iteration 1's finding, this one is not the defining property of the requirement and
nothing in the browser run depends on it — hence an advisory and not a second rejection.

**S2 (probe 8) — the no-`matchMedia` fallback is unpinned.** `readSystemPrefersDark()` returning
`true` instead of `false` when `matchMedia` is absent passes 85/85, because no provider test ever
removes `matchMedia` (jsdom always supplies one). The comment claims «la respuesta honesta es
claro: es el valor base de `:root`» — a claim no test imposes. It is also the exact line that
makes the SSR half of the recorded Group 12 constraint true, so it deserves a test: stub
`matchMedia` away and assert `system/light`.

**S3 (probe 10) — the post-subscription resync is unpinned.** Deleting
`setSystemPrefersDark(query.matches)` (the line whose comment says the preference may have moved
between first render and the subscription) passes 85/85, because the double's `matches` never
differs at effect time from first render. Killable with a double that changes `matches` between
the two.

### The `act`-environment flag: a fix, not a muzzle — measured in both directions

The flag's semantics are the opposite of hiding: React only arms its *«update not wrapped in
act»* net when `IS_REACT_ACT_ENVIRONMENT` is true, and it complains *«not configured to support
act»* when a bare `act` runs without it. Both halves verified:

- **Probe 11c** — comment the flag out and run through **turbo**, exactly as the gate is declared
  (`TURBO_FORCE=true pnpm test`): **11** occurrences of «The current testing environment is not
  configured to support act(...)», suite still 115/115. With the flag: **0**. The Implementer's
  measurement reproduces exactly. (Worth noting for whoever repeats this: running the package
  script directly with `pnpm -s --filter` swallows that stderr — only the turbo path shows it,
  which is also the path CI takes.)
- **Probe 12** — with the flag **on**, unwrap one `act()` in the R26 test
  (`control('movil')('dark')` bare): React emits **1** «not wrapped in act» warning. So the net
  is live, not suppressed. Nothing is being hidden; the suite is now strictly stricter than before
  this change, and with the flag on there are zero warnings of either kind across all 115 tests.

### Spec compliance — R20–R24, R26, R27, R75

| Req | Verdict | Where it is proven                                                                                                                                     |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R20 | ✅ PASS | `THEMES`/`THEME_ATTRIBUTE` in `theme.ts`; all three values observed on `<html>` in Chrome; `resolveTheme` + bootstrap suites; probes 6–7 kill 17 each   |
| R21 | ✅ PASS | the `matchMedia` subscription in the provider; live CDP flip moves `bodyBg` with the attribute unchanged; unit R21 test + probe 9                       |
| R22 | ✅ PASS | the inline classic `<script>` in `<head>`; first mutation at `readyState=loading` with `document.body === null`; no hydration warning in 15 scenarios   |
| R23 | ✅ PASS | `persistTheme` in `setTheme`; stored `dark` renders dark on a fresh load, stored `light` renders light with the OS dark. **Caveat S1** on the test       |
| R24 | ✅ PASS | `isTheme` + the two `catch`es; 14 hostile values and 3 storage-throw forms in unit; 8 hostile values in the browser, zero exceptions                    |
| R26 | ✅ PASS | one `useMemo`'d context; the two-sibling-consumer test drives from each side. The real controls are Groups 3/12 — provider-level is all this group owns |
| R27 | ✅ PASS | synchronous write in the handler (probes 1, 2 and 13 all kill); `transition-duration: 0s` on `<html>` and `<body>` measured in all 15 scenarios         |
| R75 | ✅ PASS | the `css2` `<link>` in the served bytes; 200/200/200 and both families `loaded` in `document.fonts`; build and all seven gates green                    |

**Covered 8/8 · Partial 0 · Failing 0.** No unspecified behaviour: nothing in the diff lacks a
backing requirement, and no design decision was taken that `design.md` does not describe.

### Security and silent-failure passes (run beyond the per-step floor — the group declares no `[risk: …]`)

Run because this group ships the app's **only** inline script and its **only** boundary parser.
Nothing critical, high or medium. Two hardening notes:

- `theme.ts:30–39` — the bootstrap script is assembled with `JSON.stringify`, which does **not**
  escape `<` or `/`. Today every interpolated value is a module literal, so nothing can break out
  of `</script>`. But the JSDoc promises «añadir un tema al vocabulario lo añade a los dos», which
  invites a future edit to `THEMES`: a value containing `</script>` would escape the script
  element. One `.replace(/</g, '\\u003c')` over the serialised pieces closes it permanently.
- `__root.tsx:75` — `dangerouslySetInnerHTML` is sound here (no user input reaches it, and the
  stored value is whitelisted against `THEMES` **before** it is written, so `data-theme` can only
  ever hold one of the three literals). It does mean the app will need a CSP nonce or hash the day
  a CSP arrives; the `[theme]` reconciling effect already degrades that case to a possible flash
  rather than a broken page, and probe 4 proves that effect is tested.

Silent failures: clean. The three `catch` blocks are R24-mandated, two carry a comment saying so
and all three are driven by tests that force the failure. `globalThis.matchMedia?.(…).matches ??
false` short-circuits the whole chain correctly. No floating promises (nothing async), no
`Promise.all`, no success-shaped error return, no `switch` without a default. `useTheme` throws
loudly and names the missing provider.

### The two recorded pendings — clear, with one gap worth closing

Both are correctly left unbuilt and both are written down in «Lo que este grupo deja pendiente a
otros», naming the group that inherits them and why no mechanism was invented here. I agree with
all of that. Two notes for the checkpoint:

1. **The SSR constraint is recorded narrower than it is.** The note says `resolvedTheme` disagrees
   between server and hydration. So does **`theme`** itself: the server renders with
   `DEFAULT_THEME` (`readThemeFromDocument` sees no `document`), the client's hydration render
   reads `dark` off the attribute. Group 12's `ToggleGroup` renders *which option is checked* from
   `theme`, not from `resolvedTheme` — so a mount gate applied only to the desktop button's icon
   would still mismatch on the mobile control. Worth widening the sentence to «`theme` **and**
   `resolvedTheme`».
2. **Both pendings live only in `progress.md`.** `tasks.md` T12 (Group 3) and T40/T41 (Group 12)
   carry no pointer, and this file is already 1244 lines with eleven groups still to go. Neither is
   the Implementer's to add — `tasks.md` is the spec — so this is for the human at this
   checkpoint: a one-line note on T12 and on T41 would make them unmissable.

### Not re-raised

Everything the invocation settled: `ring-[3px]` (Group 3/T12), `home-page.spec.tsx` (T9/T26),
node globals in `src/` (pre-existing stack property), Group 1's token files, generator, gates,
`harness.config.yml`, `ci.yml` and `.prettierignore` (untouched here, correctly), issue #13's
missing shadow / `letter-spacing` families, and the `ui-handoff.md` §8 item 1 ↔ item 4 transition
contradiction (a handoff defect for the human, and no code can hit it until a control exists).
