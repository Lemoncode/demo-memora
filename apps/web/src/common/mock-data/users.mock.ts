/**
 * Las dos personas del dataset, en forma de respuesta de API (R39).
 *
 * Leídas de los artboards: Sofía Martín de `Profile-M` / `Profile-D` (fila de identidad
 * del raíl, tarjeta «Tus datos») y de la línea «Entrarás como …» de `Invite-M`; Lucas
 * Vidal del `Avatar` + «**Lucas Vidal** te invita a» de `Invite-M` / `Invite-D`.
 *
 * No hay campo `id`: ninguna pantalla de esta parte lo consume y el diseño no lo dibuja,
 * así que inventarlo sería añadir contrato que nadie ha decidido.
 */
export interface UserApiShape {
  readonly full_name: string;
  readonly email: string;
  /** Ruta servida desde `apps/web/public/mock/` (R95): nada toca la red. */
  readonly avatar_url: string;
}

/**
 * El perfil público de otra persona. Deliberadamente **sin `email`**: ningún artboard
 * muestra el de Lucas Vidal, y un backend no revelaría el correo de quien invita a quien
 * recibe la invitación. Así no se inventa un dato que no existe en el diseño.
 */
export type UserSummaryApiShape = Omit<UserApiShape, 'email'>;

/** Quien usa la app: la persona autenticada en todas las pantallas firmadas. */
export const viewerMock: UserApiShape = {
  full_name: 'Sofía Martín',
  email: 'sofia.martin@correo.es',
  avatar_url: '/mock/avatar-sofia-martin.jpg',
};

/** Quien invita, en `/invite/$token` y en la copia de `Invite-States`. */
export const inviterMock: UserSummaryApiShape = {
  full_name: 'Lucas Vidal',
  avatar_url: '/mock/avatar-lucas-vidal.jpg',
};
