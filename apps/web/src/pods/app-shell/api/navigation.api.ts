import { circlesMock } from '#/common/mock-data/circles.mock';
import { viewerMock } from '#/common/mock-data/users.mock';

import type { NavigationApiModel } from './navigation.api-model';

/**
 * El `api/` del pod: **sólo E/S**, sin lógica y sin formato (R40).
 *
 * Hoy la «red» son las fixtures compartidas, que están escritas en forma de respuesta
 * de API precisamente para que este fichero sea lo único que cambie el día que haya
 * backend (R39). Por eso devuelve una promesa aunque no haya nada asíncrono: la firma
 * es la del endpoint, no la del mock.
 *
 * `email` viaja aunque ninguna pantalla del raíl lo dibuje — es lo que trae un endpoint
 * de «quién eres» —, y es el mapper quien decide que el front no lo necesita.
 *
 * Es un objeto y no una función suelta para que el repositorio pueda espiarlo con
 * `vi.spyOn` en el límite del sistema, que es la estrategia de *mocking* por omisión
 * del proyecto.
 */
export const navigationApi = {
  getNavigation: (): Promise<NavigationApiModel> =>
    Promise.resolve({ viewer: viewerMock, circles: circlesMock }),
};
