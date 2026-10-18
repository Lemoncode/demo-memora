# Progress — #11 Base de diseño, shell y flujo de acceso del frontal de Memora

**Status**: spec-in-progress
**Branch**: `harness/11-base-shell-acceso`
**Part 1 of #10** (partition plan, chain 1 → 2 → 3)
**PRD**: `docs/prds/frontal-memora-2026-10-18.md`

## Active

Design definition closed. `ui-handoff.md` is at `Status: completed` (v2). The UI Designer
**rejected v1** — it described only mobile for four of six screens and got the desktop shell
navigation factually wrong — and v2 rewrites §4–§11 against all twelve artboards, each read
directly rather than inferred. Awaiting the human's call on whether to re-verify with the critic
before the Spec Author runs.

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

## Next action

1. Spec Author: reescribir D1 y el Grupo 1, bajar la accesibilidad a los grupos 9–12, rerun
   `spec-to-issue`.
2. Volver a presentar la portada del spec al humano.
3. Con su aprobación: flip a `harness:status:in-progress`, emitir `spec_approved`, y arrancar el
   bucle paso a paso por el Grupo 1 con auto-commit apagado.

## Blockers

None.
