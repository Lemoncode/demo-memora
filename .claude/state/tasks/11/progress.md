# Progress — #11 Base de diseño, shell y flujo de acceso del frontal de Memora

**Status**: spec-in-progress
**Branch**: `harness/11-base-shell-acceso`
**Part 1 of #10** (partition plan, chain 1 → 2 → 3)
**PRD**: `docs/prds/frontal-memora-2026-10-18.md`

## Active

**Status**: implementing — **Grupos 5 y 6** (dataset mock compartido, formateadores en
español y assets del diseño), paso 4 de 8, step-by-step, auto-commit **off** (save-points en el
índice de git, cero commits).

**Active subtask**: ninguna — **Grupos 5 y 6 completos (T17–T20, T21)**, a la primera, sin
discoveries. Los siete gates en verde con la caché de turbo saltada, `pnpm audit` limpio, y el
camino real ejercitado contra el build de producción en un puerto libre explícito: los 17 assets
servidos en local con 200 y el `content-length` del origen, y las fixtures atravesando los
formateadores de verdad. 186 tests (16 nuevos). Todo en el índice y **sin commitear**, a la espera
del checkpoint humano. El **Grupo 7 no se ha empezado**.

Este paso no renderiza nada: son datos y bytes. `/` sigue devolviendo `null` hasta T26 (Grupo 8).
El informe de peso de los assets — 1,79 MiB en 17 ficheros, con el tamaño de dibujo de cada uno y
cuáles son desproporcionados — está en la sección «Grupos 5 y 6» de abajo, y es material del
checkpoint: **no he redimensionado ni recomprimido nada**, porque eso es decisión del humano y el
momento de tomarla es ahora, antes del primer commit.

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

## Grupos 3 y 4 — la biblioteca de componentes (T9–T12, T46, T13–T16), paso 3/8

**Preflight del skill `tdd`.** Playbooks cargados: **ninguno** — `docs/playbooks/` sigue
teniendo sólo el `README.md` de la convención de lookup, y su ausencia no es un blocker.
Entorno de test: **jsdom + Testing Library** para los specs de componente, que es la
convención del repo y lo que el Grupo 2 ya dejó dicho (el repo no tiene browser mode por
decisión explícita). Lo que jsdom **no** puede ver se midió en Chrome de verdad, y en este
paso eso no fue una formalidad: encontró un defecto real en T46.

### La referencia de vestido: el `bundle.js` del sistema de diseño, leído como datos

R30 prohíbe **vendorizar** el `bundle.js`, y no se ha vendorizado ni una línea: es JS
compilado y no hay fuente React que copiar. Pero leerlo para saber **qué clases le pone el
diseño a cada componente** no es vendorizar, es consultar la fuente de verdad del diseño en
vez de adivinarla. De ahí salen, medidos y no supuestos:

- **El mapa de iconos entero** (`iconMap`), nombre por nombre — ver T13.
- Las variantes y tamaños de `Button` y `Badge`, y el vestido de `Input`, `Label`, `Alert`,
  `EmptyState`, `Skeleton`, `Progress`, `Menu` y `ToggleGroup`.
- **El anillo de foco del sistema es literalmente
  `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`**, que
  es exactamente lo que pide §9 («2 px de anillo con 2 px de separación»). Es decir: R38 se
  cumple con la misma cadena que escribe el DS, no con una interpretación.

Artboards leídos del canvas para esto: `Login-M-Error` (el `Alert`, el campo inválido con su
`h-12` y su borde de 2 px, el mensaje con su punto `aria-hidden`), `Invite-States` (la API de
`EmptyState`: `icon`/`tone`/`title`/`size`, y los tres tonos) y `Register-M` (el icono
`success` tintado con `accent-mint-strong`, y el botón de volver de 44 px).

### T9 — la mudanza de los primitivos

`git mv` de `button.tsx` y `card.tsx` a `src/common/components/ui/`, los alias `components` y
`ui` de `components.json` apuntando ahí, y `utils` / `lib` / `hooks` **sin tocar**, que es lo
que mantiene la issue #5 fuera de esta entrega (D4). `home-page.tsx` y su spec borrados (R74):
el suite baja de 115 a 113 tests ahí.

**`routes/index.tsx` queda como marcador de posición que no pinta nada**, con un comentario
que dice por qué. No puede ser todavía la redirección de R61 (T26, Grupo 8): `redirect` y
`<Link>` están tipados contra el árbol de rutas generado y `/login` no existe hasta el Grupo
9, así que escribirla ahora rompería `typecheck`. Y **no se ha inventado una pantalla** para
llenar el hueco: la instrucción de este paso es que no hay rutas. Consecuencia que conviene
decir en voz alta: **en el checkpoint, abrir `/` no enseña nada**. Lo que hay que mirar son
las capturas de abajo.

### T10, T11 y T12 — los primitivos, vestidos

Generados con la CLI de shadcn (R29). **La CLI ya emitió los imports de este repo** — `cn`
desde `cn` y los primitivos desde el paquete único `radix-ui` — así que la corrección a mano
que D4 anticipaba no hizo falta; se comprobó fichero por fichero. No tocó `styles.css` ni
`package.json`: se comparó con una copia previa de los dos.

Decisiones de vestido, todas con el mismo criterio — **entregar lo que §5 enumera y nada más**,
porque una variante que ningún artboard usa es superficie que nadie ha revisado:

- **`Button`**: `default`, `secondary`, `soft`, `ghost`, `link`; se caen `destructive` y
  `outline` del primitivo generado. Tamaños `default` / `lg` / `sm` / `icon`.
- **`Badge`**: sólo `secondary` y `outline` (el DS tiene ocho). **`Alert`**: sólo `error`.
- **`Avatar`**: `sm`/`md`/`lg`/`xl` con los valores del DS. Se caen `AvatarGroup`,
  `AvatarGroupCount` y `AvatarBadge`: §J pone `AvatarGroup` explícitamente **fuera** de esta
  parte. **Las iniciales no se derivan en el componente**: R43 y T22 ponen esa derivación en
  el mapper del pod, así que el llamante las pasa como hijos y no hay dos sitios calculando
  lo mismo.
- **`toggle.tsx` borrado.** La CLI lo crea porque `ToggleGroup` reutiliza las variantes de un
  `Toggle` suelto; esta parte no tiene ninguno y la lista de ficheros de `design.md` enumera
  diez en `ui/` y **no incluye** `toggle.tsx`. Las variantes viven ahora en `toggle-group.tsx`.
- **`dropdown-menu.tsx` recortado a siete piezas** de las catorce que genera la CLI: `Root`,
  `Trigger`, `Content`, `Label`, `Separator`, `RadioGroup` y `RadioItem`. `RadioItem` es lo
  que da `role="menuitemradio"` + `aria-checked`, que es literalmente R28.
- **`Progress` sin transición de ancho.** El DS la anima 300 ms; §8 es una lista cerrada de
  cinco cosas y el ancho de una barra no es ninguna (R94). Y `label` es **obligatorio** en el
  tipo, no opcional: §5 pide «etiqueta accesible», y un `aria-label` que se puede omitir se
  omite.

**Alturas y el suelo de 44 px (R89), que es donde se desvió del DS a conciencia.** El
`default` del DS mide 40 px y el `icon` 40 px, por debajo del suelo. Así que `default` e
`icon` miden el **token** `primitive.dimension.layout.touch-target` (2,75rem = 44 px) — que es
además lo que `Register-M` dibuja para su único control sólo-icono — y `lg` se queda en los
48 px del DS. `sm` conserva los 32 px del DS (es lo que dibuja `Profile-D`) y **extiende su
área de pulsación a 44 px con un pseudoelemento**, que es exactamente la regla de app del DS
(«los chips y los interruptores extienden su área de pulsación»). Medido en el navegador: el
`::after` del `sm` mide 44 px.

**Sombras y `tracking`, el interino de #13** aplicado tal y como se decidió: utilidades de
Tailwind, nunca un valor arbitrario con un literal dentro. El `shadow-brand` del DS (la sombra
teñida de marca que «marca lo único que hay que pulsar») se compone como
`shadow-md shadow-primary/25`: `shadow-primary/25` tiñe la sombra con `--color-primary`, así
que **no lleva ningún literal** y el día que #13 defina la familia desde el fichero de tokens
esto hereda el cambio sin tocarse. Comprobado en el CSS compilado:
`.shadow-primary\/25{--tw-shadow-color:var(--semantic-color-primary)}`.

**El escáner pilló un hex en un comentario mío** (`#f87171`, citado al explicar por qué el
borde inválido usa `destructive-border`), igual que le pasó al Grupo 1 con un ejemplo en un
comentario del generador. El comentario perdió el valor y lo dice con palabras.

### T46 — **aquí está el hallazgo del paso: el mecanismo no suprimía nada**

Cuatro ciclos rojo → verde en el proveedor (marcador en el manejador; marcador soltado;
camino del sistema operativo; la guarda de deriva sobre `styles.css`), más la mitad de CSS en
el `@layer base` y un quinto ciclo para R104. Y **todo eso estaba verde cuando la medición en
Chrome demostró que la supresión no funcionaba**.

**Lo que midió el navegador.** Con el build de producción servido en un puerto libre
explícito, se muestreó el `background-color` computado de un botón `secondary` (uno cuyo color
**sí** cambia entre temas — el primer intento midió el botón primario, que es `brand-600` en
los dos temas y por tanto no podía interpolar nunca: una medición vacua que casi se da por
buena) fotograma a fotograma durante un cambio de tema:

```
f1 rgb(241,245,249) → f3 rgb(124,133,143) → f5 rgb(44,55,69) → f9 rgb(23,35,50)
```

Es decir: **cross-fade**, exactamente lo que R27 prohíbe, con el mecanismo entero puesto y los
163 tests en verde.

**La causa.** Un solo `requestAnimationFrame` no sirve: su callback corre *antes* del
recálculo de estilo del fotograma, así que el marcador ya no está cuando el navegador computa
los colores nuevos. Y el `getComputedStyle` que yo había puesto para forzar el recálculo
tampoco servía, por una razón distinta y peor: **estaba antes de escribir `data-theme`**, así
que asentaba los colores viejos.

**Las seis variantes, medidas en una página aislada** (sin React, sin el repo, sólo la
semántica del navegador; el primer intento de ese experimento también salió mal — leía el
color inicial a mitad de una transición anterior — y se corrigió el reset antes de creerse
nada):

| Variante | Veredicto |
| --- | --- |
| sin supresión (control) | INTERPOLA (6 intermedios) |
| un rAF + flush del estilo computado del root (**lo que se había escrito**) | **INTERPOLA (6)** |
| un rAF + flush forzando layout (`offsetHeight`) | INTERPOLA (6) |
| **rAF doble** | **SUPRIME (0)** |
| rAF doble + layout | SUPRIME (0) |
| flush *después* de escribir el tema + un rAF | SUPRIME (0) |

**Se toma el rAF doble**, por dos razones: no depende del orden de las escrituras — y el
camino del sistema operativo **no escribe ningún atributo** tras el que flushear, así que allí
no existe el «después» — y no fuerza un reflow sincrónico en cada cambio. El marcador vive el
fotograma que pinta el cambio y se suelta en el siguiente, ~33 ms. Es una desviación de la
letra de §8 punto 5 («suéltalo en el fotograma siguiente») que la medición **obliga**: con un
solo fotograma el mecanismo está puesto y no hace nada.

Vuelto a medir en la aplicación real tras el arreglo: **0 colores intermedios**, el botón pasa
de `rgb(241,245,249)` a `rgb(23,35,50)` en el primer fotograma.

**Y el criterio que vigila el otro lado**: tras el cambio de tema, pasar el ratón por encima
del botón **sí** interpola — 5 muestras intermedias hasta `rgb(70,62,193)`, que es `brand-700`,
el color de hover que pide el DS — con `transition-duration: 0.15s`. O sea: el marcador no
sobrevive y no ha matado en silencio las transiciones de la aplicación.

**El suite ahora sí lo ve.** El test del marcador se reescribió a la forma que la medición
fijó (sobrevive al fotograma que pinta, se suelta en el siguiente) y **mata el mutante del rAF
único**: con un solo rAF, 1 test en rojo. Antes de medir, ese defecto pasaba 163/163.

**Dónde vive cada mitad (D16), y la única desviación de su letra.** El marcador lo pone el
proveedor y la regla está en el `@layer base` de `styles.css` escrito a mano, porque el
generador es dueño del fichero generado byte a byte (R7). La desviación: D16 dice «en el
efecto que ya escribe `data-theme`», y **ese efecto no cubre el camino del sistema operativo**
— con el tema en «Sistema», un cambio de `prefers-color-scheme` no toca `data-theme` (se queda
en `system`) y el repintado lo hace el brazo `@media` del CSS, así que el efecto con
dependencia `[theme]` no corre. R103 dice explícitamente que la supresión «vale como sea que
se haya disparado el cambio», así que la supresión se cuelga también del oyente de
`matchMedia`, que vive dentro del efecto del proveedor. Se cumple la sustancia de R103 y de la
intención de D16; se desvía de una frase de su justificación. Hay un test que lo fija.

**La guarda de deriva entre las dos mitades.** El nombre del atributo vive en TypeScript y el
selector en CSS, y **ningún compilador une esas dos mitades**: si uno cambiase y el otro no,
el mecanismo quedaría verde y sin efecto. Un test lee `styles.css` y comprueba que la regla
existe y apaga las transiciones con `!important`. Renombrar el atributo sólo en el CSS: 1 test
en rojo. Quitar el `!important`: 1 test en rojo (y no es decorativo — la regla está en `base`
y las utilidades de Tailwind ganan por capa).

**R104, la otra mitad.** El `transition-*` sin acotar del `Button` pasa a nombrar las tres
propiedades que de verdad cambian, con 150 ms y la curva del sistema, dentro de
`motion-safe:`. Y hay un **test mecánico** que recorre `apps/web/src` y falla si la utilidad
sin acotar reaparece en cualquier `.ts`/`.tsx`/`.css`: su criterio de aceptación es un `git
grep`, nada más en el proyecto lo vigila (el escáner anti-hardcode mira colores y dimensiones,
no transiciones) y la aguja se compone de dos trozos para que el `git grep` del humano siga
saliendo vacío. **Sale vacío.**

**Mutantes de T46, todos cazados** (cada uno un comando con `trap`, árbol limpio después):

| Mutante | Resultado |
| --- | --- |
| un solo rAF (el defecto que se midió) | **cazado** — 1 test |
| el marcador no se suelta nunca | cazado — 2 tests |
| `setTheme` no suprime | cazado — 2 tests |
| el camino del SO no suprime | cazado — 1 test |
| renombrar el atributo sólo en el CSS | cazado — 1 test |
| quitar el `!important` | cazado — 1 test |

Un sondeo anterior de «el marcador no se suelta nunca» **salió no-op** (el `perl` no casaba con
la línea) y durante un rato pareció un superviviente. Queda dicho, como en el Grupo 2: se
repitió verificando que la mutación se había aplicado antes de creerse el resultado.

### T13 — `Icon`, y una afirmación del contrato que la medición desmiente

El mapa cubre los **catorce nombres del README del DS y los diecinueve que añade §5** (33
canónicos + 1 alias). Qué glifo le toca a cada nombre **no se ha elegido aquí**: se leyó del
`iconMap` del propio sistema de diseño. Por eso `album` es `layers` y no un álbum, `filter` es
`funnel`, `upload` es `cloud-upload`, `edit` es `pencil`, `phone` es `smartphone`, `photos` es
`images`, `pin` es `map-pin`, `shield` es `shield-check`, `help` es `circle-question-mark` y
`pending` es `hourglass`. Adivinarlos habría dado un conjunto plausible y **distinto** del
diseño.

**El hallazgo: §5 dice que `success` y `check` «son el mismo glifo», y el sistema de diseño
dice que no.** En su `iconMap`, `check` es `check` (la marca pelada) y `success` es
`circle-check` (la marca dentro de un círculo): dos glifos distintos. R35 pide «una entrada
canónica más un alias», y no dice cuál es cuál — así que **`success` es la canónica y `check`
su alias**, porque **ningún artboard de esta parte usa `check`**: `Register-M` (la pista de la
contraseña) e `Invite-States` (el estado «ya eres miembro») piden los dos `success`. Así se
cumple R35 a la letra, sin dos entradas que puedan separarse, **y** se pinta el glifo que el
diseño pone en cada sitio donde esta parte lo usa. Consecuencia, dicha para que no sorprenda:
un futuro `check` saldrá como `circle-check`. Si el humano prefiere lo contrario, es cambiar
qué entrada apunta a qué y nada más.

**El mapa es un `Map`, no un objeto indexado**, que es la lección que la review del Grupo 1
dejó **dos veces**: indexar un literal consulta `Object.prototype` y `ICON_MAP['constructor']`
devuelve una función que el componente intentaría pintar. Hay un test con los cinco nombres
heredados; con un índice de objeto, **5 tests en rojo**.

Ciclos: el glifo conocido; el fallo ruidoso en desarrollo nombrando el nombre (R34, D15 — el
camino de producción no se asevera, como D15 dice); los nombres heredados (**nació verde**,
porque el `Map` ya estaba en el primer verde — probado a mano); el alias; los 34 nombres (la
lista se escribe **a mano desde el contrato**, no se deriva del mapa, que es la lección del
contador de hojas del Grupo 1); y el par decorativo/anunciado (**también nació verde** — llegó
en el verde anterior; los dos mutantes caen, 1 test cada uno).

### T14, T15 y T16 — los compuestos

- **`EmptyState`** con la anatomía del DS y los tres tonos de §5. `neutral` y `mint` salen
  enteros de la capa semántica, y `mint` es el caso bonito: `success-foreground` **ya es**
  «mint-strong en claro, mint-base en oscuro», que es exactamente lo que el DS escribe como
  `text-accent-mint-strong dark:text-accent-mint` — un solo token, medido por el gate de
  contraste, sin variante `dark:`. **`peach` no tiene equivalente semántico** en el fichero de
  tokens, así que referencia la escala primitiva por `var()`: sin literales, pero un nivel por
  debajo de lo que el contrato de tokens prefiere. Anotado abajo como candidato de fichero de
  tokens, no arreglado aquí.
- **`Skeleton`**, que **no se usa en ninguna de las seis pantallas** (R37) y no se puede
  inventar en ellas. Lleva `motion-safe:animate-pulse`, que es **motion fuera de los cinco
  puntos de §8**, y se entrega a conciencia: es el vestido que le da el propio sistema de
  diseño, y como no se monta en ninguna pantalla de esta parte, **no hay un solo pixel de esta
  entrega que se mueva por su causa**. Dicho aquí para que no parezca un descuido.
- **`FutureLink`**, el único objetivo de `grep` que las Partes 2 y 3 convierten (R71, D9), con
  `href` obligatorio en el tipo y el anillo de foco de serie.

**Sin spec para estos tres, y es una decisión, no un olvido.** R99 prohíbe explícitamente
aseverar markup de componentes, y los tres son presentacionales y declarativos — la lista de
exclusiones del propio skill `tdd` («envoltorios de paso», «contenido estático»). `Icon` sí
lleva spec porque **es un mapper** con un fallo ruidoso, y R34 lo pide. Lo que estos tres sí
tienen es verificación: se pintaron en el navegador y se miraron.

### Verify — los siete gates y el camino real

| Gate | Resultado |
| --- | --- |
| `typecheck` | ✅ 3/3 paquetes, 0 cacheados |
| `format:check` | ✅ |
| `test` | ✅ **163** en `@memora/web` (113 tras borrar `home-page`, +50 en este paso), 181 en el monorepo |
| `build` | ✅ |
| `design-tokens:validate` | ✅ 147 tokens, 41 ficheros, sin hardcodes |
| `design-tokens:contrast` | ✅ 56 parejas |
| `design-tokens:css:check` | ✅ al día (no se tocó el fichero generado) |

`pnpm audit --audit-level=moderate` → sin vulnerabilidades. Criterios de aceptación que son un
`grep`: `transition-all` → **0**; `href="#"` → **0** (había uno **en un comentario** mío de
`FutureLink`, que es justo lo que ese comentario prohibía: reescrito); `@/lib/utils` o
`@radix-ui/react-*` → **0**; `bundle.js` en el repo → **0**; `home-page` → **0**.

**El camino real, ejercitado y no aseverado.** Build de producción servido en un puerto libre
**explícito** (3421/3423/3425/3427, nunca el 3000) y con los bytes servidos comprobados antes
de fiarse: `@vite/client|@react-refresh|vite/dist/client|__vite` → **0 ocurrencias**. Chrome
headless por CDP sobre el `WebSocket` global de Node, sin añadir ninguna dependencia al repo.
La sonda es una galería con **todos** los componentes, que reemplaza temporalmente
`routes/index.tsx` y se restaura desde el índice en el mismo comando con `trap` (así no se
toca `routeTree.gen.ts`). Medido:

- **El cambio de tema no interpola**: 0 colores intermedios (arriba).
- **El hover sigue vivo tras el cambio**: 5 intermedios hasta `brand-700`, `td: 0.15s`.
- **El anillo de foco, en cuatro componentes** — `Button`, `Input`, `FutureLink` y el ítem del
  `ToggleGroup` —: los cuatro `enfocado: true`, `focusVisible: true`,
  `outline: 2px solid`, `outline-offset: 2px`, color `rgb(108,99,255)` = `brand-500` =
  `--color-ring`. **R38 medido, no afirmado.** (La primera lectura de esto salió
  `outline-style: none` con 3 px: el menú estaba abierto y atrapaba el foco, así que
  `btn.focus()` no llegaba. Se cerró el menú con Escape y se pulsó Tab de verdad antes de
  medir; si no, el 3 px era el `medium` por omisión de Chrome y no el anillo de nadie.)
- **El `Menu` con semántica de menú**: `aria-haspopup="menu"`, `aria-expanded` pasa a `true`,
  etiqueta «Apariencia», tres `role="menuitemradio"` con `aria-checked` (el del tema guardado
  en `true`), **44 px de alto cada uno** y `animation-duration: 0.15s` (§8 punto 3). La
  primera medición decía que el menú no abría: Radix abre en `pointerdown` y yo usaba
  `element.click()`. Con eventos de puntero de verdad, abre.
- **Alturas**: `default` 44, `lg` 48, `sm` 32 con área de pulsación de **44 px**, `icon` 44;
  campos 48; ítems del toggle 44.
- **Los 34 iconos pintan**, y los 34 con `aria-hidden="true"`.
- **Sin scroll horizontal** a 390 px (`scrollWidth` 390 = `innerWidth`) ni a 1440.
- **`Progress`**: `role="progressbar"`, `aria-label` y `aria-valuenow` presentes.
- Consola: sólo el 404 de `favicon.ico` (preexistente), un aviso del DOM de la **sonda** (un
  campo de contraseña fuera de un `<form>`, cosa de la galería) y la excepción de hidratación
  de abajo.

### Lo que el humano ve en el checkpoint

**Abrir `/` no enseña nada** — este paso no entrega rutas a propósito. Lo que hay que mirar
son las cuatro capturas de la galería, con **todos** los componentes en los dos temas y en las
dos anchuras:

- `…/scratchpad/cdp/out4/galeria-claro-1440.png` y `galeria-claro-390.png`
- `…/scratchpad/cdp/out4/galeria-oscuro-1440.png` y `galeria-oscuro-390.png`

(ruta completa: `/private/tmp/claude-501/-Users-brauliodiez-lemoncode-demo-memora/e1755a81-d274-442a-a863-bad54ef6d592/scratchpad/cdp/out4/`)

Qué mirar con ojo crítico:

1. **El modo oscuro**, que §6 marca explícitamente para revisión a ojo porque esta parte no
   tiene ningún artboard oscuro. En particular el botón `soft` («Editar») y el relleno de los
   avatares: se quedan en lavanda clara sobre fondo oscuro (ver abajo).
2. **El conjunto de iconos completo**, donde se ve que `success` y `check` pintan el mismo
   glifo (la marca dentro de un círculo).
3. Los tres tonos de `EmptyState`, que son los tres estados de la invitación.
4. El `sm` del `Button`: se ve pequeño a propósito (es lo que dibuja `Profile-D`) y su área de
   pulsación mide 44 px aunque no se vea.

La galería **no** se entrega: vive en el scratchpad y se monta con un comando con `trap` que
restaura el árbol. El solape entre la `Card` y «Privacidad» que se ve en las capturas es de la
maquetación de la sonda (una fila `flex` sin `min-w`), no de los componentes.

### Lo que queda anotado para otros grupos

- **El fichero de tokens no tiene familia semántica de *hover*.** El DS pide
  `hover:bg-brand-700` para el primario, `hover:bg-brand-200` para el `soft` y
  `hover:bg-border-strong` para el `secondary`; como no hay token semántico para eso, los tres
  referencian la escala **primitiva** por `var()`. Sin literales, pero un nivel por debajo de
  lo que el contrato prefiere. Candidato claro de fichero de tokens.
- **Ni familia *accent* semántica**: el tono `peach` de `EmptyState` referencia primitivas por
  lo mismo. `mint` no lo necesita porque `success-foreground` ya hace ese trabajo.
- **El avatar y el botón `soft` no se invierten en oscuro.** El DS usa `brand-900/40` +
  `brand-200` en temas oscuros; el fichero de tokens **no declara ese override** para
  `pill`/`pill-foreground`, así que se usa la pareja declarada y medida (brand-100 /
  brand-700), que es legible en los dos modos pero deja dos manchas claras en el oscuro. Es
  visible en la captura oscura. Inventar el color aquí habría metido un valor sin medir por el
  gate de contraste; por eso se deja y se cuenta.
- **La restricción SSR/hidratación del Grupo 12 ya no es una predicción: está medida.** La
  galería pinta `theme` y `resolvedTheme` sin puerta de montaje, y con un tema guardado en
  `dark` el navegador tira **React #418** (el texto servido no coincide con el hidratado); sin
  nada guardado, **cero excepciones**. Es decir: lo que `progress.md` tenía anotado para T40 y
  T41 ocurre de verdad y se ve así. Ningún componente de esta entrega pinta estado de tema,
  así que la aplicación entregada no lo sufre — pero quien monte los dos controles necesita la
  puerta de montaje o `useSyncExternalStore` con snapshot de servidor, y ahora sabe qué error
  va a ver si se la salta.
- **Las dos piezas internas que importan un glifo directo de `lucide-react`** y no pasan por
  `Icon`: el spinner del `Button` (`LoaderCircle`) y el indicador del ítem de menú
  (`CheckIcon`). Son piezas internas de los primitivos, no iconos con nombre de la aplicación;
  el mapa cerrado de R33 es el vocabulario de las pantallas, no una aduana sobre los
  primitivos.

### Fix-loop iteración 2 — review REJECT: dos puntos bloqueantes, los dos reales

**T46 aguantó.** La review reprodujo el fallo del rAF único por su cuenta y además **tiró su
primer arnés** al darse cuenta de que sondear `getComputedStyle` desde un rAF registrado antes
del cambio fuerza un recálculo temprano que **suprime él solo** la transición — con lo que
hasta el rAF único salía verde. Vuelto a medir con oyentes de `transitionrun`/`transitionstart`:
sin supresión y con un rAF se disparan transiciones de `background-color` y `color`; **con rAF
doble no se dispara ninguna**, ni por el camino del control ni por el del sistema operativo, y
el hover sigue interpolando después del cambio. O sea: el diagnóstico y el arreglo quedan
confirmados por una sonda más estricta que la que los encontró.

#### Bloqueante 1 — `Button variant="link"` no era un enlace

`cva` compone variante **antes** que tamaño y la cadena entera pasa por `cn`, que es clsx **más
tailwind-merge**: de dos clases en conflicto gana la última. Así que el `h-auto px-0` de la
variante lo barría la geometría del tamaño y `link` salía con **44 px de alto y 16 px de
padding** — geometría idéntica a `default`. Los artboards ponen `link` **dentro de una frase**
(«¿La has olvidado?» en la misma línea que la etiqueta «Contraseña»; «Crea una» e «Inicia
sesión» dentro de un párrafo), y el Grupo 6 construye esas pantallas.

Arreglado moviendo **las dos** reglas de geometría a `compoundVariants`, que `cva` emite
después del tamaño y por tanto ganan en `cn`:

- `variant: 'link'` → `h-auto px-0`.
- el extensor de área de pulsación pasa a `{ variant: [default, secondary, soft, ghost], size:
  'sm' }`, porque en un enlace en línea metía 44 px invisibles por encima y por debajo y se
  habría comido los clics del texto que lo rodea. Ese segundo efecto no estaba en el reporte y
  salió al arreglar el primero.

**Medido en el navegador**: `link` mide **20 px de alto, `padding` 0 y `display: inline-flex`**;
`default`, 44 px y 16 px. Y hay spec: `apps/web/src/common/components/ui/button.spec.tsx`
asevera la salida de `cn(buttonVariants(...))` — una función pura, no markup de pantalla
(R99) —, incluye el caso negativo para no ser vacua, y falla con 4 tests sobre el código
anterior.

#### Bloqueante 2 — el ítem del menú de tema no pintaba anillo de foco

`dropdown-menu.tsx` llevaba `outline-none` en la base. En Tailwind v4 eso pone
`--tw-outline-style: none` **sin condición**, y `focus-visible:outline-2` resuelve
`outline-style: var(--tw-outline-style)` → `none`: las tres utilidades de foco eran **código
muerto que se leía como cumplimiento**. La misma forma de fallo silencioso que el titular de
T46, y tampoco la veía ningún test (jsdom no computa Tailwind, y el escáner anti-hardcode mira
colores y dimensiones).

Arreglado quitando `outline-none`. **Y medido con teclado de verdad**, que era la pregunta
abierta: Radix mueve el foco **programáticamente** en el roving de flechas, así que si
`:focus-visible` casa ahí no se podía suponer. Entrando por teclado de principio a fin (Tab →
foco en el disparador → Enter → flechas), el ítem resaltado mide **`outline: solid 2px`,
`outline-offset: 2px`, color `rgb(108,99,255)` = `brand-500`**, con `focusVisible: true` y
`data-highlighted` presente — y lo mismo el segundo ítem tras otra flecha. Es decir:
`focus-visible:` **sí** es el gancho correcto bajo el foco programático de Radix, y no hace
falta ni `focus:` ni `data-highlighted:`; no se ha añadido un segundo anillo que sólo funcione
con Tab.

**Guarda nueva**, `apps/web/src/common/components/focus-ring.spec.ts`: ningún componente puede
mezclar `outline-none` con las utilidades de foco. Mira **código y no prosa** (quita bloques
`/* … */` y líneas de comentario) para que un comentario pueda nombrar el peligro — es la
tercera vez en este paso que un literal dentro de un comentario dispara una de mis propias
guardas, así que esta se arregló en la guarda y no en el comentario. Verificada contra el
mutante: devolviendo `outline-none` a la clase, 1 test en rojo.

#### Las cuatro advisories, todas arregladas

1. **`EmptyState` y `Avatar` indexaban objetos literales** donde `Icon` usa un `Map`. Ahora los
   tres tienen la misma forma — la lección por la que el Grupo 1 fue rechazado dos veces — con
   una caída explícita al valor por omisión (`?? SIZE_CLASSES.default`, `?? TONE_CLASSES.neutral`,
   `?? SIZE_CLASSES.md`) en vez de a `undefined`.
2. **`disabled:cursor-progress` no se ve nunca**: `disabled:pointer-events-none` gana el hit
   test. Fuera; se queda sólo la opacidad, que sí se pinta.
3. `toEqual` → **`toStrictEqual`** en `icon.component.spec.tsx`.
4. **El test del camino del SO no fijaba sus dos fotogramas** (pasaba también con un rAF
   único). Ahora asevera uno a uno, como el del control.

#### Una enmienda del contrato, del coordinador

§8 punto 2 pasa a ser una **categoría**, «afordancias de carga» — el spinner del `Button` y el
pulso del `Skeleton` —, explícitamente **fuera** del presupuesto de 150/250/350 ms de la
interacción, porque señalan trabajo en curso en vez de responder a un gesto. El comentario de
`Skeleton` decía que el pulso «hereda el presupuesto de §8 ya resuelto», que era justo al revés
(el pulso de Tailwind es un ciclo de ~2 s con su propia curva). Corregido; el pulso se queda.

#### Para el acta

**R28 y R89 no son de este paso**: ninguna tarea de los Grupos 3 o 4 las referencia. El trabajo
de los 44 px se sostiene por sí mismo y midió bien (Button 44, `lg` 48, `icon` 44×44,
`ToggleGroupItem` 44, `Input` 48, ítem de menú 44, y el extensor del `sm` verificado), pero no
se cuentan como obligaciones de este paso.

No se tocan, por indicación expresa: que `Progress` convierta un `value` ausente en 0 %; que los
diez primitivos no lleven spec (es lo que pide la lista de ficheros de `design.md`, y es
pregunta para el humano); y R35, que se sigue honrando como está escrita mientras no cambie.

## Grupos 5 y 6 — dataset mock, formateadores y assets del diseño (T17–T21), paso 4/8

Cinco tareas, las cinco en verde. Auto-commit **off**: save-point en el índice tras cada tarea
verde, cero commits, cero pushes. **Nada de este paso renderiza** — son datos y bytes; `/` sigue
devolviendo `null` hasta T26, y ni una pantalla ni una ruta se han construido.

**Preflight de TDD.** Playbooks aplicables: **ninguno** — `docs/playbooks/` solo contiene el
`README.md` del harness y no hay capa global (`paths.playbooks_global` sin declarar). Entorno de
test: **node** (`@vitest-environment node`) en los cuatro ficheros de spec nuevos, porque son
fixtures y funciones puras sin DOM; la config de vitest tiene jsdom por defecto, así que cada uno
lo declara explícitamente.

Suite: **170 → 186** tests en `@memora/web` (16 nuevos, 10 ficheros). Los siete gates en verde con
la caché de turbo saltada (`--force`), `pnpm audit --audit-level=moderate` sin vulnerabilidades, y
cobertura **N/A**: no hay provider `@vitest/coverage-*` instalado en el repo.

### T17 — las fixtures en forma de respuesta de API

Cinco ficheros en `apps/web/src/common/mock-data/`, `snake_case` y fechas ISO (R39). Un ciclo
rojo→verde de verdad: el spec de los círculos existía antes que el fichero.

- `circles.mock.ts` — **el cruce deliberado hacia la Parte 2** (R48). Los cuatro círculos salen
  del `renderVals()` de `Profile-D`, que es el único artboard que dibuja la sección «Círculos»
  del raíl, y en su orden: Familia García · Lisboa 2026 · Amigas de la uni · Boda de Ana y Leo.
- `users.mock.ts` — Sofía Martín (`sofia.martin@correo.es`, de `Profile-M` / `Profile-D` y de la
  línea «Entrarás como …» de `Invite-M`) y Lucas Vidal (de `Invite-M` / `Invite-D`).
- `storage.mock.ts` — `used_bytes: 3_100_000_000`, `limit_bytes: 5_000_000_000`, `plan_code: 'free'`.
- `invitations.mock.ts` — token, `state_code`, `expires_at` ISO, nombre del círculo e invitador.
- (`form-demo-values.mock.ts` es T18.)

**Decisiones, ninguna de ellas contra el spec:**

1. **Sin campo `id` en ninguna fixture.** En los círculos es obligado: R48 dice «nombre e imagen
   de portada **y nada más**», y un `id` es precisamente el campo con el que la Parte 2
   construiría `/circles/$id` — ensancharlo ahí sería el scope drift que el paso vigila. Por
   coherencia tampoco lo llevan el visor ni el invitador: ninguna pantalla de esta parte lo
   consume y el diseño no lo dibuja. La lista del raíl se indexa por `name`, único en el dataset.
2. **El invitador no tiene `email`.** `UserSummaryApiShape = Omit<UserApiShape, 'email'>`. Ningún
   artboard muestra el correo de Lucas Vidal, y un backend no se lo daría a quien recibe la
   invitación. La alternativa era inventarse uno, que es contrato que nadie ha decidido.
3. **Los códigos de estado de la invitación son del backend, no el vocabulario de la URL.**
   `'pending' | 'expired' | 'invalid' | 'already_member'`. El vocabulario `?estado=` es castellano
   (`caducada`, `invalida`, `ya-miembro`) y vive en la URL: traducirlo es trabajo del `business`
   del pod `invite` (Grupo 11), y el mapper lleva el código a su enum de front (R43).
4. **Las cifras de almacenamiento están elegidas para cuadrar con la barra del artboard.**
   3,1 / 5 = 62 %, que es exactamente el `p: 62` que `Profile-M` y `Profile-D` le pasan a su
   `Progress`. GB decimales (10⁹): en GiB binarios esos 5 000 000 000 bytes se leerían «4,7 GB» y
   el artboard dice «5 GB».
5. **`circle_name` de la invitación repite el literal «Familia García»** en vez de referenciar
   `circlesMock[0]`. Los artboards reutilizan el nombre, pero el diseño no declara que la
   invitación apunte al primer círculo del raíl, y un backend sirve esas dos cosas por endpoints
   distintos. Acoplarlas sería inventar una relación.
6. **Las fixtures no llevan spec, salvo las dos guardas de abajo.** `design.md` no lista ningún
   `.spec.ts` para `mock-data/`, y R97 nombra mappers, repositorios, `business` y formateadores —
   no fixtures. El skill de TDD lo dice igual: contenido estático y constantes no llevan ciclo.

**Dos specs añadidos por encima de la lista de ficheros de `design.md`**, los dos guardando un
requisito y no la forma de un dato, y los dos declarados aquí para que el review pueda rechazarlos:

- `circles.mock.spec.ts` — el orden de los cuatro nombres, y que **cada círculo expone exactamente
  `name` y `cover_url`**. Hace mecánica la letra de R48: el día que alguien añada un recuento de
  miembros, el test lo dice en vez de que lo note una persona leyendo el diff.
- `mock-data-assets.spec.ts` — ver T21.

### T18 — los valores de demostración (R49, R69)

`form-demo-values.mock.ts`. Contenido estático, sin ciclo de TDD. Los valores están leídos de los
artboards, campo a campo:

| Variante | Artboard | Valores |
| --- | --- | --- |
| `/login?estado=error` | `Login-M-Error` | email `sofia.martin@correo` (cortado), contraseña **vacía** |
| `/register?estado=error` móvil | `Register-M` | `Sofía Martín` · `sofia.martin@correo.es` · `recuerdos2026` · repetición `recuerdos206` |
| `/register?estado=error` escritorio | `Register-D` | `Sofía Martín` · `sofia@memora.app` · `recuerdos` · repetición `recuerdos` |
| `/profile?estado=error` | `Profile-D` | `Sofía Martín Ortega` · `sofia@memora.app` |

Tres cosas que conviene dejar escritas:

1. **El reparto por breakpoint solo existe donde el contrato lo reparte.** `/register` lleva
   `{ mobile, desktop }` porque §10 nombra dos juegos distintos y `Register-D` es
   deliberadamente más rico (dos campos inválidos y un mensaje de nivel de formulario más exigente
   que el de móvil: «al menos 8 caracteres **y un número**»). `/login` lleva **un** juego, porque
   §6 dice que escritorio lleva el mismo `Alert` y los mismos campos inválidos al formulario de
   `Login-D`. `/profile` lleva uno, porque `Profile-D` es su único artboard de estado `error`.
2. **La contraseña del error de login va vacía**, que es lo que dibuja `Login-M-Error`: solo
   placeholder, bajo «Escribe tu contraseña.». No es un hueco por olvidar.
3. **Es el único fichero de `mock-data/` en camelCase.** No es una respuesta de API — ningún
   backend devuelve «lo que la persona ha escrito» —, y el doc comment lo dice para que no se lea
   como una incoherencia con sus vecinos.

**Observación para el Grupo 9, no un bloqueo:** `Login-D` es el artboard del estado `enviando` y
**también** dibuja email y contraseña rellenos. R69 confina los valores de demostración a las
variantes `?estado=error`, así que `enviando` se entrega **vacío** y no hay entrada para él en la
fixture. El contrato no es ambiguo (la decisión de §10 es explícita), pero un formulario vacío,
deshabilitado y con «Entrando…» se ve raro, y es el humano quien debe verlo venir en el checkpoint
del Grupo 9 en vez de descubrirlo entonces.

### T19 — `formatLongDate` (R43, R97)

`apps/web/src/common/formatters/date.formatter.ts`, en `common/` y no en el `business` de cada pod
porque lo necesitan pods distintos y un import entre pods está prohibido (D12, R46).

Un ciclo rojo→verde real (el de «24 de octubre») y **tres guardas que nacieron verdes**: una sola
llamada a `Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' })` satisface todo el
requisito a la vez, así que escribir más tests rojos habría sido teatro. En lugar de eso, las tres
guardas se **probaron a mano** mutando la fuente, cada mutación restaurada por un `trap` instalado
antes de tocar el fichero:

| Mutación | Resultado |
| --- | --- |
| `'es-ES'` → `'en-GB'` | 3 tests rojos — mutante muerto |
| añadir `year: 'numeric'` | 4 tests rojos — mutante muerto |
| `day: 'numeric'` → `'2-digit'` | 1 test rojo (justo el del día sin cero) — mutante muerto |

**Una afirmación mía falsificada por el run real.** El doc comment decía que las fechas del dataset
están a mediodía UTC «para que el día mostrado no dependa de la zona horaria». Ejecutado de verdad:

```
TZ=Europe/Madrid       → 24 de octubre
TZ=Pacific/Midway      → 24 de octubre   (UTC−11)
TZ=Pacific/Kiritimati  → 25 de octubre   (UTC+14)
```

Mediodía UTC estabiliza el día **de UTC−11 a UTC+11**, no en todas las zonas. El comentario está
corregido en los tres ficheros que lo repetían (`date.formatter.ts`, `date.formatter.spec.ts`,
`invitations.mock.ts`) y ahora dice lo medido. **El comportamiento no se ha cambiado**: formatear en
la zona de quien mira es lo correcto para una fecha que se le muestra a una persona, y fijar UTC
haría la salida determinista a cambio de mentirle a quien lee desde otro huso. Queda como
observación para el humano: alguien que abra las pantallas desde UTC+12…+14 leerá «25 de octubre»
donde el diseño dice 24.

### T20 — `formatStorageUsage` (R43, R97)

Dos ciclos rojo→verde reales — la etiqueta primero, el porcentaje después (el segundo test rojo
porque la función devolvía solo `{ label }`) — y cinco guardas. Cuatro probadas a mano:

| Mutación | Resultado |
| --- | --- |
| `'es-ES'` → `'en-GB'` | 3 tests rojos — mutante muerto |
| `BYTES_PER_GB` 10⁹ → 2³⁰ (GiB) | 5 tests rojos — mutante muerto |
| quitar `Math.round` del porcentaje | 1 test rojo — mutante muerto |
| `maximumFractionDigits: 1` → `2` | **7 tests verdes — mutante SUPERVIVIENTE** |

El cuarto encontró un hueco real: todos mis valores de prueba tenían un decimal significativo como
máximo (3,1 · 1,4 · 2 · 1), así que un tope de dos decimales daba exactamente la misma salida y
nada fijaba la precisión del diseño. Cerrado con un test de 3,14 GB → «3,1 GB»; re-probada la misma
mutación, ahora **muere**.

**Dos omisiones deliberadas**, escritas en el propio fichero para que no se lean como descuidos:

- **Solo GB.** El diseño no dibuja ninguna cifra en KB, MB ni TB, así que no hay escalera de
  unidades. Cuando aparezca una será una decisión con su propio test.
- **Sin guarda para `limitBytes === 0`** ni tope en el 100 %. El único origen de estas cifras en
  esta parte es `storageMock`, cuyo límite es una constante distinta de cero: una guarda aquí sería
  código no alcanzable y, peor, un número elegido a dedo que nadie podría justificar más tarde.

### T21 — los assets del diseño (R95)

Un ciclo rojo→verde de verdad, y el rojo cubre justo la costura entre los dos grupos:
`mock-data-assets.spec.ts` recorre las rutas `avatar_url` / `cover_url` del dataset y comprueba
(a) que son rutas locales relativas a la raíz y nunca URLs remotas, y (b) que **cada una resuelve a
un fichero bajo `apps/web/public/`**. Rojo con los seis ficheros ausentes; verde al copiarlos.
Re-probada renombrando una portada: el test la nombra. Es R95 hecho mecánico — una ruta mal escrita
se ve aquí y no tres grupos más tarde como un hueco en una pantalla.

**La lista es derivada de los artboards, no adivinada.** Los doce artboards de la Parte 1 leídos del
canvas uno a uno, y de cada uno extraída toda referencia a `/_blob/<id>` **y** los ids que
`Profile-D` construye dentro de su `renderVals()` vía `B(id)` (un `grep` de `/_blob/` solo se los
habría perdido: así es como aparecen las cuatro portadas del raíl). Unión: **17 ids distintos**.
`Register-M` no referencia ninguna imagen.

**Dónde mi lista discrepa de la del coordinador.** Los once ids que el coordinador ya había visto
están los once confirmados. Pero *«`Register-D`'s seven are **its own** and differ from login's»* no
se sostiene: `58592cecc88cf2e43efdff86c9ff03d5` está **en los dos** — es la casilla 4 del collage de
`Login-M` / `Login-D` y la casilla 1 del mosaico de `Register-D` —, y `b16f5dec…` es a la vez la
casilla 3 de ese mosaico y la portada de «Amigas de la uni». De las siete de `Register-D`, **cinco**
son exclusivamente suyas. Confío en los artboards.

**Nomenclatura**, mecánica y determinista: las portadas y los avatares por lo que son, y las diez
fotografías restantes numeradas en orden de casilla (primero las que solo usa el collage de login,
en el orden de `Login-M`; después las que solo usa `Register-D`, en el orden de su mosaico). El
mapa completo, que es lo que los Grupos 7, 9 y 10 necesitan para reproducir los artboards:

| id del canvas | fichero en el repo | dónde se usa |
| --- | --- | --- |
| `65d75f78…` | `public/brand/memora-mark.svg` | la marca, en los 12 artboards |
| `55e85f8e…` | `public/mock/avatar-sofia-martin.jpg` | `Profile-M/-D`, fila de identidad del raíl, `NotFound-D` |
| `b0620a29…` | `public/mock/avatar-lucas-vidal.jpg` | `Invite-M/-D` |
| `abcac459…` | `public/mock/circle-familia-garcia.jpg` | portada del raíl · collage login casilla 2 |
| `9778d12a…` | `public/mock/circle-lisboa-2026.jpg` | portada del raíl · collage login casilla 3 |
| `b16f5dec…` | `public/mock/circle-amigas-de-la-uni.jpg` | portada del raíl · mosaico `Register-D` casilla 3 |
| `3b0497c0…` | `public/mock/circle-boda-de-ana-y-leo.jpg` | portada del raíl (solo ahí) |
| `5b688922…` | `public/mock/photo-01.jpg` | collage login casilla 1 |
| `58592cec…` | `public/mock/photo-02.jpg` | collage login casilla 4 · mosaico `Register-D` casilla 1 |
| `bb1dcd55…` | `public/mock/photo-03.jpg` | collage login casilla 5 |
| `b2e25f01…` | `public/mock/photo-04.jpg` | collage login casilla 6 |
| `0044f653…` | `public/mock/photo-05.jpg` | collage login casilla 7 |
| `09b5806b…` | `public/mock/photo-06.jpg` | mosaico `Register-D` casilla 2 |
| `7555847d…` | `public/mock/photo-07.jpg` | mosaico `Register-D` casilla 4 |
| `1b43b175…` | `public/mock/photo-08.jpg` | mosaico `Register-D` casilla 5 |
| `40662964…` | `public/mock/photo-09.jpg` | mosaico `Register-D` casilla 6 |
| `579e56b5…` | `public/mock/photo-10.jpg` | mosaico `Register-D` casilla 7 |

Orden de casillas del collage de `Login-M` (7): `photo-01` · `circle-familia-garcia` ·
`circle-lisboa-2026` · `photo-02` · `photo-03` · `photo-04` · `photo-05`. `Login-D` usa las mismas
siete con otros `span`; `Login-M-Error` usa solo las cuatro primeras. Mosaico de `Register-D` (7):
`photo-02` · `photo-06` · `circle-amigas-de-la-uni` · `photo-07` · `photo-08` · `photo-09` ·
`photo-10`.

#### Peso — el informe que este grupo debe al checkpoint

**Total: 1 880 200 bytes (1,79 MiB) en 17 ficheros.** Es irreversible: una vez en el historial de
git, recortarlo es un rewrite. Por eso el detalle, con el tamaño al que cada fichero **se dibuja**.

Las geometrías de dibujo salen del CSS en línea de los propios artboards: en `Login-M` el collage
son 3 columnas de (390 − 24)/3 = 122 px con `scale(1.12)` → **≈137 px de ancho** y filas de 150/170
px → **≈168 px** (≈365 px las que ocupan dos filas). En `Login-D` y `Register-D` la sección
izquierda es `flex: 1 1 560px` frente a una derecha `1 1 480px`: a 1440 px de viewport son ≈775 px,
menos `inset: 24px` y 3 huecos de 12 px → columnas de **≈173 px**, y **≈358 px** las de dos columnas.
Ese ≈358 px es el ancho máximo al que cualquier fotografía llega a dibujarse en toda la parte.

| fichero | bytes | píxeles | se dibuja a | ¿proporcionado? |
| --- | --- | --- | --- | --- |
| `brand/memora-mark.svg` | 559 | vectorial | 30–36 px | sí (SVG, 559 B) |
| `mock/avatar-sofia-martin.jpg` | 8 775 | 160×160 | 32–72 px | sí |
| `mock/avatar-lucas-vidal.jpg` | 8 625 | 160×160 | 32 px | sí |
| `mock/circle-amigas-de-la-uni.jpg` | 65 449 | 900×601 | ≈173 px (mosaico) / fila del raíl | **no** |
| `mock/circle-familia-garcia.jpg` | 91 042 | 900×600 | ≈137 px (collage) / fila del raíl | **no** |
| `mock/circle-lisboa-2026.jpg` | 162 121 | 900×598 | ≈137 px (collage) / fila del raíl | **no** |
| `mock/circle-boda-de-ana-y-leo.jpg` | 195 362 | 900×1350 | solo fila del raíl (264 px de raíl) | **no, el peor caso** |
| `mock/photo-01.jpg` | 221 707 | 900×1350 | ≈137×365 px (`Login-M`) · ≈358 px (`Login-D`) | **no, el fichero más grande** |
| `mock/photo-02.jpg` | 113 256 | 900×600 | ≈137 px · ≈358 px | **no** |
| `mock/photo-03.jpg` | 58 733 | 900×600 | ≈137 px · ≈173 px | límite |
| `mock/photo-04.jpg` | 167 193 | 900×1350 | ≈137 px · ≈173 px | **no** |
| `mock/photo-05.jpg` | 147 338 | 900×600 | ≈137 px · ≈173 px | **no** |
| `mock/photo-06.jpg` | 173 447 | 900×1355 | ≈173×358 px (`Register-D`) | **no** |
| `mock/photo-07.jpg` | 132 225 | 900×600 | ≈358 px (`Register-D`, 2×2) | límite |
| `mock/photo-08.jpg` | 77 971 | 900×598 | ≈173 px | límite |
| `mock/photo-09.jpg` | 170 637 | 900×693 | ≈173 px | **no** |
| `mock/photo-10.jpg` | 85 760 | 900×600 | ≈358 px | sí |

Los números que hacen falta para decidir, sin decidir nada:

- **Once de los dieciséis JPEG pesan más de 65 KB y ninguno se dibuja por encima de 358 px CSS.**
  A DPR 2 eso son 716 px de dispositivo: los 900 px de origen son ~1,3× lo necesario en el mejor
  caso y **~3,3×** en el collage móvil de 137 px. Los 1,86 MiB de fotografías son el 99,97 % del
  peso del paso.
- **El peor caso es `circle-boda-de-ana-y-leo.jpg`**: 195 KB y 900×1350 px para un fichero que en
  toda la Parte 1 solo aparece como una fila del raíl lateral, dentro de 264 px de ancho. `photo-01`
  es el más grande en bytes (221 KB, 900×1350) y su dibujo mayor son ≈137×365 px en móvil.
- **Las cuatro portadas pesan 514 KB** y las cuatro se dibujan, en su uso principal, como una fila
  de un raíl de 264 px. El tamaño exacto de esa miniatura lo fija el `SideNav` que construye el
  Grupo 7, que aún no existe; a cualquier tamaño plausible de fila, 65–195 KB es desproporcionado.

**No he redimensionado ni recomprimido nada.** Son los assets del diseño y tocarlos es una decisión
del humano en el checkpoint, no mía. Los bytes están en el repo exactamente como el canvas los
sirve (sha256 de cada uno comprobado al descargar). Si la respuesta es «recomprímelos», el momento
es **antes** del primer commit, que es justo donde está el árbol ahora.

#### El camino real, ejercitado

Build de producción servido con el servidor de nitro en un puerto libre **explícito (4319)**, nunca
el 3000, y antes de medir nada un `grep` de marcadores de dev sobre los bytes servidos:
`/@vite/client`, `__vite`, `@react-refresh`, `vite/dist/client` → **0 coincidencias** en los 2 527
bytes de `/`. Confirmado que era el build.

- **Los 17 assets responden 200** desde el servidor local, con el `content-type` correcto
  (`image/svg+xml` y `image/jpeg`) y un `content-length` que coincide byte a byte con el origen.
- **La única URL remota en el HTML servido** es el `<link>` de Google Fonts, que es exactamente lo
  que R75 permite y no afecta a build ni a CI. Ninguna imagen sale a la red.
- **Las fixtures atravesando los formateadores de verdad** (no solo en el suite), con `tsx` sobre
  los módulos reales: `invitationMock.expires_at` → «24 de octubre»; `storageMock` →
  «3,1 GB de 5 GB usados · plan Gratis» y `percent: 62`; `'email' in inviterMock` → `false`; los
  nombres de campo de cada círculo → `name, cover_url`. Es la cadena T17 → T19/T20 completa.

### Hallazgo lateral, independiente de este paso

**La marca del diseño lleva tres colores literales y está fuera del alcance del gate de tokens.**
`public/brand/memora-mark.svg` trae `#584fe5`, `#aaa2ff` y `#ec4899` escritos a mano. Los dos
primeros **son** valores del token file (`brand.600` y `brand.300`), así que son deriva latente: el
día que la marca cambie de color en `docs/design-tokens.json`, el SVG no la seguirá. El tercero,
`#ec4899`, **no corresponde a ningún token**: el `accent.pink.base` del token file es `#ff39c6`, y
es el que los artboards usan (`var(--memora-accent-pink)`) para el punto rosa del héroe de
invitación — de modo que el punto de la marca y los puntos de acento de las pantallas son dos rosas
distintos. Y nada de esto lo ve `design-tokens:validate`: medido, `lemony design-tokens validate
--scan apps/web/public` reporta **0 ficheros escaneados**, porque `.svg` no está en el juego de
extensiones del escaneo. Es el asset del propio diseño, no bloquea nada y no lo he tocado.

### Lo que este paso NO ha hecho

Ni pantallas ni rutas (`/` sigue en `null` hasta T26). No se han tocado `docs/design-tokens.json`,
`tokens.generated.css`, el generador, `harness.config.yml`, `ci.yml`, `.prettierignore`, los
ficheros del tema ni la biblioteca de componentes. No se ha tocado el mapa de iconos. El Grupo 7
**no se ha empezado**. Ni un commit, ni un push: todo en el índice.

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
- step 3/8 (anchor 38d3a54) — review ×2 (1 reject: `Button variant="link"` loses its geometry to tailwind-merge; `DropdownMenuRadioItem`'s `outline-none` makes its focus ring dead code) — ledger: group 3 criteria 8/8 + group 4 criteria 7/7 (basis: requirements), gates 7/7 (basis: config), passes 2/2 → checkpoint: OK
- step 4/8 (anchor 67930ad) — review ×1 — ledger: group 5 criteria 6/6 + group 6 criteria 1/1 (basis: requirements), gates 7/7 (basis: config), passes 2/2 → checkpoint: OK

## Next action

**Grupos 5 y 6 terminados** (T17–T20 y T21), a la primera: siete gates en verde, `audit`
limpio, camino real ejercitado, todo en el índice y **sin commitear** → review y checkpoint
humano. Dos cosas esperan decisión del humano en ese checkpoint, ninguna bloqueante:

1. **El peso de los assets.** 1,79 MiB, y once de los dieciséis JPEG pesan más de 65 KB sin
   dibujarse nunca por encima de 358 px CSS. Si la respuesta es recomprimir, el momento es antes
   del primer commit — ahora — porque después es un rewrite del historial.
2. **La marca hardcodea dos colores que son tokens** (`brand.600`, `brand.300`) y un tercero que no
   es ninguno, y `.svg` está fuera del escaneo anti-hardcode. Es el asset del diseño; no lo he
   tocado.

Con el OK, el Orchestrator commitea y despacha el **paso 5/8**, Grupos 7 + 8 (el shell y las
primeras rutas). Si el humano pide cambios, la iteración entra sobre el índice tal cual está.

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


**Declined at step 2's checkpoint, recorded so nobody revives them as defects:** the four
non-blocking advisories of step 2's review — three surviving mutants (the «Sistema» row of the
`setTheme` test asserting a fallback rather than a write, `readSystemPrefersDark`'s `?? false`,
and the post-subscription resync) and the latent `</script>` escape in `THEME_BOOTSTRAP_SCRIPT`'s
`JSON.stringify`. The code is correct in all four; what is missing is test strength and one piece
of hardening. The human declined them knowingly.

**Interim for the tokens issue #13, decided here so it is not improvised per component:** the
token file has no shadow and no `letter-spacing` families. Components use **Tailwind's built-in
`shadow-*` and `tracking-*` utilities**, never an arbitrary value with a literal in it. Tailwind's
`tracking-tight` is already `-0.025em`, the design system's value, so tracking needs nothing. The
shadows differ slightly from the design system's, which is the accepted cost of deferring #13 —
and because both families are Tailwind `@theme` namespaces, #13's fix redefines them from the
token file and every call site inherits it without being touched. An arbitrary
`shadow-[0_4px_12px_...]` would have to be hunted down instead.

## Review evidence — step 3

Per-step review of **Groups 3 + 4** (T9–T12, T46, T13–T16), anchor
`38d3a540dd230bac93620efd7a7718b02e10cef7`, auto-commit OFF (staged, uncommitted; 25 files,
HEAD still the anchor). Verdict **REJECT** — two measured defects, both invisible to the
163 green tests. No issue comment (per-step), no ledger (a REJECT approves nothing).

### Gates — all seven green, turbo cache bypassed

Run with `pnpm turbo run <t> --force` for the three turbo tasks, direct for the rest:

| Gate | Result |
| --- | --- |
| `build` | ✅ built in 84 ms; only pre-existing `MODULE_LEVEL_DIRECTIVE` "use client" warnings from `@tanstack/react-router` |
| `typecheck` | ✅ 3/3 packages (`tsc --noEmit` + `-p scripts`) |
| `test` | ✅ 163/163 in `@memora/web` (4 files), 11 in `@memora/db`, 7 in `console-runner` |
| `format:check` | ✅ all matched files use Prettier style |
| `design-tokens:validate` | ✅ 147 tokens, 41 files scanned, no hardcoded values |
| `design-tokens:contrast` | ✅ 56 pairs meet their WCAG floor |
| `design-tokens:css:check` | ✅ `tokens.generated.css` up to date |
| `pnpm audit --audit-level=moderate` | ✅ no known vulnerabilities (beyond the declared seven) |

Static acceptance criteria, all verified by hand: `git grep transition-all apps/web/src` → empty
(R104); `git grep -E "@/lib/utils|@radix-ui/react-"` → empty (R29); no `bundle.js` tracked (R30);
`Skeleton` referenced only inside its own file (R37); `home-page.tsx`/`.spec.tsx` gone and
`apps/web/src/components/` removed entirely (R74, D4); `ui/` holds exactly the ten files
`design.md` enumerates — no `toggle.tsx`; 14 `from 'cn'` imports and 7 `from 'radix-ui'`.

### Real run

Production build served on an explicit free port (63143, reserved via a `net` probe — never
3000). Served HTML verified production **before** measuring: zero `@vite/client` /
`react-refresh` / `RefreshRuntime` markers, hashed assets (`styles-DA-keqPO.css`,
`index-BoMF4Q88.js`), `<html lang="es" data-theme="system">` written by the pre-paint script.
`/` renders `null` by instruction (documented placeholder until T26) — correct, not an omission.
All browser measurements below are real headless Chrome over CDP against that build and that
stylesheet.

### T46 falsified by measurement, on both paths — it holds

The first harness attempt was **discarded as unsound**: sampling `getComputedStyle` from a rAF
registered *before* the swap forces an early style recalc while the marker is still present, which
itself suppresses the transition and made even the single-rAF variant look green. Re-measured with
`transitionrun`/`transitionstart` listeners, which cannot be perturbed that way. Probe element
carries the exact class string `button.tsx` emits for `variant="secondary" size="default"`
(obtained by running the real `cn(buttonVariants(...))`).

| Mechanism | `light→dark` | `dark→light` |
| --- | --- | --- |
| no suppression (negative control) | `transitionrun/start: background-color, color` | same |
| **single rAF (T46 as it first shipped)** | `transitionrun/start: background-color, color` | same |
| **double rAF (as implemented)** | *(no events)* | *(no events)* |

The negative control firing proves the probe can see interpolation; the single-rAF row
**independently reproduces the Implementer's diagnosis** — one `requestAnimationFrame` suppresses
nothing. Double rAF suppresses completely.

- **OS path, through the real provider listener** (`Emulation.setEmulatedMedia`
  `prefers-color-scheme: dark` with `data-theme="system"`, so nothing writes an attribute and the
  CSS `@media` arm repaints): background went `rgb(241,245,249)` → `rgb(23,35,50)`, **2 distinct
  colours, no intermediates**; `data-theme` stayed `system`; marker cleaned up. Without
  suppression the same swap yields 8 intermediates (`241,245,249 → 125,133,143 → 69,80,92 →
  44,55,69 → 32,44,59 → 27,39,54 → 24,36,51 → 23,35,50`).
- **The inverse acceptance criterion holds**: after a completed swap the marker is absent
  (`hasAttribute` → false) and a **real** `Input.dispatchMouseEvent` hover still interpolates —
  6 distinct colours `23,35,50 → 31,45,62 → 35,50,67 → 37,52,70 → 37,53,71 → 38,54,72`. The
  marker does not outlive its frame, so hover/focus transitions survive.
- The `styles.css` rule is in the built stylesheet verbatim:
  `html[data-theme-switching],html[data-theme-switching] *,…:before,…:after{transition:none!important}`.

### Mutation probes — 3 chosen, 3 killed (basis: no declared risk, so no ledger floor)

Hand-probe path (no `test:mutation` script declared). Each one composite trip with an `EXIT` trap;
`git status` after each confirmed the tree byte-identical and no `.bak` stranded.

| Mutant | Outcome |
| --- | --- |
| `theme-provider.component.tsx:109` double rAF → single rAF | **killed** — `theme-provider.component.spec.tsx:365` ("sobrevive al fotograma que pinta el cambio") |
| `icon.component.tsx:144` `ICONS.get(name)` → `(ICON_MAP as Record<…>)[name]` | **killed** — 5 tests (the inherited-key cases) |
| `icon.component.tsx:158` `aria-hidden` always `'true'` | **killed** — the `label` announcement test |

One note, advisory: only the **control-path** frame-count test constrains the two frames. The
OS-path test runs `correr()` twice then asserts `null`, which a single rAF also satisfies. Both
paths call the same `suppressTransitionsForSwap`, so they cannot diverge today — but the OS test
is not what kills the mutant.

### `Icon` production path — proven, not assumed

Vitest pins `import.meta.env.DEV` true even under `--mode production` (45/45 still pass), so that
route was inconclusive. Compiled the real file with the repo's own esbuild and
`--define:import.meta.env.DEV=false`: the throw is **eliminated**, not skipped —
`const Glyph = ICONS.get(name); return Glyph === void 0 ? null : React.createElement(Glyph, …)`.
With `DEV=true` the `throw new Error(«…» no está en el mapa de iconos…)` is present. R34/D15 hold
on both branches. The message string appears in no built asset. (`Icon` is additionally
tree-shaken out of the current build, since no route mounts it yet.)

### Focus ring (R38, §9) — 7 of 8 correct, one provably dead

Measured under **real keyboard focus** (`Input.dispatchKeyEvent` Tab chains — programmatic
`.focus()` does not set `:focus-visible`, which made the first attempt read `outline-style: none`
everywhere).

| Element | `:focus-visible` | outline-style | width | offset |
| --- | --- | --- | --- | --- |
| Button `default` / `sm` / `icon` / `link` | true | `solid` | 2px | 2px |
| Input | true | `solid` | 2px | 2px |
| FutureLink | true | `solid` | 2px | 2px |
| ToggleGroupItem | true | `solid` | 2px | 2px |
| **DropdownMenuRadioItem** | true | **`none`** | 2px | 2px |

Colour `rgb(108,99,255)` = `--semantic-color-ring` → `brand-500`. Built CSS confirms
`.focus-visible\:outline-2:focus-visible{outline-style:var(--tw-outline-style);outline-width:2px}`,
`…outline-offset-2{outline-offset:2px}`, `…outline-ring{outline-color:var(--semantic-color-ring)}`.
A/B isolating the single cause: the same class string with ` outline-none` removed measures
`outline-style: solid`. See failing point 2.

### Button geometry and the 44 px floor

| variant/size | height | padding-x | note |
| --- | --- | --- | --- |
| `*/default` | 44 | 16px | the touch-target token (`2.75rem`), beats the DS's 40 px |
| `*/lg` | 48 | 24px | |
| `*/sm` | 32 | 12px | hit area extended to 44 px — verified |
| `*/icon` | 44×44 | 0 | |
| **`link/default`** | **44** | **16px** | **defect — identical to `default/default`**; see failing point 1 |

ToggleGroupItem 44, Input 48 (`--component-field-height: 3rem`), DropdownMenuRadioItem 44 — all
at or above the floor. `FutureLink` is an inline `<a>` at 24 px, which is right for running copy;
the screens own its box.

**The `sm` hit-area extender is real.** `document.elementFromPoint` at the visual box ±5 px
returns the button; at ±8 px it does not — 32 + 2×6 = 44, and `::after` computes
`height: 44px; position: absolute; left/right: 0px`. Side by side with an 8 px gap, each button
owns its own edge (no overlap). Stacked vertically with **zero** gap the two 44 px areas overlap
by 6 px and the **later** sibling wins that band (`elementFromPoint` at B.top+2 → B), so the
upper button loses 6 px rather than stealing the lower one's — the safe direction. `Profile-D`
draws «Cambiar foto» / «Quitar» in a row, so this is fine today; worth remembering for any
zero-gap vertical stack of `sm` buttons.

### Spec compliance — 13 PASS, 2 PARTIAL over the slice

Slice = the 15 requirements Groups 3+4 reference (every task references at least one, so no
task-only rows). R28 and R89 are **not** in the slice — no task in these groups references them.

| Req | Status | Evidence |
| --- | --- | --- |
| R29 | ✅ PASS | 14 `from 'cn'`, 7 `from 'radix-ui'`, zero `@/lib/utils` / `@radix-ui/react-*`; typecheck + build green |
| R30 | ✅ PASS | no `bundle.js` tracked; the icon map and each dressing were *read* from the compiled bundle as data, vendoring nothing — correct per T10 |
| R31 | ⚠️ **PARTIAL** | every primitive and variant §5 enumerates exists, but `Button variant="link"` does not render as a link (measured). Lean variants accepted — §5's table, R31's own list and `design.md`'s file list enumerate exactly those |
| R32 | ✅ PASS | `EmptyState` (icon/tone neutral·peach·mint/title/body/size incl. `sm`), `Icon`, `Skeleton` present; `BottomNav`/`SideNav` are Group 7 |
| R33 | ✅ PASS | 14 DS + 19 handoff + `success` = 34 entries; spec asserts the counts and that each name renders, names written by hand from the contract (not derived from the map) |
| R34 | ✅ PASS | dev throw names the offending name; mutation-probed; production branch compiled and read |
| R35 | ✅ PASS *to the letter* | `success` canonical, `check` aliased to the same `CircleCheck`, asserted by identical `outerHTML`. **The premise is false — see spec-side below** |
| R36 | ✅ PASS | enforced by construction in `EmptyState` (`title` is required, so an accent-tinted icon cannot appear without a visible label); usage rule recorded in `Icon`'s doc comment as T13 asks |
| R37 | ✅ PASS | built, and `git grep Skeleton` finds only its own file |
| R38 | ⚠️ **PARTIAL** | 2px/2px solid measured on Button (all sizes), Input, FutureLink, ToggleGroupItem; **no ring on DropdownMenuRadioItem** |
| R71 | ✅ PASS | `href` is required, not optional; single named grep target for Parts 2–3; no `href="#"`, no unexplained disabled control |
| R74 | ✅ PASS | «Hola Mundo» and its spec deleted, `src/components/` gone; the `/` → `/login` redirect is R61/T26's half and correctly deferred |
| R94 | ✅ PASS | menu enter/exit inside `motion-safe:` on `duration-fast` + `semantic-motion-easing`; every component transition names explicit properties. Advisory below on `Skeleton` |
| R103 | ✅ PASS | measured on both paths (above); `styles.css` ↔ provider constant bound by a test; mutant killed |
| R104 | ✅ PASS | `git grep transition-all` empty, guarded by a test that splits the needle so the criterion's own grep stays empty |

### The two failing points

**1. `Button variant="link"` is not a link (R31).** `cva` composes `variant` **before** `size`, and
`Button` then passes the whole string through `cn` — which is clsx **+ tailwind-merge**. So the
variant's `h-auto px-0` is **stripped** in favour of the size's geometry. Measured in the browser:
`link/default` → height **44 px**, padding-x **16 px**, `display: flex` — byte-identical geometry
to `default/default`. `link/lg` → 48 / 24 px; `link/sm` → 32 / 12 px. Only `size="icon"` keeps
`px-0`, and only because `icon` sets no `px-*`. The emitted class string contains neither
`h-auto` nor `px-0`:

```
… text-link underline-offset-4 hover:underline h-[var(--primitive-dimension-layout-touch-target)] px-4 text-sm
```

R31 and T12 both require the `link` variant, and the artboards use it for inline text
(«¿La has olvidado?», where `link` must sit in a line of running copy). A 44 px-tall, 16 px-padded
flex block will not. The fix is one of: a cva `compoundVariants` entry zeroing the geometry for
`variant: 'link'`; moving height/padding out of `size` for that variant; or giving `link` its own
size default. Whatever the fix, it needs an assertion — this is the concrete cost of Group 3
shipping ten primitives with **zero specs** (only `icon.component.spec.tsx` exists, which is what
`design.md`'s file list asks for, so the gap is spec-sanctioned — but it is why this reached review).

**2. `DropdownMenuRadioItem` paints no focus ring (R38, §9).**
`dropdown-menu.tsx:105` carries `outline-none` in the base class list. In Tailwind v4 `outline-none`
sets `--tw-outline-style: none` **unconditionally**, and `focus-visible:outline-2` (line 108) sets
`outline-style: var(--tw-outline-style)` — which resolves to `none`. Measured under real keyboard
focus: `outline-style: none` while width (2px), offset (2px) and colour (`rgb(108,99,255)`) are all
set. The three `focus-visible:outline-*` utilities are dead code that reads as compliance — the
silent-failure shape, and the one the suite cannot see. A/B: the identical string without
`outline-none` measures `solid`. §9 says "focus is never implicit: 2 px ring at 2 px offset on
every interactive element"; a menu item is one, and it is the desktop theme control's three
checkable items (R28, Group 12). It does get `focus:bg-accent`, so keyboard navigation is not
invisible today — but that is a background change, not the required ring.
Fix: drop `outline-none`, or scope it (`focus:outline-none` / `outline-hidden`) so the
`focus-visible` rule can win. Worth confirming the ring paints on a **real** Radix item while
fixing it: Radix moves focus programmatically, so whether `:focus-visible` matches during arrow-key
roving should be measured rather than assumed — `focus:` or `data-highlighted:` may be the right
hook instead of `focus-visible:`.

### Advisory — not blocking, not re-raising anything already settled

- **`Skeleton`'s `motion-safe:animate-pulse` is motion outside §8's five** (R94's wider letter):
  Tailwind's own ~2 s cycle, not on `cubic-bezier(0.16, 1, 0.3, 1)`, not one of 150/250/350 ms.
  Zero rendered impact — nothing in this part mounts it — and declared in the file's doc comment.
  But that comment tells Part 2 it "inherits §8's budget already resolved", which is the opposite
  of true: it inherits a deviation. Settle it here or make the comment say so.
- **`Button loading`'s `animate-spin`** is §8 item 2, which admits the affordance without fixing
  its timing — so, admitted. Noting it only so the next reviewer does not re-derive it.
- **`disabled:cursor-progress` on a loading Button never shows**, because
  `disabled:pointer-events-none` from the base wins the hit test; the cursor comes from the parent.
- **`EmptyState` and `Avatar` still index object literals** (`TONES[tone]`, `SIZES[size]`) where
  `Icon` deliberately switched to a `Map` after the Group 1 review made that point twice. Impact
  is low here — `cn` ignores a function, so a prototype key degrades to no classes rather than
  rendering `Object.prototype.constructor` — but it is the same shape, left in two of three places.
- **`Progress` turns a missing `value` into `0 %`** (`100 - (value ?? 0)`), i.e. an empty bar
  rather than Radix's indeterminate state or a loud failure. The screen supplies it (T20).
- **`toEqual` where the skill asks for `toStrictEqual`** at `icon.component.spec.tsx:108`.
- The declared deviations I was asked to judge are all **sound**: lean variants (§5's table and
  `design.md`'s file list enumerate exactly those; `Menu` → shadcn `DropdownMenu` is §5's own
  instruction), `shadow-brand` → `shadow-md shadow-primary/25` (no literal, so issue #13's fix
  reaches it through `@theme`), reading the compiled `bundle.js` as data while vendoring nothing
  (R30 intact, and it is why `album` is `layers` and `help` is `circle-question-mark` rather than
  a plausible guess). The #13 interim was honoured — `design-tokens:validate` scans all 41 files
  and reports no hardcoded value, and every non-semantic colour reaches the primitive scale
  through `var()`.

### Spec-side problems — reported, not mine to fix, not rejected on

- **R35 contradicts the corrected `ui-handoff.md` §5, in this very diff.** §5 now says (correctly,
  measured against the design system's own `iconMap`) that `check` and `success` are **two
  different glyphs — two separate entries, no alias**. R35 still mandates "one canonical entry with
  the other as an alias". The implementation honours **R35**, so `success` is canonical and a
  future `check` call site will render a circle-check it did not ask for. Part 1 uses only
  `success`, so nothing visible changes today. Already routed to the Spec Author by the
  Orchestrator — recorded here, not raised again as a discovery, and explicitly **not** a reason
  to reject the group.
- Nothing else: `tasks.md` and `requirements.md` parsed cleanly — no unknown risk class (no group
  carries a tag, which the preamble states as a claim), no dangling `(R<n>)` ref, no duplicate
  group number or task id, no empty group, and every task in Groups 1–4 is ticked.

## Review evidence — step 3 (re-review, iteration 2)

Fresh Reviewer, fresh context. Both rejected points re-verified **by measurement against the real
modules and the real browser**, never from the record. The trap I was warned about is real:
`scratchpad/probe-cva.mjs` reimplements the button's `cva` config inline (its `link` variant still
carries `h-auto px-0` and its `sm` size still carries the unscoped extender), so it prints the
pre-fix geometry and reads as a regression. I did not use it. Every number below comes from
`buttonVariants` imported from `apps/web/src/common/components/ui/button.tsx`, or from real Chrome
over the production build.

### The seven declared gates, re-run by me with the turbo cache bypassed

`TURBO_FORCE=true` on all three turbo-driven gates, so nothing was replayed from cache.

| Gate | Result |
| --- | --- |
| `typecheck` | green — 3 packages, `cache bypass, force executing` on each |
| `format:check` | green — "All matched files use Prettier code style!" |
| `test` | green — 188 tests, 11 files (web: 170 in 6 files) |
| `build` | green — `✓ built in 96ms`, nitro output generated |
| `design-tokens:validate` | green — 147 tokens, 43 files scanned, no hardcoded values, only the generated file excluded |
| `design-tokens:contrast` | green — `56 pair(s) meet their WCAG floor` |
| `design-tokens:css:check` | green — projection up to date |

`build`'s only stderr is the pre-existing third-party `MODULE_LEVEL_DIRECTIVE` warning for
`@tanstack/react-router`'s `"use client"` files — not this change's, and not new.

### Real run — production build, explicit free port, dev markers checked first

Measurement hygiene honoured: a free port chosen by binding `:0`, never 3000, and the served bytes
grepped before trusting anything — `{"viteClient":false,"reactRefresh":false,"devAttr":false}` on
25 249 bytes. A temporary probe route replaced `routes/index.tsx` under an `EXIT` trap and was
restored; `git status` after each trip is byte-for-byte what it was before, with no `.bak` left.

### Rejection 1 — `Button variant="link"` — FIXED, both halves, and the second half holds

Real module through `cn`, exactly as the component composes it:

```
link      / default  -> inline-flex h-auto px-0
link      / lg       -> inline-flex h-auto px-0
link      / sm       -> inline-flex h-auto px-0          (no `after:` — extender absent)
default   / default  -> inline-flex h-[var(--primitive-dimension-layout-touch-target)] px-4
secondary / sm       -> inline-flex h-8 px-3 after:… after:h-[…touch-target] …   (extender present)
```

Rendered, in Chrome, with the `link` **inside running copy** as the artboards place it:

| Probe | height | display | padding | `::after` |
| --- | --- | --- | --- | --- |
| `link` inline in a `<p>` | **20 px** | `inline-flex` | `0px` | `content: none` |
| `secondary`/`sm` inline in a `<p>` | 32 px | `inline-flex` | `0px 12px` | `content: ""`, `height: 44px` |

**The second claim — the one nobody had independently checked — is true.** Hit test by
`elementFromPoint` at ±3, ±8, ±14 and ±22 px around the inline link's box: every point outside its
own 20 px box lands on the paragraph or on the neighbouring text span, never on the link. The same
probe on the inline `sm` button captures at ±3 px (its 44 px extender, ~6 px each way) and releases
by ±8 px — so the link assertion is **not vacuous**: the extender demonstrably still works where it
is wanted. `after:inset-x-0` pins the extender horizontally, so two `sm` buttons in a row cannot
overlap, and the measurement confirms no horizontal growth.

### Rejection 2 — the menu's focus ring — FIXED, under real key events

Driven by CDP `Input.dispatchKeyEvent`, not a programmatic `.focus()` (which is what broke the
first attempt): Tab → trigger, Enter, ArrowDown, ArrowDown, Escape.

- Trigger before: `aria-haspopup="menu"`, `aria-expanded="false"` → after Enter `"true"`, 3
  `role="menuitemradio"` items in the DOM.
- First arrow lands on «Oscuro»: `role=menuitemradio`, `aria-checked="false"`,
  `data-highlighted` present, **`:focus-visible` matches**, `outline: solid 2px`, `outline-offset:
  2px`, `outline-color: rgb(108, 99, 255)`, height 44 px. Second arrow lands on «Sistema» with the
  same ring.
- Escape: `aria-expanded="false"`, items gone, **focus returned to the trigger**.

So `focus-visible:` **is** the right hook under Radix's programmatic roving focus, and the decision
to add no `focus:` / `data-highlighted:` fallback is correct — verified, not assumed.

### R38 across the whole surface — every tab stop, real Tab presses

17 stops, all `solid 2px` at `2px` offset in `rgb(108, 99, 255)`, all with `:focus-visible`
matching: the three theme buttons, the inline `link`, the inline `sm`, `default`/`lg`/`sm`/`icon`/
`link`/`loading` Buttons, `asChild` (renders `<a>`), `Input` default and `aria-invalid`,
`FutureLink`, `ToggleGroupItem` (single roving stop, 44 px), the menu trigger. Plus the three menu
items above. Nothing in Groups 3–4 is interactive and unringed.

### The 44 px floor

`Button default` 44 · `lg` 48 · `icon` 44×44 · `loading` 44 · `asChild` 44 · `ToggleGroupItem` 44 ·
menu trigger 44 · menu item 44 · `Input` 48 · `Avatar sm/xl` 32/80. `Button sm` is 32 px with a
measured 44 px extender. Inline text links are 20–24 px by design. (R89 is not in this step's
slice; recording the numbers because they were asked for.)

### T46 — falsified on both paths, with a control that proves the probe is sensitive

Sampled `document.getAnimations()` (document-wide, so it sees every transition anywhere on the
page) across 8 frames straddling the swap, plus the marker's presence:

| | marker frames | CSS transitions created |
| --- | --- | --- |
| Control path (click «Oscuro») — **as shipped** | frames 0–1, gone at 2 | **none, any frame** |
| OS path (`prefers-color-scheme` light→dark, theme «Sistema») — **as shipped** | present, gone 2 frames later | **none, any frame** |
| Control path with `!important` removed from the rule | same | **27 transitions**, sustained 8+ frames |
| OS path with `!important` removed | same | **27 transitions**, sustained 8+ frames |

The mutant's 27 are `color` ×15, `background-color` ×4 and all four `border-*-color` ×2 — exactly
§8's "half-finished repaint". That control matters twice over: it proves my zero is a real
suppression and not a no-op swap (the colours genuinely change), and it proves the `!important` is
load-bearing. On the OS path `data-theme` stayed `system` throughout, which is the §8(b) correction
holding: no attribute is written there, so the suppression had to hang off the `matchMedia`
listener, and it does.

**The inverse holds too.** After a swap, a real `Input.dispatchMouseEvent` hover over the button
produces a `background-color` CSSTransition interpolating `rgb(74,66,201)` → `rgb(71,63,195)` →
settled `rgb(70,62,193)`. The marker does not outlive the swap, and hover is not silently dead.

Declared transitions, measured: `Button` and `ToggleGroupItem`
`color, background-color, box-shadow`; `Input` `border-color, box-shadow`; `FutureLink` and the menu
item `color, background-color` — all `0.15s`, all `cubic-bezier(0.16, 1, 0.3, 1)`, all behind
`motion-safe:`. `Progress` and `Card` declare no transition. `transition-all`: absent from
`apps/web/src` (R104) and pinned by a test.

### Mutation probes — 6 chosen, 6 killed (basis: no declared risk, so none owed; all by judgment)

| Mutant | Outcome |
| --- | --- |
| `theme-provider`: double rAF → single | **killed** — 2 tests red (the control path **and** the OS path, so the OS test really is tightened) |
| `styles.css`: drop `!important` from the suppression rule | **killed** — 1 test red, and the browser control above shows 27 transitions escaping |
| `button.tsx`: empty the `link` compound (`h-auto px-0` gone) | **killed** — 3 tests red |
| `button.tsx`: unscope the hit-area extender so it reaches `link` again | **killed** — 1 test red |
| `dropdown-menu.tsx`: put `outline-none` back on the item | **killed** — focus-ring guard red, naming `ui/dropdown-menu.tsx` |
| `icon.component.tsx`: `Map` → object-literal indexing | **killed** — 5 prototype-key tests red |

Every revert was an `EXIT`-trapped composite trip; the tree is clean. No survivors, so nothing to
route as an advisory or a side-finding. The project still has no `test:mutation` script — declaring
one in `package.json` would buy the cheap batch path on the next review instead of this hand work.

### The new guard — it does constrain the shape, within a scope worth knowing

`focus-ring.spec.ts` is not just asserting the current text: the mutant proved it catches a
reintroduced `outline-none` in a nested `ui/` file, and the comment-stripping is honest (it removes
`/* … */` blocks and `//`/`*` line starts, and deliberately does not cut at a mid-line `//` so a URL
in a string cannot swallow code). Two limits, neither blocking:

- **Scope**: `src/common/components` only. Groups 7–12 build nav items and screens under
  `src/pods/`, which this guard will not see.
- **Shape**: it matches the literal `outline-none`. `outline-hidden`, `outline-0`,
  `outline-transparent` or `[--tw-outline-style:none]` would kill the ring the same way and pass.
  Neither appears today.
- It excludes `.spec.ts` but not `.spec.tsx`, so a future `.spec.tsx` discussing the literal in code
  would trip it. (That is how a literal in a comment tripped it three times this step.)

### `Icon` — both halves of the split, from the two harnesses that can see them

- **Production**: in the real production build, clicking the probe that renders
  `<Icon name="no-existe-este-icono" />` produced **zero** `error`/`unhandledrejection` events, an
  **empty** container, and the page still alive. Silent in production, as D15 asks.
- **Development**: `import.meta.env.DEV` is true under Vitest, and the spec drives the throw and
  asserts the name is in the message; the `Map` mutant above shows those assertions are load-bearing.
- R33's set: 14 design-system names + 19 handoff names + `success` = 34 entries, written out by hand
  in the spec rather than derived from the map, so the count is not tautological.

### `Skeleton`'s pulse, judged against the **amended** §8

Rendered `animation-name: pulse`, inside `motion-safe:`, `aria-hidden="true"`. §8 item 2 is now a
category — "loading affordances … explicitly **outside** the 150/250/350 ms budget … neither
responds to a gesture" — which admits Tailwind's ~2 s cycle and its own curve on its own terms. The
previous review's finding is **closed**: the pulse is in the list, and the `Skeleton` doc comment no
longer claims it "inherits §8's budget already resolved" — it now says the opposite, correctly. And
`Skeleton` is still invented into nothing: `grep -rn 'Skeleton' apps/web/src` returns only its own
definition (R37), which this part trivially satisfies since it ships no screen at all.

### Spec compliance — the 15-requirement slice, 15 PASS

The slice is the union of what Groups 3–4's nine tasks reference: R29, R30, R31, R32, R33, R34,
R35, R36, R37, R38, R71, R74, R94, R103, R104. R28 and R89 are **not** in it, as step 3's first
review established. Every task in both groups is ticked.

| Req | Status | Evidence |
| --- | --- | --- |
| R29 | ✅ PASS | `cn` from `cn`, primitives from the single `radix-ui`; `grep` for `@/lib/utils` and `@radix-ui/` returns nothing |
| R30 | ✅ PASS | no `bundle.js` anywhere in the repo |
| R31 | ✅ PASS | every §5 variant/state exists **and** `link` now renders as inline text (20 px, `inline-flex`, padding 0) — the previous PARTIAL is cleared |
| R32 | ✅ PASS | `EmptyState` (`icon`, three tones, mandatory `title`, `size`); `Icon`, `Skeleton`. `BottomNav`/`SideNav` are Group 7's |
| R33 | ✅ PASS | 34 entries, each rendering a glyph; glyph choices read from the design system's own `iconMap`, not guessed |
| R34 | ✅ PASS | loud in dev (spec + mutant), silent in prod (measured in the real build) |
| R35 | ✅ PASS *to the letter* | one canonical entry (`success`) with `check` aliased to the same `CircleCheck`. **The premise is false — see spec-side** |
| R36 | ✅ PASS | usage rule recorded in `icon.component.tsx`'s doc comment, and `EmptyState`'s mandatory `title` enforces it by construction |
| R37 | ✅ PASS | built; used by nothing |
| R38 | ✅ PASS | 2 px at 2 px offset on all 17 tab stops **and** on the menu items — the previous failure is cleared |
| R71 | ✅ PASS | `FutureLink` is a real `<a href>` behind one grep target; no `href="#"` in the tree |
| R74 | ✅ PASS *for the half T9 owes* | `home-page.tsx` and its spec gone, nothing imports them. R74's redirect half is T26's (Group 8) by the spec's own task split, and `/` renders `null` until then by instruction |
| R94 | ✅ PASS *against the amended §8* | every transition on the one curve at 150 ms inside `motion-safe:`; menu open/close at 150 ms; spinner and pulse admitted by amended item 2. **R94's own letter is now stale — see spec-side** |
| R103 | ✅ PASS | measured on both paths with a control proving the probe sensitive; `styles.css` ↔ provider constant bound by a test; mutant killed |
| R104 | ✅ PASS | no `transition-all`; every transition names its properties explicitly, confirmed in the computed styles |

No unspecified additions: nothing in the diff behaves beyond what the slice asks for, and the
deliberate `null` at `/` is named in the file with its reason.

### Quality pass — nothing blocking; four notes

1. **`toEqual([])` where the skill asks `toStrictEqual`** — `theme-provider.component.spec.tsx`, the
   new R104 grep test. The step fixed the previous instance in `icon.component.spec.tsx` and
   introduced this one. Cosmetic for a string array.
2. **`Button variant="link" size="icon"`** emits both `size-[…touch-target]` and `h-auto`, which
   contradict each other; which wins depends on stylesheet order, not class order. Not a
   combination any artboard uses, and the code says so. Left as a note for whoever first wants it.
3. **The focus-ring guard's scope and shape**, above.
4. `Icon` throwing during render unmounts the subtree in dev. That is what "fail loudly" means here
   and D15 asked for it; noting it so nobody later reads it as an accident.

Integration seams: the two halves of the suppression live in different files with no compiler
between them, and a test binds the attribute name across both — the right test for the seam. The
`cva` → `cn` composition is the other seam this step broke and it now has a pure-function spec with
a negative case, which is the right shape under R99 (no screen markup asserted).

TypeScript/async: no floating promises, no `any`, no non-null assertions, no unawaited work in a
`try`. The three guarded fallbacks (`matchMedia` absent, `requestAnimationFrame` absent,
`data-theme` out of vocabulary) each carry a comment stating the intent and each fails toward the
documented default rather than toward silence.

Security and silent-failure passes, run beyond the per-step floor (the group declares no
`[risk: …]`): nothing. No user input, no network, no subprocess, no secret, no destructive write, no
file-mode change, no LLM. No `catch` anywhere in the diff; no swallowed error; the one `??` chain
and the two optional calls are the documented R24 fallbacks. Both rejected defects were
silent-failure *shapes* — dead utilities that read as compliance, and an invisible hit area — and
both now have a test that goes red when the shape returns.

### Not re-raised

R35's false premise (routed to the Spec Author; reported below, not a reject), the token file's
missing shadow / `letter-spacing` families (issue #13, deferred, Tailwind built-ins as the standing
interim — and `design-tokens:validate` is green over all 43 files), the four declined step-2
advisories, `Progress` mapping a missing `value` to 0 %, the ten primitives shipping without specs
(what `design.md`'s file list asks for, and a question for the human), the absent semantic
hover/accent families and the missing `pill` dark override. Group 1's token files, generator and
gate config are untouched by this diff.

### Spec-side problems — reported, not mine to fix, not rejected on

1. **R103's letter is now stale.** It still says the marker is "dropped on the **next frame**".
   `ui-handoff.md` §8 item 5, corrected **in this very diff** and measured, says a single
   `requestAnimationFrame` "provably suppresses **nothing**" and that it takes **two** frames. The
   implementation uses two and is right to; it satisfies §8 and R103's substance while deviating
   from R103's words. `requirements.md` was not updated alongside §8. For the Spec Author.
2. **R94's letter is now stale, in the same way.** R94 binds *all five* of §8's items to
   "the single `cubic-bezier(0.16, 1, 0.3, 1)` curve and one of 150 / 250 / 350 ms", and enumerates
   item 2 as "the `Button` loading affordance". Amended §8 item 2 is now a *category* — spinner plus
   `Skeleton` pulse — explicitly **outside** that budget. So a correct implementation of amended §8
   cannot satisfy R94 to the letter: Tailwind's `animate-spin` is 1 s linear and `animate-pulse`
   ~2 s on its own curve. The Orchestrator closed the §8 gap; the R94 gap behind it is still open.
   This is the one spec-side problem not already on the settled list. For the Spec Author.
3. **R35 contradicts the corrected §5**, as the previous review recorded: §5 now says `check` and
   `success` are two different glyphs needing two entries and no alias; R35 still mandates one entry
   plus an alias. The implementation honours R35, so a future `check` call site renders a
   circle-check. Already routed — recorded, not raised again.

Nothing else: `tasks.md` and `requirements.md` parsed cleanly — no unknown risk class (no group
carries a tag, which the preamble states as a deliberate claim), no dangling `(R<n>)` ref, no
duplicated group number or task id, no task above the first header, no empty group, and every task
in Groups 1–4 is ticked. The tick flips in this diff are the Implementer's done-markers, not a spec
change. The `ui-handoff.md` edits in the diff are contract amendments the Orchestrator owns (§8
item 2 is recorded in `progress.md` as "una enmienda del contrato, del coordinador") plus the
measured §5 and §8 item 5 corrections — not the Implementer rewriting the contract to fit its
output.

### Ledger — one checkpoint, two files

`lemony review-ledger validate` maps **step N to group N**, so a checkpoint that covers two groups
needs two sidecars. Both are written and both validate green against the anchor
`38d3a540dd230bac93620efd7a7718b02e10cef7`:

- `review-ledger/step-3.json` — Group 3's slice, `criteria 8/8`, `gates 7/7`, `passes 2/2`
- `review-ledger/step-4.json` — Group 4's slice, `criteria 7/7`, `gates 7/7`, `passes 2/2`

8 + 7 = the 15 requirements step 3's first review established as the slice. The gates, the real run
and the four passes are the same single review in both files, recorded against each group's half.


**Cadence after the spec round:** 14 groups, still **8 steps**. Group 14 (T47, the icon-map fix)
sits last in the file because group numbers are what the review ledgers key on and inserting it
before Group 13 would have renumbered 13 — but it runs **merged into step 8 with Group 13**, and
T47 lands before T45's final gate run so the gates close over the finished tree.

## Review evidence — step 4

Groups 5 and 6 (T17–T21), anchor `67930ad`, auto-commit **off** — reviewed as the staged,
uncommitted change against the anchor. Fresh context. Verdict: **APPROVE** with four advisories,
none blocking. Ledgers: `review-ledger/step-5.json` and `step-6.json`, both
`lemony review-ledger validate` green (criteria 6/6 and 1/1, gates 7/7, passes 2/2), no spec-side
problems reported. Worktree and index left exactly as found: `git status` identical before and
after, no `.bak` stranded, the diff still the same 28 paths.

### The seven declared gates, re-run by me with the turbo cache bypassed

`TURBO_FORCE=true` on the four turbo gates, so nothing was read from cache.

| Gate | Result |
| --- | --- |
| `typecheck` | ✅ 3 packages, `cache bypass, force executing` on each |
| `format:check` | ✅ `All matched files use Prettier code style!` |
| `test` | ✅ 186 tests / 10 files in `@memora/web` (+11 db, +7 runner); the four new specs: date 4, storage 8, circles 2, assets 2 |
| `build` | ✅ `built in 87ms`; only stderr is the pre-existing third-party `MODULE_LEVEL_DIRECTIVE` warning |
| `design-tokens:validate` | ✅ 147 tokens, 54 files, no hardcoded values |
| `design-tokens:contrast` | ✅ 56 pairs meet their WCAG floor |
| `design-tokens:css:check` | ✅ projection up to date |

Coverage N/A — no `@vitest/coverage-*` provider in the repo, as the Implementer reported.

### Real run — production build, explicit free port, dev markers checked first

Port **49877**, obtained by binding `:0`, never 3000. Before measuring anything, the served `/`
was grepped for `@vite/client`, `/@react-refresh` and `__vite_ping` → **0 matches** in 2 527
bytes. Confirmed it was the build.

**R95 proven end to end, not from disk.** `existsSync` only proves a file is on disk; I fetched
all **17** asset URLs over real HTTP against the nitro server:

- every one **200**, `content-type` `image/jpeg` (16) and `image/svg+xml` (1);
- the **sha256 of each served body byte-identical** to the committed file;
- control `/mock/does-not-exist.jpg` → **404**, so the 200s are per-file and not a catch-all;
- `.output/public/mock/` and `.output/public/brand/` confirmed to carry all 17 after `build`.

**The real modules, through a harness that imports the source** (no reimplemented copy of any
config — the scratchpad was empty this session and the harness is mine):

```
invitationMock.expires_at            → «24 de octubre»
storageMock → «3,1 GB de 5 GB usados · plan Gratis»   percent 62
'email' in inviterMock               → false
circle field names                   → cover_url,name   (4 names, 4 distinct)
```

The `·` separator is **U+00B7**, byte-identical (`c2 b7`, space either side) between
`ui-handoff.md` §10 and `storage.formatter.ts:36`. Verified by hexdump, not by eye.

**Timezone claim verified in six zones** — the Implementer's *corrected* claim holds:

```
Europe/Madrid · UTC · Pacific/Midway (−11) · America/Los_Angeles  → 24 de octubre
Pacific/Auckland (+13) · Pacific/Kiritimati (+14)                 → 25 de octubre
```

**The two undefended inputs, measured** so the record says what they actually do:
`formatStorageUsage(1e9, 0, …)` → `percent: **Infinity**` (a `number`, so `typecheck` is silent —
not `NaN`), and 9/5 GB → `percent: 180`, unclamped. Both exactly as the source comment declares,
and both unreachable from `storageMock`.

### Mutation probes — 6 chosen, 5 killed, **1 survivor**

`basis: no-declared-risk` (neither group carries a `[risk: …]` tag), so none was owed by the
ledger floor; all six are by judgment. Each one composite trip with the revert trapped **before**
the edit.

| Mutation | Result |
| --- | --- |
| `storage.formatter.ts:37` `Math.round` → `Math.floor` | **8 tests green — SURVIVOR** |
| `storage.formatter.ts:37` `Math.round` → `Math.ceil` (control) | 1 red — killed, so the probe is sensitive |
| `storage.formatter.ts:9` `maximumFractionDigits: 1` → `2` | 1 red — killed by the 3,14 GB test the Implementer added |
| `date.formatter.ts:28` `month: 'long'` → `'short'` | 3 red — killed |
| `circles.mock.ts:21` add `member_count: 7` | 1 red — R48's guard bites |
| `circles.mock.ts:22` `cover_url` → `https://images.example.com/…` | 2 red — R95's guard bites both ways |

The Implementer's own survivor (`maximumFractionDigits`) is **confirmed closed** — I re-probed it
and it now dies on the test added for it. The project can buy the cheaper batch path: declaring a
`test:mutation` script in `package.json` would activate the scripted path on the next review
instead of this hand work.

### Advisory 1 — the survivor: a test whose name overstates what it asserts

`storage.formatter.spec.ts:44` is named «rounds the percentage to a whole number», but its only
case is 1/3 GB → 33.33, where `round` and `floor` agree. So `Math.round` → `Math.floor` on
`storage.formatter.ts:37` leaves **all 8 tests green**. The `ceil` control turns that same test
red, so the survival is real and not a tooling artefact.

**Closes with one case whose fraction is ≥ 0,5** — 2 GB of 3 GB is 66,67 → `67` under `round`,
`66` under `floor`. Not blocking: the value feeds a decorative `Progress` bar in Group 12 and is
wrong by at most one percentage point. This is the second survivor the coordinator asked me to
look for; it exists, and it is of the same family as the first (a test suite whose inputs are all
too well-behaved to pin the arithmetic).

### Advisory 2 — the dataset↔formatter seam is crossed by nothing automated

The §10 literals are pinned **twice, independently**:

- `storage.formatter.spec.ts:10` asserts «3,1 GB …» from the literal `3.1 * GB`;
- `date.formatter.spec.ts:13` asserts «24 de octubre» from the literal `'2026-10-24T12:00:00.000Z'`.

Neither reads `storageMock` or `invitationMock`. So editing `storageMock.used_bytes` to
`3_200_000_000` leaves the **whole suite green** while every screen that renders it silently
contradicts a design that says «3,1 GB». The chain holds today — I measured it by hand, and the
Implementer did too with `tsx` — but *nothing holds it*. This is exactly the step's declared
failure mode (a contract that quietly disagrees with the design), which is why it is recorded
rather than left in context.

**Scheduled rather than missing:** R97 mandates mapper tests in Groups 11 and 12, and those
mappers read the fixtures and call the formatters, so the seam gets crossed there. The cheap
version here is one assertion per formatter spec that starts from the fixture.

### Advisory 3 — the date suite's greenness depends on an undeclared environment fact

`date.formatter.spec.ts:6` asserts noon UTC «cubre toda zona horaria en la que este suite se
ejecuta de verdad». Measured under `TZ=Pacific/Kiritimati`: **3 of the 4 date tests fail**
(`2 de marzo` for `1 de marzo`; the twelve-month array shifts a day). CI is UTC and the team is in
Spain, so it is green everywhere this project actually runs, and the *behaviour* under test —
formatting in the viewer's own calendar — is deliberately and correctly left alone. One line
(`TZ` pinned for the file) closes it if the human wants it closed.

### Advisory 4 — 11 of the 17 committed assets are tied to nothing mechanical

`mock-data-assets.spec.ts` guards the **6** paths the dataset names (2 avatars + 4 covers). The
ten `photo-NN.jpg` and the wordmark are referenced by nothing in the repo until Groups 7, 9 and 10
consume them, so a file silently dropped — or an eleventh photo quietly added — passes every gate.
Correct for this step, but it makes the **asset map in this file load-bearing for three later
groups**, and this file is archived at closeout. Worth knowing that the map is the only audit
trail for those eleven files.

### The declared deviations — judged, and all four accepted

1. **No `id` on the circles** — accepted, and not merely tolerated. R48 says «nombre e imagen de
   portada **y nada más**», and an `id` is precisely the field Part 2 would build `/circles/$id`
   from, so adding one would *be* the drift R48 forbids. Indexing by `name` is safe: 4 names, 4
   distinct, verified. No fixture carries a synthetic id.
2. **No `email` on the inviter** (`Omit<UserApiShape, 'email'>`) — accepted. No artboard shows it,
   and a backend would not hand the inviter's address to the invitee. `'email' in inviterMock` →
   `false`, measured.
3. **The two specs beyond `design.md`'s file list** — **declined neither.** Each makes a
   *requirement* mechanical rather than asserting the shape of a datum, and I probed both red:
   `circles.mock.spec.ts` dies on a leaked `member_count`, `mock-data-assets.spec.ts` dies on both
   a remote URL and a missing file. They are the right two specs to have written.
4. **The documented omissions** (GB only, no `limitBytes === 0` guard, no 100 % clamp) — accepted
   as declared, with the measured values now on the record (`Infinity`, and 180 unclamped) so a
   later reader does not have to re-derive them.

### `form-demo-values.mock.ts` in camelCase — endorsed explicitly

R39 says the mock data shall be in **API-response shape**, and this one file is camelCase. It is
nonetheless right: no backend returns «what the person typed», R49 is the governing requirement
for that file and it says the values shall come from the shared dataset, and the reasoning is
written in-source so it cannot later read as an inconsistency with its five `snake_case`
neighbours. Recorded because it is the one place a reader could mistake a deliberate choice for a
slip.

### §10 copy — checked character for character

| Contract | Fixture / formatter | Match |
| --- | --- | --- |
| «3,1 GB de 5 GB usados · plan Gratis» | `storageMock` → `formatStorageUsage` | ✅ incl. U+00B7 by hexdump |
| «La invitación caduca el 24 de octubre» | `invitationMock.expires_at` → `formatLongDate` | ✅ |
| «Entrarás como sofia.martin@correo.es» | `viewerMock.email` | ✅ |
| `Register-M` uses `recuerdos206` | `registerErrorDemoValues.mobile.passwordRepeat` | ✅ verbatim |
| `Register-D` uses `sofia@memora.app` / `recuerdos` | `registerErrorDemoValues.desktop` | ✅ verbatim |

The two register sets are **internally coherent with the copy**, which is the part a literal
comparison misses: mobile's `recuerdos2026` satisfies «Al menos 8 caracteres» and only the repeat
differs → one invalid field, no `Alert`, as §6 draws it; desktop's `recuerdos` is 9 characters
**with no digit**, violating the stricter form-level «al menos 8 caracteres **y un número**», and
its email is the already-registered one → exactly the **two** invalid fields «Revisa 2 campos»
counts. The per-breakpoint split exists only where the contract splits it (one set for `/login`
per §6, one for `/profile` since `Profile-D` is its only error artboard).

**R49/R69 — no leak into markup:** grep for `recuerdos2026`, `recuerdos206`, `sofia@memora.app`,
`sofia.martin@correo` and «Sofía Martín Ortega» across `apps/web/src` returns **nothing** outside
the fixture and `users.mock.ts`. The fixture is the only copy.

### The asset derivation — what I could and could not measure

**Stated plainly, because it bounds my verdict:** the `pencil` MCP server **failed to connect**
this session and the workspace holds no `.qm` wireframe, so I **could not re-derive the 17 canvas
ids from the artboards myself**. R95's «only those the artboards reference» half rests on the
Implementer's map, not on my own reading of the canvas.

Everything checkable from the repo **corroborates it, with no slack**:

- **No two of the 17 files share a sha256** — nothing was downloaded twice under two names.
- **The cell arithmetic closes exactly:** 7 login-collage cells + 7 `Register-D` mosaic cells + 4
  covers + 2 avatars + 1 mark = **21 slots**; 21 − 17 = **4**, which is precisely the four
  overlaps the map names (`familia-garcia` and `lisboa-2026` cover↔collage, `amigas-de-la-uni`
  cover↔mosaic, `photo-02` collage↔mosaic). An independent arithmetic check of a hand-made list,
  and it balances.
- **That also settles the coordinator's cross-check:** of `Register-D`'s seven, **five** are
  exclusively its own. The Implementer's correction is right and the original list was wrong.
- Every file is a real progressive JPEG at 900 px wide (the two avatars 160×160) or a real SVG;
  **nothing stray** sits under `public/`; total **1 880 200 bytes / 17 files**, re-measured to the
  byte and matching the report.

### Weight — reported, not a defect

Re-measured: **1 880 200 bytes (1,79 MiB), 17 files.** Per the coordinator's instruction this is
**not** treated as a defect, and the Implementer was right to resize nothing — the call is the
human's, it is cheapest now (nothing is committed yet), and the coordinator's own finding that
`Photo-M` renders the «Familia García» cover **full-bleed** and Part 3 shows these photographs at
full width means Part 1's ≈358 px render sizes are not the binding constraint.

### Not re-raised

Issue **#13** (shadow, `letter-spacing`, `pill` dark override, semantic hover/accent families);
the four declined step-2 advisories; **R35**'s `check`/`success` fix, deferred to T47 in Group 14 —
the icon map is untouched by this diff, confirmed. Groups 1–4's token files, generator, gate
config, theme files and component library are all **untouched** by this diff (28 paths, all
additions under `public/`, `common/formatters/` and `common/mock-data/`).

### The brand-mark side-finding — already recorded, confirmed not mine to fix

I verified the measurement rather than restating it: `design-tokens:validate` reports **54 files
scanned** and `.svg` is outside the scan's extension set, so the mark's `#584fe5` / `#aaa2ff` /
`#ec4899` are genuinely invisible to the gate. It is the design's own asset, the design system
says never to recolour the mark, and it blocks nothing here.

### Spec-side problems

**None that the validator reports** — both ledgers green with no spec-side count. One cosmetic
imprecision, not worth a discovery and not routed: **R69 points at `ui-handoff.md` §10** for «the
per-breakpoint values», but §10 carries only *copy*; the values themselves (`recuerdos206`,
`sofia@memora.app`, `recuerdos`) are named in the handoff's «Decisions taken after the critique»
preamble — where the fixture matches them character for character. The requirement is satisfiable
and satisfied; only its cross-reference points one section away.

**Declined at step 4's checkpoint, by the human, knowingly:** the review's three test advisories.
(1) A second surviving mutant — `Math.round` → `Math.floor` in `storage.formatter.ts` leaves all 12
tests green because every input falls where the two agree; reproduced by the Orchestrator. Costs at
most one percentage point on a decorative `Progress` bar. (2) Nothing automated crosses the
dataset↔formatter seam: editing `storageMock.used_bytes` keeps the suite green while every screen
would contradict a design that says «3,1 GB». Temporary — R97's mapper tests in Groups 11 and 12
cross it. (3) The date suite's greenness rests on an undeclared environment fact: 3 of 4 tests fail
under `TZ=Pacific/Kiritimati`. CI runs UTC. Also declined: adding a `test:mutation` script, suggested
by four consecutive reviews — hand probes are finding real survivors, and the reviewer's repetition
is not by itself evidence.

**Asset weight settled, not deferred:** 1 880 200 bytes in 17 files stay at source size. Resizing to
Part 1's render sizes would degrade Parts 2 and 3 — measured, not assumed: `Photo-M` renders
`/_blob/abcac459…`, the same «Familia García» cover this part shows in a 264 px rail, full-bleed.
