import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router';

import { AppShellPod } from '#/pods/app-shell/app-shell.pod';
import { appShellRepository } from '#/pods/app-shell/app-shell.repository';

/**
 * El shell, como **ruta de layout sin path** (D8).
 *
 * Que esté presente en `/profile` y en el 404 y ausente en `/login`, `/register` y
 * `/invite/$token` (R50) lo dice **el árbol de ficheros** y no un condicional:
 * `_app/profile.tsx` y `_app/$.tsx` son hijos de esta ruta, y las tres pantallas sin
 * sesión viven fuera. Un `if` en un componente habría dejado la misma regla escrita en
 * un sitio donde nadie la busca.
 *
 * La ruta es **delgada** (R44): el `loader` llama al repositorio del pod y a nada más,
 * y el componente compone el pod alrededor del `<Outlet/>`.
 */
export const Route = createFileRoute('/_app')({
  loader: () => appShellRepository.getNavigation(),
  component: AppShellLayout,
});

function AppShellLayout() {
  const navigation = Route.useLoaderData();

  // La **ruta emparejada**, no la URL: el `fullPath` del match más profundo. Es lo que
  // hace que el 404 no marque ningún ítem como página actual mientras las rutas de las
  // Partes 2 y 3 no existan — `/circles` empareja hoy la splat, cuyo `fullPath` es `/$`
  // —, y lo que hará que `/profile` marque su fila de identidad en cuanto el Grupo 12
  // cree esa ruta. El pod no toca el router: recibe esto como `prop`.
  const activePath = useRouterState({
    select: (state) => state.matches.at(-1)?.fullPath,
  });

  return (
    <AppShellPod navigation={navigation} activePath={activePath}>
      <Outlet />
    </AppShellPod>
  );
}
