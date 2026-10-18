/**
 * El almacenamiento del panel «Almacenamiento» de `/profile`, en forma de respuesta de
 * API (R39): recuento de bytes y código de plan, no la etiqueta en español.
 *
 * Las cifras son las que los artboards `Profile-M` y `Profile-D` muestran como
 * «3,1 GB de 5 GB usados · plan Gratis», y están elegidas para que cuadren con el valor
 * que ambos artboards dan a su `Progress`: 3,1 / 5 = 62 %, exactamente su `p: 62`. GB
 * decimales (10⁹), que es lo que hace que 5 000 000 000 bytes se lean «5 GB».
 *
 * `plan_code` es el código del backend; «Gratis» es su forma mostrable y la produce el
 * mapper de su pod (R43), no este fichero.
 */
export interface StorageApiShape {
  readonly used_bytes: number;
  readonly limit_bytes: number;
  readonly plan_code: 'free';
}

export const storageMock: StorageApiShape = {
  used_bytes: 3_100_000_000,
  limit_bytes: 5_000_000_000,
  plan_code: 'free',
};
