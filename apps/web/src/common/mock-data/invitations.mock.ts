import { inviterMock, type UserSummaryApiShape } from './users.mock';

/**
 * La invitación de `/invite/$token`, en forma de respuesta de API (R39).
 *
 * Códigos de estado del backend, no el vocabulario `?estado=` de la URL: ese vocabulario
 * es castellano (`caducada`, `invalida`, `ya-miembro`) y lo resuelve el `business` del pod
 * `invite`, que lo traduce a uno de estos códigos; el mapper los pasa a su enum de front
 * (R43). Los cuatro salen de los estados que el diseño dibuja: el camino normal de
 * `Invite-M` / `Invite-D` y las tres tarjetas de `Invite-States`.
 */
export type InvitationStateCode = 'pending' | 'expired' | 'invalid' | 'already_member';

export interface InvitationApiShape {
  readonly token: string;
  readonly state_code: InvitationStateCode;
  /** ISO 8601. Se muestra «24 de octubre» — sin año — vía `formatLongDate` (R43). */
  readonly expires_at: string;
  readonly circle_name: string;
  readonly inviter: UserSummaryApiShape;
}

/**
 * La invitación en su camino normal. `expires_at` es el «24 de octubre» que `Invite-M`,
 * `Invite-D` y la tarjeta «Caducada» de `Invite-States` nombran. A mediodía UTC: medido,
 * así el día mostrado sale «24 de octubre» de UTC−11 a UTC+11 — en UTC+12…+14 sale 25,
 * porque `formatLongDate` formatea en la zona de quien mira a propósito (ver su doc).
 *
 * `circle_name` repite el literal «Familia García» en lugar de referenciar
 * `circlesMock[0]`: los artboards reutilizan el nombre, pero el diseño no declara que la
 * invitación apunte al primer círculo del raíl, y un backend sirve estas dos cosas por
 * endpoints distintos.
 */
export const invitationMock: InvitationApiShape = {
  token: 'f3a9c17e4b2d',
  state_code: 'pending',
  expires_at: '2026-10-24T12:00:00.000Z',
  circle_name: 'Familia García',
  inviter: inviterMock,
};
