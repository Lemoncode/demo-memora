import { registerErrorDemoValues } from '#/common/mock-data/form-demo-values.mock';

import type { RegisterErrorFormValuesApiModel } from './register.api-model';

/**
 * El `api/` del pod: **sólo E/S**, sin lógica y sin formato (R40). Mismo criterio que
 * `app-shell` y `login`: promesa porque la firma es la del endpoint, y objeto para que
 * el repositorio se pueda espiar con `vi.spyOn` en el límite del sistema.
 */
export const registerApi = {
  getErrorFormValues: (): Promise<RegisterErrorFormValuesApiModel> =>
    Promise.resolve(registerErrorDemoValues),
};
