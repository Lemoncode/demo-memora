import type {
  RegisterErrorFormValuesApiModel,
  RegisterFormValuesApiModel,
} from './api/register.api-model';
import type { RegisterForm, RegisterScenario, RegisterScreen } from './register.model';

/** Un campo vacío y sin marcar: el formulario que se entrega (R69, R80). */
const CAMPO_VACÍO = () => ({ value: '', invalid: false });

const FORMULARIO_VACÍO = (): RegisterForm => ({
  name: CAMPO_VACÍO(),
  email: CAMPO_VACÍO(),
  password: CAMPO_VACÍO(),
  passwordRepeat: CAMPO_VACÍO(),
});

/**
 * **Qué campos marca cada ancho en el estado `error`**, leído de los artboards:
 *
 * - `Register-M` marca **uno**, «Repite la contraseña», y no lleva `Alert`.
 * - `Register-D` marca **dos**, Email y Contraseña — y deja «Repítela» válida —, con
 *   el `Alert` «Revisa 2 campos» por encima.
 *
 * **Esta asimetría es el diseño y no se iguala** (T35, §6: «deliberadamente más rico en
 * escritorio»). Está escrita como dato y no repartida por dos componentes para que haya
 * **un solo sitio** donde se lea, y para que un test pueda fijarla: igualar los dos
 * lados es el fallo que esta pantalla ya cometió una vez en el contrato de diseño.
 */
const CAMPOS_MARCADOS: Record<'mobile' | 'desktop', readonly (keyof RegisterForm)[]> = {
  mobile: ['passwordRepeat'],
  desktop: ['email', 'password'],
};

const conValoresYMarcas = (
  valores: RegisterFormValuesApiModel,
  marcados: readonly (keyof RegisterForm)[],
): RegisterForm => {
  const marcado = (campo: keyof RegisterForm) => marcados.includes(campo);

  return {
    name: { value: valores.name, invalid: marcado('name') },
    email: { value: valores.email, invalid: marcado('email') },
    password: { value: valores.password, invalid: marcado('password') },
    passwordRepeat: {
      value: valores.passwordRepeat,
      invalid: marcado('passwordRepeat'),
    },
  };
};

/**
 * El mapeo completo de `/register` a su ViewModel (R43).
 *
 * «Completo» aquí es trabajo de verdad: decide, **por ancho**, con qué valor arranca
 * cada uno de los cuatro campos y cuáles van marcados. Después de esto ninguna de las
 * dos disposiciones decide nada de eso.
 *
 * **El estado por omisión no lleva ningún error** (R80), y eso incluye la «Repite la
 * contraseña» que `Register-M` dibuja marcada: ese campo pertenece a `?estado=error`.
 */
export const mapRegisterScreenFromApi = (
  valoresDeError: RegisterErrorFormValuesApiModel,
  scenario: RegisterScenario,
): RegisterScreen =>
  scenario === 'error'
    ? {
        scenario,
        mobile: conValoresYMarcas(valoresDeError.mobile, CAMPOS_MARCADOS.mobile),
        desktop: conValoresYMarcas(valoresDeError.desktop, CAMPOS_MARCADOS.desktop),
      }
    : { scenario, mobile: FORMULARIO_VACÍO(), desktop: FORMULARIO_VACÍO() };
