import type { LoginFormValuesApiModel } from './api/login.api-model';
import type { LoginField, LoginScenario, LoginScreen } from './login.model';

/** Un campo vacío y sin marcar: el formulario que se entrega (R69). */
const CAMPO_VACÍO = (): LoginField => ({ value: '', invalid: false });

/**
 * El mapeo completo de `/login` a su ViewModel (R43).
 *
 * «Completo» en esta pantalla no significa renombrar — no hay nada que renombrar —,
 * significa **derivar lo que el componente necesita hecho**: con qué valor arranca cada
 * campo y si va marcado. Después de esto la pantalla no decide nada de eso; si
 * tuviera que hacerlo, el límite estaría roto (R41).
 *
 * **Sólo `error` rellena y marca** (R69): los `default-value` que los artboards
 * teclean para poder dibujar un campo son material de diseño, y la decisión del
 * contrato los deja únicamente en `?estado=error`. Eso incluye `enviando`, que
 * `Login-D` dibuja con los campos llenos.
 *
 * **Los dos campos van marcados, y el de la contraseña con el valor vacío**, que es lo
 * que `Login-M-Error` dibuja. Derivar `invalid` de «tiene valor» sería validar (R68) y
 * además dejaría ese campo sin marcar: `invalid` sale del escenario que la URL pidió,
 * nunca del contenido.
 */
export const mapLoginScreenFromApi = (
  valoresDeError: LoginFormValuesApiModel,
  scenario: LoginScenario,
): LoginScreen =>
  scenario === 'error'
    ? {
        scenario,
        email: { value: valoresDeError.email, invalid: true },
        password: { value: valoresDeError.password, invalid: true },
      }
    : { scenario, email: CAMPO_VACÍO(), password: CAMPO_VACÍO() };
