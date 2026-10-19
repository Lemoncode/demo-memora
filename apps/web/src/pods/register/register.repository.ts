import { registerApi } from './api/register.api';
import { resolveRegisterScenario } from './register.business';
import { mapRegisterScreenFromApi } from './register.mapper';
import type { RegisterScreen } from './register.model';

/**
 * El **único** punto de entrada a los datos de `/register` (R41), y el sitio donde se
 * resuelve el escenario que la URL pidió (R76).
 *
 * Mismo contrato que `loginRepository`: api → `business` → mapper, y lo que sale es
 * ViewModel. Ni el `loader` ni el pod ni sus componentes saben que
 * `register.api-model.ts` existe (R42).
 */
export const registerRepository = {
  getScreen: async (estado: unknown): Promise<RegisterScreen> =>
    mapRegisterScreenFromApi(
      await registerApi.getErrorFormValues(),
      resolveRegisterScenario(estado),
    ),
};
