import { Link } from '@tanstack/react-router';
import { cn } from 'cn';

import { FutureLink } from '#/common/components/future-link.component';
import { ImplicitSubmit } from '#/common/components/implicit-submit.component';
import { Alert, AlertDescription, AlertTitle } from '#/common/components/ui/alert';
import { Button } from '#/common/components/ui/button';
import { submitToFutureRoute } from '#/common/routing/future-route';

import { LoginCollage } from './components/login-collage.component';
import { LoginFields } from './components/login-fields.component';
import { LoginMosaic } from './components/login-mosaic.component';
import { LoginQuoteCard } from './components/login-quote-card.component';
import type { LoginScreen } from './login.model';

/** Copia literal de §10 (R93), con los sitios donde los dos anchos difieren. */
const TÍTULO = 'Hola de nuevo';
const ENTRADILLA = 'Entra para ver los recuerdos de tus círculos.';
const CTA = 'Entrar';
const CTA_ENVIANDO = 'Entrando…';
const PISTA_INTRO = 'para entrar desde cualquier campo';
const SIN_CUENTA = '¿Aún no tienes cuenta? ';
const CREA_UNA = 'Crea una';
const ALERTA_TÍTULO = 'No hemos podido iniciar sesión';
const ALERTA_CUERPO =
  'El email o la contraseña no coinciden. Revísalos e inténtalo otra vez.';

/**
 * El destino de «Entrar» **y** de `Intro`, en una sola constante.
 *
 * Las dos formas de salir de esta pantalla tienen que llevar al mismo sitio (R63), y son
 * dos mecanismos distintos: un `<a href>` y el `submit` del formulario. Escrito dos veces
 * podrían separarse sin que nada lo dijera.
 */
const DESTINO = '/circles';

/**
 * El CTA de la pantalla, en sus dos formas.
 *
 * **Enviando es un `<button>` de verdad y el resto del tiempo un enlace**, y la
 * diferencia no es cosmética. Fuera del envío, «Entrar» **navega a `/circles`** con el
 * formulario vacío (R63) y `/circles` es de la Parte 2, así que es un `FutureLink` como
 * todo enlace hacia delante de esta parte (R71, D9): no se comprueba ningún campo, no
 * hay sesión y no hay nada que enviar (R67, R68). En `enviando` no debe navegar a
 * ningún sitio, y además hace falta un control **deshabilitado** que anuncie su estado:
 * un `<a>` no se puede deshabilitar. `Button` con `loading` pone ya `aria-busy`, el
 * `disabled` y la rueda de §8 punto 2.
 *
 * El cambio de etiqueta a «Entrando…» lo pone la pantalla y no el componente, que es
 * lo que el primitivo dice de sí mismo.
 */
const BotónEntrar = ({ enviando }: { enviando: boolean }) =>
  enviando ? (
    <Button size="lg" loading className="w-full">
      {CTA_ENVIANDO}
    </Button>
  ) : (
    <Button asChild size="lg" className="w-full">
      <FutureLink href={DESTINO}>{CTA}</FutureLink>
    </Button>
  );

/**
 * «¿Aún no tienes cuenta? Crea una» — y `/register` **sí** existe desde el Grupo 10, así
 * que es un `Link` **tipado** y no un `FutureLink`: el compilador vigila el destino y la
 * navegación es del router, sin recarga de página.
 *
 * Las tres utilidades de `outline` van explícitas porque el `Link` de TanStack no las
 * trae — `FutureLink` sí —, y sin ellas este enlace sería el único punto de tabulación
 * de la pantalla sin anillo (R38).
 */
const ENLACE_EN_TEXTO =
  'font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const PieCrearCuenta = () => (
  <p className="text-center text-[0.9375rem] text-body-foreground">
    {SIN_CUENTA}
    <Link to="/register" className={ENLACE_EN_TEXTO}>
      {CREA_UNA}
    </Link>
  </p>
);

/**
 * `/login` — **la pantalla más difícil de la parte**, y la primera donde escritorio es
 * otra superficie en lugar de la misma más ancha.
 *
 * **Dos disposiciones explícitas** (R86, §7), no un árbol que refluye: en móvil la
 * **hoja es la superficie** y el formulario va directamente sobre ella; en escritorio
 * el formulario va **dentro de una tarjeta con filete** sobre la página. Eso no se
 * consigue reordenando: son dos árboles, y el que no aplica queda en `display: none`,
 * o sea fuera también del árbol de accesibilidad.
 *
 * **Las tres zonas de móvil no se aplanan** (§4): el collage, el **scrim** por encima y
 * la hoja opaca pegada al borde inferior con su radio de 32 px y la sombra más pesada
 * del sistema. El scrim **no es decoración** (R90), pero **lo que sostiene la
 * legibilidad de la pastilla es el cristal, no el scrim** — medido píxel a píxel y
 * corregido en §9: quitarlo mueve el peor píxel ±0,5 (en claro incluso mejora). El scrim
 * es profundidad y separación de zonas, que es para lo que R90 lo hace estructural; no
 * es el que rescata el contraste, así que nadie debería defenderlo con un número que no
 * es el suyo ni «optimizarlo» creyéndolo decorativo.
 *
 * **`Intro` desde cualquier campo navega**, y la línea de copia que lo promete (§10, R93)
 * dice la verdad: el formulario lleva `onSubmit` y un botón de envío oculto
 * (`ImplicitSubmit`, que explica por qué hace falta). Navegar **no es validar**: no se
 * mira ni un campo, y un formulario vacío más `Intro` lleva a `/circles` exactamente
 * igual que un formulario vacío más una pulsación en «Entrar» (R63, R67, R68).
 *
 * **Los estados los pide la URL, nunca una comprobación** (R68, R76): `error` dibuja el
 * `Alert` de formulario más los dos campos marcados, y `enviando` pone `aria-busy` en
 * el formulario, deshabilita los campos y cambia el CTA — **nunca un spinner sobre la
 * pantalla** (R83). Y no hay estado de carga (R81).
 *
 * **`key={screen.scenario}`, y no es decorativo.** Los campos son no controlados
 * (`defaultValue`), así que al ir de `/login` a `/login?estado=error` React reutilizaría
 * los mismos nodos y el `<input>` **se quedaría con el valor viejo**: la pantalla diría
 * «error» con los campos vacíos. Remontar el formulario cuando cambia el escenario es
 * lo que hace que recorrer estados tecleando la URL — que es para lo que existe
 * `?estado=` (D10) — muestre de verdad lo que pide.
 */
export const LoginPod = ({ screen }: { screen: LoginScreen }) => {
  const enviando = screen.scenario === 'enviando';
  const conError = screen.scenario === 'error';

  return (
    <main>
      {/* ——— Por debajo de `nav:` — `Login-M` / `Login-M-Error` ——— */}
      <div className="flex min-h-dvh flex-col bg-background nav:hidden">
        {/* El `overflow-hidden` es de esta caja y no del collage: es lo que recorta la
            rotación y lo que impide el *scroll* horizontal a 390 px (R89). Dentro no
            hay nada enfocable, así que no puede recortar ningún anillo (R38). */}
        <div className="relative h-[26.25rem] shrink-0 overflow-hidden">
          <LoginCollage />

          {/* **El scrim, que es estructura y no adorno** (R90, §9). Degradado de arriba
              abajo, del negro al 35 % hasta transparente al 30 % de la altura,
              exactamente como lo dibuja el artboard.

              **El 35 % va dentro del token y no en un modificador de opacidad, y eso
              está medido contra el compilador de verdad.** Poniendo la parada del
              degradado como una variable del fichero de tokens **más** el modificador de
              opacidad, Tailwind **se come el modificador en silencio**: emite la
              propiedad del degradado con la variable a secas, o sea un scrim **opaco**.
              Y la clase se genera igual, así que nada lo delata — es el mismo tipo de
              fallo mudo que el interlineado comido por tailwind-merge del paso 5, con
              otro traje. Se probaron las cuatro formas que había: la variable entre
              corchetes, la forma corta de variable, la variable anunciada como color
              (ahí la clase desaparece entera) y una mezcla de color dentro de un valor
              arbitrario (Tailwind la reescribe quitándole la mezcla). La única que sí
              aplica alfa es un color del **catálogo de Tailwind**, y eso lo convertiría
              en fuente paralela del contrato de tokens (R1).

              Así que el alfa se hornea en el token, que es **exactamente** lo que el
              fichero ya hace con `glass.background`: `component.login-scrim.from` lleva
              el negro al 35 % y aquí no hay modificador que perder.

              (Y por lo mismo este comentario no escribe ninguna de esas formas tal cual:
              el rastreador de Tailwind **lee los comentarios** y generaba las cuatro
              utilidades muertas en la hoja construida.) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-[var(--component-login-scrim-from)] to-transparent to-30%"
          />

          {/* La pastilla de cristal. No es un enlace: en `/login` no hay a dónde ir, y
              el artboard la dibuja como texto. `bg-glass` cambia solo en oscuro. */}
          <div className="absolute top-14 left-6 flex items-center gap-2 rounded-pill bg-glass py-1.5 pr-3.5 pl-1.5 font-heading text-lg font-extrabold tracking-tight text-foreground backdrop-blur-[var(--primitive-dimension-blur-glass)]">
            <img src="/brand/memora-mark.svg" alt="" className="size-[1.875rem]" />
            memora
          </div>
        </div>

        {/* La hoja opaca. El `-mt-6` la mete 24 px por encima del collage para que su
            radio de 32 px y su sombra se vean **sobre** las fotos: es lo que separa las
            dos zonas, y lo que §4 pide no aplanar. `flex-1` la lleva hasta el borde
            inferior cuando el contenido es corto y la deja crecer (y la pantalla
            desplazarse) cuando no (R87). */}
        <div
          className={cn(
            '-mt-6 flex flex-1 flex-col rounded-t-[var(--primitive-dimension-radius-3xl)] bg-card px-6 pt-7 shadow-xl',
            // 34 px es el hueco que el artboard reserva abajo; en un móvil con muesca
            // manda el inset de área segura, que es mayor.
            'pb-[max(2.125rem,env(safe-area-inset-bottom))]',
            conError ? 'gap-[1.125rem]' : 'gap-5',
          )}
        >
          {/* `Login-M-Error` **quita la entradilla** para hacer sitio al `Alert`: es
              una diferencia del artboard, no una omisión. */}
          {conError ? (
            <h1 className="font-heading text-[1.75rem]/[1.15] font-extrabold tracking-tight">
              {TÍTULO}
            </h1>
          ) : (
            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-[1.75rem]/[1.15] font-extrabold tracking-tight">
                {TÍTULO}
              </h1>
              <p className="text-[0.9375rem]/[1.5] text-body-foreground">{ENTRADILLA}</p>
            </div>
          )}

          {conError ? (
            <Alert>
              <AlertTitle>{ALERTA_TÍTULO}</AlertTitle>
              <AlertDescription>{ALERTA_CUERPO}</AlertDescription>
            </Alert>
          ) : null}

          {/* `onSubmit` + `ImplicitSubmit` es `Intro` desde cualquier campo. La línea de
              copia que lo promete sólo la pinta `Login-D`, pero el comportamiento va en
              **las dos** disposiciones: quien teclea en un móvil espera lo mismo, y una
              diferencia entre anchuras aquí sería arbitraria. Visualmente no cambia nada
              — el botón oculto no ocupa caja ni es punto de tabulación. */}
          <form
            key={screen.scenario}
            noValidate
            aria-busy={enviando || undefined}
            onSubmit={submitToFutureRoute(DESTINO, { disabled: enviando })}
            className="flex flex-col gap-4"
          >
            <LoginFields prefijo="login-m" screen={screen} />
            <ImplicitSubmit disabled={enviando} />
            <BotónEntrar enviando={enviando} />
          </form>

          <PieCrearCuenta />
        </div>
      </div>

      {/* ——— En y por encima de `nav:` — `Login-D` ——— */}
      <div className="hidden bg-background nav:flex nav:min-h-dvh nav:flex-wrap">
        <section
          aria-label="Recuerdos de ejemplo"
          className="relative min-h-[26.25rem] min-w-0 flex-[1_1_35rem] overflow-hidden p-6"
        >
          <LoginMosaic />
          <LoginQuoteCard />
        </section>

        <section className="flex min-w-0 flex-[1_1_30rem] items-center justify-center px-6 py-12">
          <div className="flex w-full max-w-[26.25rem] flex-col gap-7">
            {/* Tampoco es un enlace aquí: el artboard lo dibuja con `href="#"`, que es
                exactamente lo que R71 no admite, y en `/login` no hay destino honesto
                que ponerle. */}
            <p className="flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight text-foreground">
              <img src="/brand/memora-mark.svg" alt="" className="size-9" />
              memora
            </p>

            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-[2.25rem]/[1.1] font-extrabold tracking-tight">
                {TÍTULO}
              </h1>
              <p className="text-base/[1.55] text-body-foreground">{ENTRADILLA}</p>
            </div>

            <form
              key={screen.scenario}
              noValidate
              aria-busy={enviando || undefined}
              onSubmit={submitToFutureRoute(DESTINO, { disabled: enviando })}
              className="flex flex-col gap-[1.125rem] rounded-panel border border-border bg-card p-7 shadow-sm"
            >
              {conError ? (
                <Alert>
                  <AlertTitle>{ALERTA_TÍTULO}</AlertTitle>
                  <AlertDescription>{ALERTA_CUERPO}</AlertDescription>
                </Alert>
              ) : null}

              <LoginFields prefijo="login-d" screen={screen} />
              <ImplicitSubmit disabled={enviando} />
              <BotónEntrar enviando={enviando} />

              <p className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
                <span className="rounded-[var(--primitive-dimension-radius-xs)] border border-border px-1.5 py-0.5 font-mono text-xs">
                  Intro
                </span>
                {PISTA_INTRO}
              </p>
            </form>

            <PieCrearCuenta />
          </div>
        </section>
      </div>
    </main>
  );
};
