import { navigationApi } from './api/navigation.api';
import { mapNavigationFromApi } from './app-shell.mapper';
import type { Navigation } from './app-shell.model';

/**
 * El **único** punto de entrada a los datos del pod `app-shell` (R41), y el límite
 * entre lo que mira al backend y lo que mira al front.
 *
 * Llama al api, pasa la respuesta por el mapper y devuelve ViewModel. Ni el `loader` de
 * `_app.tsx` ni el pod ni los dos compuestos saben que `navigation.api-model.ts`
 * existe: si alguno tuviera que renombrar un campo, recortar `email` o calcular unas
 * iniciales, este límite estaría roto (R42).
 */
export const appShellRepository = {
  getNavigation: async (): Promise<Navigation> =>
    mapNavigationFromApi(await navigationApi.getNavigation()),
};
