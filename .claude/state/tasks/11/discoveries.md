# Discoveries — task 11

## D001 — T1 CONTRADICTION · raised 2026-10-19

- **paused_from:** in-progress

- **Subtask context:** Implementer, step 6 of 8 (Grupos 9 y 10, T29–T35). Encontrado al
  **verificar** el paso, no al construirlo: los dos pods están terminados y en verde, y
  `/login` y `/register` son las **primeras rutas de la parte que consumen el contrato
  `?estado=`** que el Grupo 8 dejó montado (T28). Hasta ahora ninguna ruta lo usaba, así
  que este comportamiento no era observable.

- **Plan says:** tres sitios lo dicen con las mismas palabras, y el brief de este paso lo
  declara zanjado («`?estado=` ya está implementado… un valor desconocido resuelve al
  estado por omisión **en silencio**»):
  - **R78** (`requirements.md:371-373`): «If `?estado=` carries a value the route's
    vocabulary does not hold, then the system shall render that route's **default** state
    without throwing and **without redirecting**.»
  - **D10** (`design.md:173-180`): «Taken the silent fallback… a guard-free app whose
    every screen opens by URL (R67) should not start failing on a query string.»
  - **design.md:418** (casos límite): «`?estado=` absent, **empty, misspelt or repeated**
    → the route's default state, no throw **and no redirect** (R78)».
  - **T28** (`tasks.md:204-211`) encarga `parseEstado` + el `validateSearch` de cada ruta,
    «a value outside the vocabulary yields the route's default state without throwing and
    without redirecting».

- **Reality:** no redirige el código de la aplicación — redirige **TanStack Router**, y lo
  hace porque `validateEstado` **cambia el valor** de la clave. Medido contra el build de
  producción servido en un puerto libre (cabeceras HTTP reales, `curl`):

  | URL | respuesta |
  | --- | --- |
  | `/login` | 200 |
  | `/login?estado=error` | 200 |
  | `/login?foo=bar` | **200** (una clave ajena sí se conserva) |
  | `/login?estado=error&foo=bar` | **200** |
  | `/login?estado=pepe` | **307 → `/login`** |
  | `/login?estado=` (vacío) | **307 → `/login`** |
  | `/login?estado=error&estado=enviando` (repetido) | **307 → `/login`** |
  | `/register?estado=pepe` | **307 → `/register`** |

  El mecanismo, leído en el módulo real (`router-core@1.171.38`,
  `router.js:789-791`): el router parte de `{ ...location.search }` y le aplica encima lo
  que devuelve `validateSearch`. Las claves ajenas sobreviven —por eso `?foo=bar` da 200—,
  pero `validateEstado` devuelve `{ estado: undefined }` para todo lo que no está en el
  vocabulario, la *search* canónica deja de coincidir con la de la URL y el router navega a
  la forma canónica. **La pantalla que acaba viéndose es la correcta** (el estado por
  omisión, sin excepción y sin pantalla de error): lo que incumple la letra de R78 es el
  salto y que la barra de direcciones cambie bajo los pies de quien tecleó la URL.

  No se puede arreglar conservando el estrechamiento: la comparación es contra la *search*
  **ya validada**, así que cualquier validador que cambie el valor cambia la URL. Lo
  comprobé.

- **Proposed:**
  - **(A) `validateSearch` deja pasar el valor crudo y el vocabulario se resuelve sólo en
    el pod.** `validateEstado` pasaría de `(vocabulario) => (search) => { estado?: T }` a
    `(search) => { estado?: unknown }`, y el estrechamiento lo haría `parseEstado` dentro
    del `business` de cada pod — que es **donde R76 dice que se resuelve** («resolved in
    that pod's repository») y donde ya está hoy: los `resolve*Scenario` de este paso ya
    aceptan `unknown` y están probados con arrays, números, `null` y `constructor`.
    *Cuesta:* toca `common/routing/estado.ts` y su spec (21 tests, Grupo 8, ya aprobado), y
    el tipo de `estado` a nivel de ruta deja de ser la unión estrecha — un
    `<Link to="/login" search={{ estado: 'errro' }}>` compilaría. Hoy no hay ni un enlace
    así en la aplicación.
  - **(B) Dejarlo como está y enmendar R78** para admitir la canonicalización: «un valor
    fuera del vocabulario se descarta y la ruta se vuelve a pedir en su forma canónica,
    mostrando el estado por omisión». *Cuesta:* una enmienda al requisito en tres sitios
    (R78, D10 y los casos límite de `design.md`); a cambio se queda el tipado estrecho por
    ruta y **cero cambios de código**. Defendible: un 307 a la URL limpia no es «fallar
    ante una query string», y el reviewer que teclee un estado mal escrito ve el estado por
    omisión igual.
  - **(C) Castear**: estrechar sólo en el tipo y devolver el valor crudo en tiempo de
    ejecución. **No lo propongo**: el tipo mentiría (`estado: 'error' | 'enviando'`
    conteniendo `'pepe'`), que es exactamente la clase de trampa latente que esta tarea ya
    ha rechazado dos veces.

- **Question:** ¿se cambia el código para que un `?estado=` desconocido **no** redirija
  —opción (A), tocando `estado.ts` y su spec del Grupo 8—, o se enmienda R78/D10 para
  aceptar el 307 a la URL canónica como el comportamiento querido —opción (B)?

**Resolution** (Orchestrator)

- **Decision:** option **B** — the canonicalising 307 is the wanted behaviour, and the
  requirement is amended to say so. No code change: the narrow per-route type stays, which is
  what catches a mistyped state at compile time across the four screens. Weighed against (A),
  whose cost is that `<Link to="/login" search={{ estado: 'errro' }}>` would compile; and the
  human's own reading that under (A) the address bar would keep `?estado=errro` while the
  screen shows the default state, whereas the 307 makes URL and screen agree.
- **Artifact updated:** `spec/requirements.md` (R78 + its acceptance criterion),
  `spec/design.md` (D10's headline, rationale, rejected alternatives and the edge-case list),
  `spec/tasks.md` (T28's restatement) — Spec Author. Sweep confirmed no copy of the old
  promise remains in the four spec files.
- **Resumed at:** 2026-10-19 — Implementer re-invoked from `paused_from: in-progress`
