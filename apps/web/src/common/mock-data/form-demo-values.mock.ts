/**
 * Los valores de demostración que **solo** aparecen en las variantes `?estado=error`
 * (R49, R69).
 *
 * Viven aquí y no en el markup de ningún componente por una razón concreta: un
 * `recuerdos2026` escrito a mano en un `defaultValue` es una cadena con forma de
 * credencial y los escáneres de secretos la marcan. Nada de esto es una credencial — son
 * las cadenas que los artboards teclean para poder dibujar un campo inválido —, y esta es
 * la única copia que existe. **Los formularios se entregan vacíos**: fuera de
 * `?estado=error` no se lee nada de este fichero.
 *
 * Esto **no** es una respuesta de API — ningún backend devuelve «lo que la persona ha
 * escrito» —, así que es el único fichero de `mock-data/` en camelCase en lugar de la
 * forma `snake_case` de sus vecinos.
 *
 * Los valores se reparten por breakpoint donde el contrato de diseño los reparte: el
 * vocabulario `?estado=` nombra estados y nunca un breakpoint, pero los *valores* de
 * `Register-M` y `Register-D` son distintos, y ambos artboards son la referencia de su
 * ancho para el mismo estado `error`.
 */

export interface LoginErrorDemoValues {
  readonly email: string;
  readonly password: string;
}

export interface RegisterErrorDemoValues {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly passwordRepeat: string;
}

export interface ProfileErrorDemoValues {
  readonly name: string;
  readonly email: string;
}

/**
 * `Login-M-Error`: el email está cortado — es lo que hace que «Introduce un email
 * válido…» tenga sentido — y la contraseña se queda **vacía**, que es lo que el artboard
 * dibuja (solo placeholder) bajo «Escribe tu contraseña.». Un único juego para los dos
 * anchos: §6 dice que escritorio lleva el mismo `Alert` y los mismos campos inválidos al
 * formulario de `Login-D`.
 */
export const loginErrorDemoValues: LoginErrorDemoValues = {
  email: 'sofia.martin@correo',
  password: '',
};

/**
 * Los dos juegos de `/register`, deliberadamente distintos:
 *
 * - `mobile` (`Register-M`): un único campo inválido y sin `Alert` — la repetición de la
 *   contraseña le baja un carácter, que es lo que dispara «Las contraseñas no coinciden.».
 * - `desktop` (`Register-D`): más rico a propósito — `Alert` «Revisa 2 campos», el email
 *   ya registrado («Ya hay una cuenta con este email.») y una contraseña que incumple el
 *   mensaje de nivel de formulario, más exigente que el de móvil: «al menos 8 caracteres
 *   **y un número**».
 */
export const registerErrorDemoValues: Record<
  'mobile' | 'desktop',
  RegisterErrorDemoValues
> = {
  mobile: {
    name: 'Sofía Martín',
    email: 'sofia.martin@correo.es',
    password: 'recuerdos2026',
    passwordRepeat: 'recuerdos206',
  },
  desktop: {
    name: 'Sofía Martín',
    email: 'sofia@memora.app',
    password: 'recuerdos',
    passwordRepeat: 'recuerdos',
  },
};

/**
 * `Profile-D` (edición + `Alert` + email inválido), el único artboard del estado `error`
 * de `/profile`. El nombre lleva el apellido completo y el email es otro distinto del de
 * `viewerMock` a propósito: son los cambios **sin guardar** que «El resto de cambios
 * siguen aquí.» promete conservar, y el email es el que choca con «Ya hay otra cuenta con
 * este email.».
 */
export const profileErrorDemoValues: ProfileErrorDemoValues = {
  name: 'Sofía Martín Ortega',
  email: 'sofia@memora.app',
};
