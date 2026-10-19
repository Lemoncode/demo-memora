/**
 * La respuesta que alimenta `/register`: el modelo de API del pod (R40).
 *
 * Igual que en `login`, lo único que esta pantalla tiene como dato son los valores con
 * los que los artboards del estado `error` dibujan sus campos marcados — no hay cuenta,
 * no hay registro y no hay nada que consultar (R67). Y por el mismo motivo el `api/`
 * existe de todas formas: es el seam que un backend sustituye (D13).
 *
 * **Dos juegos, uno por ancho, y es del diseño.** `?estado=` nombra un estado y nunca
 * un breakpoint (R79), pero los *valores* que `Register-M` y `Register-D` teclean son
 * distintos, y los dos artboards son la referencia de su anchura para el mismo estado
 * `error`. El fixture compartido ya los reparte así (R49).
 *
 * `camelCase` por la misma razón que en `login`: esto no es una respuesta de transporte
 * — ningún backend devuelve «lo que la persona ha escrito» —, viene de
 * `form-demo-values.mock.ts` y su comentario lo explica. El tipo **no sale del
 * repositorio** (R41, R42).
 */
export interface RegisterFormValuesApiModel {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly passwordRepeat: string;
}

export interface RegisterErrorFormValuesApiModel {
  readonly mobile: RegisterFormValuesApiModel;
  readonly desktop: RegisterFormValuesApiModel;
}
