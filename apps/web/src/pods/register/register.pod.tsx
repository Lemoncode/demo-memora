import { Link } from '@tanstack/react-router';

import { FieldMessage } from '#/common/components/field-message.component';
import { FutureLink } from '#/common/components/future-link.component';
import { Icon } from '#/common/components/icon.component';
import { ImplicitSubmit } from '#/common/components/implicit-submit.component';
import { Alert, AlertDescription, AlertTitle } from '#/common/components/ui/alert';
import { Button } from '#/common/components/ui/button';
import { Input } from '#/common/components/ui/input';
import { Label } from '#/common/components/ui/label';
import { submitToFutureRoute } from '#/common/routing/future-route';

import { RegisterMosaic } from './components/register-mosaic.component';
import { RegisterQuoteCard } from './components/register-quote-card.component';
import type { RegisterField, RegisterScreen } from './register.model';

/**
 * Copia literal de §10 (R93). **Los dos anchos difieren más de lo que parece** y cada
 * diferencia está aquí a la vista:
 *
 * - el título es «Crear cuenta» en móvil y «**Crea tu cuenta**» en escritorio;
 * - la segunda etiqueta de contraseña es «Repite la contraseña» en móvil y
 *   «**Repítela**» en escritorio;
 * - la pista de móvil pide «al menos 8 caracteres» y el mensaje de escritorio pide «al
 *   menos 8 caracteres **y un número**» — **se contradicen**, y §10 lo señala como
 *   deliberado, así que no se unifican;
 * - la línea de términos nombra «la privacidad» en móvil y «la **política de
 *   privacidad**» en escritorio.
 */
const CTA = 'Crear cuenta';
const TÍTULO_MÓVIL = 'Crear cuenta';
const TÍTULO_ESCRITORIO = 'Crea tu cuenta';
const VOLVER = 'Volver a iniciar sesión';
const YA_TENGO_CUENTA = 'Ya tengo cuenta';
const YA_TIENES_UNA = '¿Ya tienes una? ';
const INICIA_SESIÓN = 'Inicia sesión';
const ETIQUETA_NOMBRE = 'Nombre';
const ETIQUETA_EMAIL = 'Email';
const ETIQUETA_CONTRASEÑA = 'Contraseña';
const ETIQUETA_REPITE_MÓVIL = 'Repite la contraseña';
const ETIQUETA_REPITE_ESCRITORIO = 'Repítela';
const PISTA_CONTRASEÑA = 'Al menos 8 caracteres';
const ERROR_REPETICIÓN = 'Las contraseñas no coinciden.';
const ERROR_EMAIL_EXISTE = 'Ya hay una cuenta con este email. ';
const ERROR_CONTRASEÑA_FORMULARIO =
  'La contraseña necesita al menos 8 caracteres y un número.';
const ALERTA_TÍTULO = 'Revisa 2 campos';
const ALERTA_CUERPO = 'Corrige los campos marcados para crear la cuenta.';
const TÉRMINOS_ANTES = 'Al crearla aceptas los ';
const TÉRMINOS_ENLACE_MÓVIL = 'términos y la privacidad';
const TÉRMINOS_ANTES_ESCRITORIO = 'Al crearla aceptas los términos y la ';
const TÉRMINOS_ENLACE_ESCRITORIO = 'política de privacidad';

/**
 * El vestido de un enlace dentro de texto corrido, **con su anillo de foco**.
 *
 * Se escribe aquí y no se importa de ningún sitio porque un pod no comparte con otro
 * (R46) y porque es la convención que el árbol ya sigue: `Button`, `Input` y
 * `FutureLink` repiten las mismas tres utilidades de `outline`. Lo que no se puede es
 * **omitirlas** en un `Link` tipado: `FutureLink` las lleva de serie, pero el `Link` de
 * TanStack no, así que un enlace a una ruta que ya existe se quedaría sin anillo y R38
 * no se cumpliría justo en los enlaces que sí funcionan.
 */
const ENLACE_EN_TEXTO =
  'font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/**
 * El destino de «Crear cuenta» **y** de `Intro`, en una sola constante, por lo mismo que
 * en `/login`: son dos mecanismos distintos hacia el mismo sitio (R64) y escritos dos
 * veces podrían separarse sin que nada lo dijera.
 */
const DESTINO = '/circles';

/**
 * El CTA. **«Crear cuenta» navega a `/circles`** (R64) y `/circles` es de la Parte 2,
 * así que es un `FutureLink` como todo enlace hacia delante (R71, D9): no se comprueba
 * ningún campo y no hay nada que registrar (R67, R68). `/register` no tiene estado de
 * envío en su vocabulario (R77), así que aquí no hay la segunda forma que sí tiene
 * `/login`.
 */
const BotónCrearCuenta = ({ className }: { className?: string }) => (
  <Button asChild size="lg" className={className}>
    <FutureLink href={DESTINO}>{CTA}</FutureLink>
  </Button>
);

/**
 * `/register` — **el segundo split screen de la parte, con su propio mosaico, su propia
 * tarjeta de cristal y su propia copia** (R96, §4). No es `/login` a otra anchura y no
 * es un formulario centrado: eso es lo que esta pantalla tiene que demostrar.
 *
 * **Dos disposiciones explícitas** (R86, §7): en móvil el suelo es una superficie
 * `card` entera con cabecera compacta, campos **alineados abajo** y el CTA en un pie
 * pegajoso; en escritorio no hay cabecera, no hay pie pegajoso, y el formulario va en
 * una tarjeta con filete al lado de un mosaico.
 *
 * **El estado `error` es deliberadamente distinto en cada ancho** (T35, §6): móvil
 * marca **un** campo y **no** lleva `Alert`; escritorio lleva el `Alert` «Revisa 2
 * campos», marca **dos** campos, pone un mensaje de contraseña a nivel de
 * **formulario** bajo la rejilla de dos campos, y uno de sus mensajes de campo lleva un
 * **enlace dentro**. Qué campos marca cada ancho lo decidió el mapper; aquí sólo se
 * dibuja.
 *
 * **El estado por omisión no lleva ningún error** (R80).
 *
 * **`Intro` desde cualquier campo navega, también aquí.** La copia de esta pantalla no lo
 * promete —la línea del teclado es sólo de `Login-D`—, pero el mecanismo es el mismo
 * (`onSubmit` + `ImplicitSubmit`) y aquí **no cuesta nada**: el botón oculto no ocupa
 * caja, así que no toca el pie pegajoso ni los campos alineados abajo, y el recorrido de
 * tabulación es idéntico con y sin él (medido). Tenerlo en `/login` y no aquí sería una
 * diferencia entre dos pantallas del mismo flujo que nada justifica. Y navegar **no es
 * validar**: no se mira ni un campo (R64, R67, R68).
 *
 * **Lo que no se construye, y por qué.** (1) El **teclado de pantalla** del final de
 * `Register-M` es un recurso de diseño: muestra la disposición con el teclado abierto,
 * y su intención se cumple con los campos alineados abajo y un pie que sobrevive a un
 * viewport encogido (R88). (2) El primer campo del artboard está al **55 % de
 * opacidad** para representar «desplazado fuera del alcance»: atenuarlo de verdad
 * exigiría un efecto gobernado por el *scroll*, que §8 y R94 prohíben expresamente.
 * Las dos son el mismo tipo de cosa — dibujo del estado, no estado.
 *
 * **`key={screen.scenario}`** por lo mismo que en `/login`: los campos son no
 * controlados, así que sin remontar, al pasar de `/register` a `/register?estado=error`
 * los `<input>` se quedarían con el valor anterior.
 */
export const RegisterPod = ({ screen }: { screen: RegisterScreen }) => {
  const conError = screen.scenario === 'error';

  return (
    <main>
      {/* ——— Por debajo de `nav:` — `Register-M` ——— */}
      <div className="flex min-h-dvh flex-col bg-card nav:hidden">
        <header className="flex shrink-0 items-center gap-1 border-b border-border px-2 pt-3 pb-1">
          {/* Único control sólo-icono de la pantalla: lleva `aria-label` (R92) y mide
              44 px por el tamaño `icon` del `Button`, que además le da el anillo de
              foco y el hover del sistema. `/login` ya existe, así que es un `Link`
              tipado y no un `FutureLink`. */}
          <Button asChild variant="ghost" size="icon">
            <Link to="/login" aria-label={VOLVER}>
              <Icon name="arrowLeft" />
            </Link>
          </Button>

          {/* El artboard lo dibuja como un párrafo; es el título de la pantalla, así
              que va como `h1` con el mismo vestido. `font-body` porque la capa base
              pone `font-heading` a todo encabezado y aquí el artboard usa la familia
              de texto, no la de display. */}
          <h1 className="flex-1 font-body text-base font-bold">{TÍTULO_MÓVIL}</h1>

          <Link to="/login" className={`p-3 text-sm ${ENLACE_EN_TEXTO}`}>
            {YA_TENGO_CUENTA}
          </Link>
        </header>

        {/* **Campos alineados abajo** (§4): `justify-end` los pega al pie cuando sobra
            sitio. Deliberadamente **sin** `min-h-0` ni `overflow-hidden`, que es lo que
            el artboard necesita para su marco fijo de 844 px: sin ellos, cuando el
            contenido no cabe el formulario crece, la página se desplaza (R87) y no se
            queda nada inalcanzable por encima del borde. Medido a 390×340: nada acaba
            por encima del borde superior del documento.

            **`scroll-margin` en los campos, y es por un defecto medido, no por gusto.**
            El pie es pegajoso (R88), así que ocupa los ~95 px de abajo de la ventana. Al
            tabular a un campo que queda fuera de la vista, `scrollIntoView` lo alinea
            con el **borde inferior de la ventana** — o sea **detrás del pie** —, y el
            campo enfocado y su anillo quedan tapados. No lo recorta ningún `overflow` ni
            la ventana, así que ni R38 leída al pie de la letra ni el arnés del paso 5 lo
            habrían visto: hay que mirar **qué pinta encima**. Medido a 390×460, 390×400 y
            390×340, donde la pantalla sí se desplaza — a 390×560 **no se desplaza y el
            defecto no aparece**, que es la lección del paso 5 otra vez.

            `scroll-margin-bottom` es la propiedad que `scrollIntoView` honra **en el
            elemento destino** (el `scroll-padding` del paso 5 va en el desplazador, que
            aquí es el documento y lo comparten las seis rutas, así que no sirve). 6,5 rem
            cubren el pie más el alcance del anillo, y el inset de área segura se suma
            porque en un móvil con muesca el pie es más alto. Sólo por debajo de `nav:`:
            en escritorio no hay pie pegajoso. */}
        <form
          key={screen.scenario}
          noValidate
          onSubmit={submitToFutureRoute(DESTINO)}
          className="flex flex-1 flex-col justify-end gap-3.5 px-6 py-3 [&_input]:scroll-mb-[calc(6.5rem+env(safe-area-inset-bottom))] nav:[&_input]:scroll-mb-0"
        >
          {/* El CTA de esta disposición vive en el pie pegajoso, **fuera** del
              formulario, así que este botón oculto es el único botón de envío que hay y
              es lo único que hace que `Intro` llegue al `onSubmit`. No ocupa caja, así
              que no toca la geometría del pie ni el `justify-end` de los campos. */}
          <ImplicitSubmit />
          <CampoTexto
            id="register-m-name"
            label={ETIQUETA_NOMBRE}
            autoComplete="name"
            campo={screen.mobile.name}
          />
          <CampoTexto
            id="register-m-email"
            label={ETIQUETA_EMAIL}
            type="email"
            autoComplete="email"
            campo={screen.mobile.email}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-m-password">{ETIQUETA_CONTRASEÑA}</Label>
            <Input
              id="register-m-password"
              type="password"
              autoComplete="new-password"
              defaultValue={screen.mobile.password.value}
              aria-describedby="register-m-password-hint"
            />
            {/* R36 por construcción: el icono tintado va con su etiqueta visible al
                lado. Y usa `success-foreground`, que §9 midió (4,70–5,15), no el tinte
                `accent-mint` sin medir. El `aria-describedby` de arriba es más
                estricto que el artboard: la pista es útil para quien no la ve. */}
            <p
              id="register-m-password-hint"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Icon name="success" className="size-4 text-success-foreground" />
              {PISTA_CONTRASEÑA}
            </p>
          </div>

          <CampoTexto
            id="register-m-password-repeat"
            label={ETIQUETA_REPITE_MÓVIL}
            type="password"
            autoComplete="new-password"
            campo={screen.mobile.passwordRepeat}
            mensajeDeError={ERROR_REPETICIÓN}
          />
        </form>

        {/* El pie pegajoso de R88: sobrevive a un viewport encogido porque se queda
            pegado al borde inferior mientras la página se desplaza. El artboard le pone
            además una sombra hacia arriba con un literal de color crudo; se entrega sólo con el
            filete, que es el separador que de verdad sostiene la división — el fichero
            de tokens no tiene familia de sombras (issue #13) y no es sitio para
            inventarla. */}
        <div className="sticky bottom-0 z-10 flex shrink-0 flex-col gap-1.5 border-t border-border bg-card px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <BotónCrearCuenta className="w-full" />
          <p className="text-center text-xs text-muted-foreground">
            {TÉRMINOS_ANTES}
            <FutureLink href="/privacy" className={ENLACE_EN_TEXTO}>
              {TÉRMINOS_ENLACE_MÓVIL}
            </FutureLink>
            .
          </p>
        </div>
      </div>

      {/* ——— En y por encima de `nav:` — `Register-D` ——— */}
      <div className="hidden bg-background nav:flex nav:min-h-dvh nav:flex-wrap">
        <section
          aria-label="Recuerdos de ejemplo"
          className="relative min-h-[26.25rem] min-w-0 flex-[1_1_35rem] overflow-hidden p-6"
        >
          <RegisterMosaic />
          <RegisterQuoteCard />
        </section>

        <section className="flex min-w-0 flex-[1_1_30rem] items-center justify-center px-6 py-12">
          <div className="flex w-full max-w-[27.5rem] flex-col gap-6">
            <Link
              to="/login"
              // `self-start` para que el enlace no se estire a lo ancho de la columna:
              // un objetivo de 440 px de ancho para una palabra es área de pulsación que
              // nadie pidió. Y `min-h-…` al objetivo táctil porque, a diferencia de los
              // enlaces dentro de texto corrido —que tienen la exención de WCAG por ir
              // en una frase—, **éste es un bloque**, y medía 36 px de alto: el mismo
              // tratamiento que la cabecera de logotipo del 404 ya lleva (R89).
              className="flex min-h-[var(--primitive-dimension-layout-touch-target)] items-center gap-2 self-start font-heading text-xl font-extrabold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <img src="/brand/memora-mark.svg" alt="" className="size-9" />
              memora
            </Link>

            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-[2.25rem]/[1.1] font-extrabold tracking-tight">
                {TÍTULO_ESCRITORIO}
              </h1>
              {/* La línea del encabezado de móvil se convierte aquí en esta sublínea
                  (§4): es la misma función con otras palabras y otro sitio. */}
              <p className="text-base text-body-foreground">
                {YA_TIENES_UNA}
                <Link to="/login" className={ENLACE_EN_TEXTO}>
                  {INICIA_SESIÓN}
                </Link>
              </p>
            </div>

            <form
              key={screen.scenario}
              noValidate
              onSubmit={submitToFutureRoute(DESTINO)}
              className="flex flex-col gap-4 rounded-panel border border-border bg-card p-7 shadow-sm"
            >
              <ImplicitSubmit />

              {conError ? (
                <Alert>
                  <AlertTitle>{ALERTA_TÍTULO}</AlertTitle>
                  <AlertDescription>{ALERTA_CUERPO}</AlertDescription>
                </Alert>
              ) : null}

              <CampoTexto
                id="register-d-name"
                label={ETIQUETA_NOMBRE}
                autoComplete="name"
                campo={screen.desktop.name}
              />

              {/* El mensaje de este campo lleva un **enlace dentro** (§10), que es una
                  de las tres cosas que hacen el error de escritorio más rico que el de
                  móvil. El artboard marca el campo **sin** `aria-describedby`; aquí se
                  pone, siguiendo el artboard más estricto (R91, T35). */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="register-d-email">{ETIQUETA_EMAIL}</Label>
                <Input
                  id="register-d-email"
                  type="email"
                  autoComplete="email"
                  defaultValue={screen.desktop.email.value}
                  aria-invalid={screen.desktop.email.invalid || undefined}
                  aria-describedby={
                    screen.desktop.email.invalid ? 'register-d-email-error' : undefined
                  }
                />
                {screen.desktop.email.invalid ? (
                  <FieldMessage id="register-d-email-error">
                    {ERROR_EMAIL_EXISTE}
                    <Link to="/login" className={ENLACE_EN_TEXTO}>
                      {INICIA_SESIÓN}
                    </Link>
                  </FieldMessage>
                ) : null}
              </div>

              {/* Las dos contraseñas en rejilla de dos columnas: es la densidad media
                  de escritorio que §2 pide, y una de las formas en que esta pantalla
                  **no** es la de móvil. */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-d-password">{ETIQUETA_CONTRASEÑA}</Label>
                  <Input
                    id="register-d-password"
                    type="password"
                    autoComplete="new-password"
                    defaultValue={screen.desktop.password.value}
                    aria-invalid={screen.desktop.password.invalid || undefined}
                    aria-describedby={
                      screen.desktop.password.invalid
                        ? 'register-d-password-error'
                        : undefined
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-d-password-repeat">
                    {ETIQUETA_REPITE_ESCRITORIO}
                  </Label>
                  <Input
                    id="register-d-password-repeat"
                    type="password"
                    autoComplete="new-password"
                    defaultValue={screen.desktop.passwordRepeat.value}
                    aria-invalid={screen.desktop.passwordRepeat.invalid || undefined}
                  />
                </div>
              </div>

              {/* **Mensaje a nivel de formulario**, bajo la rejilla y no bajo un campo
                  (§6, T35): es la tercera forma de error del contrato y no se
                  intercambia por las otras dos. Lo apunta el campo de contraseña con su
                  `aria-describedby`, que es lo que lo ata a algo para quien no lo ve. */}
              {conError ? (
                <FieldMessage id="register-d-password-error" className="-mt-1">
                  {ERROR_CONTRASEÑA_FORMULARIO}
                </FieldMessage>
              ) : null}

              <BotónCrearCuenta className="mt-1 w-full" />

              <p className="text-center text-xs text-muted-foreground">
                {TÉRMINOS_ANTES_ESCRITORIO}
                <FutureLink href="/privacy" className={ENLACE_EN_TEXTO}>
                  {TÉRMINOS_ENLACE_ESCRITORIO}
                </FutureLink>
                .
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

/**
 * Un campo de texto con su etiqueta de verdad y, si va marcado, su mensaje — con la
 * pareja `aria-invalid` + `aria-describedby` **en un solo sitio** (R91, §9).
 *
 * Igual que en `login`: las dos disposiciones son dos árboles explícitos, pero el
 * cableado de accesibilidad no se duplica, porque duplicarlo es la forma de que un día
 * se arregle una mitad y la otra se quede muda sin que ningún test lo vea.
 *
 * El `id` lo da quien lo usa y no se deriva: las dos disposiciones coexisten en el DOM
 * y un id repetido rompería el `<label for>` de las dos.
 */
const CampoTexto = ({
  id,
  label,
  type,
  autoComplete,
  campo,
  mensajeDeError,
}: {
  id: string;
  label: string;
  type?: 'email' | 'password';
  autoComplete?: string;
  campo: RegisterField;
  mensajeDeError?: string;
}) => {
  const idError = `${id}-error`;
  const marcado = campo.invalid && mensajeDeError !== undefined;

  return (
    <div className="flex flex-col gap-1.5 nav:gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        defaultValue={campo.value}
        aria-invalid={campo.invalid || undefined}
        aria-describedby={marcado ? idError : undefined}
      />
      {marcado ? <FieldMessage id={idError}>{mensajeDeError}</FieldMessage> : null}
    </div>
  );
};
