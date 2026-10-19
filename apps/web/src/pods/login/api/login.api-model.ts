/**
 * La respuesta que alimenta `/login`: el modelo de API del pod (R40).
 *
 * **Lo único que `/login` tiene como dato son los valores con los que `Login-M-Error`
 * dibuja sus dos campos marcados.** La pantalla no tiene dominio: no hay sesión, no hay
 * cuenta y no hay nada que consultar (R67), así que el `api/` de este pod es tan fino
 * como el seam que sustituye — y existe igualmente, porque es **exactamente** el sitio
 * que cambia el día que haya backend (D13).
 *
 * **Por qué esto está en `camelCase` y sus vecinos en `snake_case`.** No es una
 * respuesta de API de verdad: ningún backend devuelve «lo que la persona ha escrito».
 * Viene de `form-demo-values.mock.ts`, el único fichero del dataset en `camelCase`, y
 * su propio comentario explica por qué. Renombrar aquí por simetría sería inventarse una
 * forma de transporte que nadie tiene.
 *
 * Lo que sí se respeta es el límite: este tipo **no sale del repositorio** (R41, R42).
 * Lo que sale es `LoginScreen`.
 */
export interface LoginFormValuesApiModel {
  readonly email: string;
  readonly password: string;
}
