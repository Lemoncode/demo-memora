import { createFileRoute } from '@tanstack/react-router';

import { ESTADOS_REGISTER, validateEstado } from '#/common/routing/estado';
import { RegisterPod } from '#/pods/register/register.pod';
import { registerRepository } from '#/pods/register/register.repository';

/**
 * **El validador va a una `const` y no en línea, y esto está medido.** Con
 * `validateSearch: validateEstado(ESTADOS_REGISTER)` escrito dentro del objeto de opciones,
 * TypeScript tiene que inferir a la vez el genérico de `validateEstado` y el validador de
 * la ruta, y la inferencia de dentro **pierde**: el esquema de la *search* se queda en
 * `{}` y `search.estado` dentro de `loaderDeps` no compila. Sacándolo aquí el tipo ya es
 * concreto cuando la ruta se comprueba. (Pasar el genérico a mano también lo arregla, pero
 * duplicaría el vocabulario en dos sitios, que es justo lo que `ESTADOS_REGISTER` evita.)
 */
const validarSearch = validateEstado(ESTADOS_REGISTER);

/**
 * `/register` (R62), fuera del layout `_app` como `/login` (R50, D8).
 *
 * Misma forma delgada que `/login` (R44). El vocabulario de esta ruta es **sólo**
 * `error` (R77): el estado por omisión va con los cuatro campos vacíos y sin ningún
 * error (R80).
 */
export const Route = createFileRoute('/register')({
  validateSearch: validarSearch,
  loaderDeps: ({ search }) => ({ estado: search.estado }),
  loader: ({ deps }) => registerRepository.getScreen(deps.estado),
  component: RegisterRoute,
});

function RegisterRoute() {
  return <RegisterPod screen={Route.useLoaderData()} />;
}
