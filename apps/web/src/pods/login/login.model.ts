/**
 * El ViewModel de `/login`: lo **único** que el repositorio deja salir (R41).
 */

/**
 * Los tres escenarios de `/login`, uno por valor de `?estado=` más el de omisión
 * (R77). Los nombres van en español como el resto del dominio del proyecto, y
 * `por-defecto` se nombra en vez de modelarse como `undefined` para que el componente
 * no tenga que distinguir «no hay estado» de «el estado es el normal».
 *
 * **No hay `cargando`** y no se añade: ninguna ruta de esta parte tiene estado de carga
 * (R81). `enviando` **no es** un estado de carga: es el formulario en vuelo, que se
 * anuncia con `aria-busy` y deshabilita sus controles, nunca un spinner sobre la
 * pantalla (R83).
 */
export type LoginScenario = 'por-defecto' | 'error' | 'enviando';

/**
 * Un campo tal y como la pantalla lo tiene que dibujar: con qué valor arranca y si va
 * marcado como inválido.
 *
 * **`invalid` no es el resultado de validar nada** (R68): ningún campo se comprueba, ni
 * aquí ni en la pantalla. Es lo que el artboard del escenario dibuja, y lo decide el
 * mapper a partir del escenario que la URL pidió.
 */
export interface LoginField {
  readonly value: string;
  readonly invalid: boolean;
}

/**
 * Los mensajes de error **no** viven aquí: son copia literal de §10 y viven en el
 * componente que los pinta, igual que en `not-found.pod.tsx`. El ViewModel lleva el
 * dato (qué valor, qué campo marcado); la pantalla lleva las palabras.
 */
export interface LoginScreen {
  readonly scenario: LoginScenario;
  readonly email: LoginField;
  readonly password: LoginField;
}
