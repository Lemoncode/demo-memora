import { loginErrorDemoValues } from '#/common/mock-data/form-demo-values.mock';

import type { LoginFormValuesApiModel } from './login.api-model';

/**
 * El `api/` del pod: **sólo E/S**, sin lógica y sin formato (R40).
 *
 * Devuelve una promesa aunque no haya nada asíncrono porque la firma es la del
 * endpoint, no la del mock (el mismo criterio que `app-shell`).
 *
 * Es un objeto y no una función suelta para que el repositorio se pueda espiar con
 * `vi.spyOn` en el límite del sistema, que es la estrategia de *mocking* por omisión
 * del proyecto.
 */
export const loginApi = {
  getErrorFormValues: (): Promise<LoginFormValuesApiModel> =>
    Promise.resolve(loginErrorDemoValues),
};
