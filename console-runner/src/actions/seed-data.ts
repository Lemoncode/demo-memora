/** Outcome of the seed operation. Only ever pending in this delivery (R43). */
export interface SeedResult {
  status: 'pending';
  message: string;
}

/**
 * The reserved slot for real seed data. It takes **no client on purpose**: the
 * domain model does not exist yet, so there is nothing honest to write, and an
 * operation that cannot reach Mongo cannot pretend it did (R43). The menu entry is
 * deliberately visible — a signposted gap communicates intent, where a missing
 * entry would look like an oversight.
 */
export function loadSeedData(): SeedResult {
  return {
    status: 'pending',
    message:
      'TODO: los datos de prueba llegarán con el modelo de dominio. No se ha escrito nada en la base de datos.',
  };
}
