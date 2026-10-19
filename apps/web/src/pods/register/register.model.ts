/**
 * El ViewModel de `/register`: lo **único** que el repositorio deja salir (R41).
 */

/**
 * Los dos escenarios de `/register` (R77). El vocabulario tiene **un solo valor**,
 * `error`: el estado por omisión va con los cuatro campos **vacíos y válidos** (R80),
 * y la «Repite la contraseña» que `Register-M` dibuja marcada pertenece a `?estado=
 * error`, no al estado normal — la v1 del contrato de diseño se contradecía aquí.
 */
export type RegisterScenario = 'por-defecto' | 'error';

/** Igual que en `login`: `invalid` es lo que el artboard dibuja, no el resultado de validar (R68). */
export interface RegisterField {
  readonly value: string;
  readonly invalid: boolean;
}

export interface RegisterForm {
  readonly name: RegisterField;
  readonly email: RegisterField;
  readonly password: RegisterField;
  readonly passwordRepeat: RegisterField;
}

/**
 * **Los dos anchos van en el ViewModel a la vez, y tienen que ir.** Las dos
 * disposiciones se pintan simultáneamente en el DOM (una en `display: none`, R86), así
 * que las dos necesitan sus campos ya resueltos; y el estado `error` es
 * **deliberadamente distinto** en cada una — móvil marca un campo y no lleva `Alert`,
 * escritorio lleva `Alert`, dos campos marcados y un mensaje de nivel de formulario.
 * Un solo juego de campos obligaría a una de las dos a mentir.
 *
 * Los mensajes son copia literal de §10 y viven en los componentes, como en `login`.
 */
export interface RegisterScreen {
  readonly scenario: RegisterScenario;
  readonly mobile: RegisterForm;
  readonly desktop: RegisterForm;
}
