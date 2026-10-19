import { createFileRoute } from '@tanstack/react-router';

import { ESTADOS_LOGIN, validateEstado } from '#/common/routing/estado';
import { LoginPod } from '#/pods/login/login.pod';
import { loginRepository } from '#/pods/login/login.repository';

/**
 * **El validador va a una `const` y no en línea, y esto está medido.** Con
 * `validateSearch: validateEstado(ESTADOS_LOGIN)` escrito dentro del objeto de opciones,
 * TypeScript tiene que inferir a la vez el genérico de `validateEstado` y el validador de
 * la ruta, y la inferencia de dentro **pierde**: el esquema de la *search* se queda en
 * `{}` y `search.estado` dentro de `loaderDeps` no compila. Sacándolo aquí el tipo ya es
 * concreto cuando la ruta se comprueba. (Pasar el genérico a mano también lo arregla, pero
 * duplicaría el vocabulario en dos sitios, que es justo lo que `ESTADOS_LOGIN` evita.)
 */
const validarSearch = validateEstado(ESTADOS_LOGIN);

/**
 * `/login` (R62), **fuera del layout `_app`**, que es cómo el shell está ausente aquí
 * sin ningún condicional (R50, D8).
 *
 * La ruta es **delgada** (R44): valida la *search*, llama al repositorio del pod y
 * compone el pod. Nada más — ni mapper, ni api, ni decisión de estado.
 *
 * `validateEstado(ESTADOS_LOGIN)` es la línea que el Grupo 8 dejó preparada: el
 * vocabulario de esta ruta es `error` y `enviando` (R77) y cualquier otro valor se queda
 * en `undefined`, con lo que el repositorio resuelve el estado por omisión sin lanzar y
 * sin pantalla de error (R78). Un valor vacío, mal escrito o repetido cambia además la
 * *search* canónica, así que el router vuelve a pedir la ruta sin el parámetro —
 * **307**, medido en D001 — y es esa petición la que pinta el estado por omisión;
 * **ausente** responde 200 (R77), y una clave ajena también.
 *
 * **`loaderDeps` no es ceremonia.** El `loader` no ve la *search* si no se declara qué
 * parte de ella le importa; sin esta línea, ir de `/login` a `/login?estado=error`
 * reutilizaría los datos ya cargados y la pantalla no cambiaría — justo lo que
 * `?estado=` existe para hacer posible (D10).
 */
export const Route = createFileRoute('/login')({
  validateSearch: validarSearch,
  loaderDeps: ({ search }) => ({ estado: search.estado }),
  loader: ({ deps }) => loginRepository.getScreen(deps.estado),
  component: LoginRoute,
});

function LoginRoute() {
  return <LoginPod screen={Route.useLoaderData()} />;
}
