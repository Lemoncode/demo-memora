import { loginApi } from './api/login.api';
import { resolveLoginScenario } from './login.business';
import { mapLoginScreenFromApi } from './login.mapper';
import type { LoginScreen } from './login.model';

/**
 * El **único** punto de entrada a los datos de `/login` (R41), y el sitio donde se
 * resuelve el escenario que la URL pidió (R76).
 *
 * Llama al api, resuelve el escenario con el `business` y pasa las dos cosas por el
 * mapper. Ni el `loader` de la ruta ni el pod ni sus componentes saben que
 * `login.api-model.ts` existe: si alguno tuviera que leer un valor de demostración o
 * decidir qué campo va marcado, este límite estaría roto (R42).
 *
 * **Es también el seam que desaparece el día que haya backend**: entonces `?estado=` se
 * va con él y el escenario lo dirá la respuesta, sin que la pantalla cambie.
 */
export const loginRepository = {
  getScreen: async (estado: unknown): Promise<LoginScreen> =>
    mapLoginScreenFromApi(
      await loginApi.getErrorFormValues(),
      resolveLoginScenario(estado),
    ),
};
