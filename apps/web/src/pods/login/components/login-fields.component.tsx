import { FieldMessage } from '#/common/components/field-message.component';
import { FutureLink } from '#/common/components/future-link.component';
import { Input } from '#/common/components/ui/input';
import { Label } from '#/common/components/ui/label';

import type { LoginScreen } from '../login.model';

/** Copia literal de §10 (R93). Los dos anchos comparten estas cadenas. */
const ETIQUETA_EMAIL = 'Email';
const ETIQUETA_CONTRASEÑA = 'Contraseña';
const PLACEHOLDER_EMAIL = 'tu@email.com';
const PLACEHOLDER_CONTRASEÑA = 'Tu contraseña';
const OLVIDADA = '¿La has olvidado?';
const ERROR_EMAIL = 'Introduce un email válido, por ejemplo nombre@dominio.com';
const ERROR_CONTRASEÑA = 'Escribe tu contraseña.';

/**
 * «¿La has olvidado?» es un **enlace de verdad a su ruta futura** (R71), no un ancla
 * muerta: el artboard dibuja `href="#"` y eso es justo lo que esta parte no entrega.
 * La pantalla de recuperación **no tiene diseño en ningún sitio del canvas** y está
 * capturada como la issue **#12**; hasta que exista, este enlace aterriza en el 404
 * diseñado, que es lo que §3 declara para todo enlace hacia delante.
 */
const RECUPERACIÓN = '/password-recovery';

/**
 * Los dos campos de `/login`, con su cableado de accesibilidad **en un solo sitio**.
 *
 * **Por qué este trozo se comparte entre las dos disposiciones y el resto no.** R86
 * pide dos disposiciones explícitas, y lo son: la hoja de móvil y la tarjeta de
 * escritorio son dos árboles distintos, con su propia superficie, su propia tipografía
 * y su propio CTA. Lo que no se duplica es **esto**: la pareja `aria-invalid` +
 * `aria-describedby` que §9 exige en todo campo inválido. Duplicarla sería la forma de
 * que un día alguien arregle una mitad y la otra se quede muda — y ningún test de esta
 * parte mira el markup, así que no habría nada que lo cazara.
 *
 * `prefijo` existe porque **las dos disposiciones se pintan a la vez en el DOM** (una
 * de ellas en `display: none`), así que ids iguales romperían el `<label for>` y el
 * `aria-describedby` de las dos. Nunca se emite el mismo id dos veces.
 *
 * **Etiquetas de verdad, no placeholders** (R91, §5): el `placeholder` es un ejemplo,
 * y el `<Label htmlFor>` es lo que nombra el campo.
 *
 * **`disabled` y `defaultValue` no validan nada** (R68): el primero sale de `enviando`
 * y el segundo del escenario que el repositorio resolvió. Aquí no se comprueba el
 * contenido de ningún campo, y no hay ni un `if` sobre el valor escrito.
 */
export const LoginFields = ({
  prefijo,
  screen,
}: {
  prefijo: string;
  screen: LoginScreen;
}) => {
  const enviando = screen.scenario === 'enviando';
  const idEmail = `${prefijo}-email`;
  const idContraseña = `${prefijo}-password`;
  const idErrorEmail = `${idEmail}-error`;
  const idErrorContraseña = `${idContraseña}-error`;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={idEmail}>{ETIQUETA_EMAIL}</Label>
        <Input
          id={idEmail}
          type="email"
          autoComplete="email"
          placeholder={PLACEHOLDER_EMAIL}
          defaultValue={screen.email.value}
          disabled={enviando}
          aria-invalid={screen.email.invalid || undefined}
          aria-describedby={screen.email.invalid ? idErrorEmail : undefined}
        />
        {screen.email.invalid ? (
          <FieldMessage id={idErrorEmail}>{ERROR_EMAIL}</FieldMessage>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={idContraseña}>{ETIQUETA_CONTRASEÑA}</Label>
          {/* El `-my-3 py-3` es del artboard: sube el objetivo de pulsación a 44 px
              sin mover nada de sitio. `margin` y `padding` son grupos distintos para
              tailwind-merge, así que ninguno se come al otro.

              **`relative z-10` arregla un anillo de foco medido a medias, y el defecto
              es de este mismo apaño.** La caja pintada mide 44 px dentro de una fila de
              20, así que sobresale 12 px por abajo — justo donde empieza el campo de
              contraseña, que es opaco y va **después** en el documento. Chrome pinta el
              `outline` con su elemento, no al final de la pila, así que el fondo del
              campo tapaba los 8 px de abajo del anillo: se veía **abierto por abajo** en
              las ocho ventanas medidas, en las dos disposiciones. Con `z-10` el enlace y
              su anillo pintan por encima y el rectángulo se cierra. No mueve nada: sin
              desplazamientos, `relative` deja el elemento donde estaba, y el recorrido de
              tabulación y la geometría no cambian (medido antes y después).

              Crecer hacia arriba en vez de hacia abajo no es salida: ahí está el campo de
              email a 16 px, y el solape sería mayor. */}
          <FutureLink
            href={RECUPERACIÓN}
            className="relative z-10 -my-3 py-3 text-sm font-semibold text-link"
          >
            {OLVIDADA}
          </FutureLink>
        </div>
        <Input
          id={idContraseña}
          type="password"
          autoComplete="current-password"
          placeholder={PLACEHOLDER_CONTRASEÑA}
          defaultValue={screen.password.value}
          disabled={enviando}
          aria-invalid={screen.password.invalid || undefined}
          aria-describedby={screen.password.invalid ? idErrorContraseña : undefined}
        />
        {screen.password.invalid ? (
          <FieldMessage id={idErrorContraseña}>{ERROR_CONTRASEÑA}</FieldMessage>
        ) : null}
      </div>
    </>
  );
};
