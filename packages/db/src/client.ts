import { MongoClient } from 'mongodb';

/**
 * How long the driver may spend looking for a reachable server before giving up.
 * The driver's own default is 30 s, which makes a maintenance tool look hung when
 * Mongo simply is not running; 5 s is short enough to read as "it's down" (R32).
 */
export const SERVER_SELECTION_TIMEOUT_MS = 5_000;

/**
 * Builds a Mongo client for `uri`. The constructor does not connect — the first
 * operation does — so this is safe to call before knowing the server is up.
 */
export function createMongoClient(uri: string): MongoClient {
  return new MongoClient(uri, {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  });
}

/**
 * The slices of a Mongo client the maintenance primitives actually need, split per
 * capability so each primitive asks for the least it can.
 *
 * A real `MongoClient` satisfies them structurally, and so does a hand-written
 * double — which is what keeps the suite hermetic (R56): no socket, no container.
 * `db()` is always called with no argument, so the database is whichever one the
 * connection string encodes (R33: no hard-coded database name).
 */
interface HostsCarrier {
  readonly options: { readonly hosts: readonly { toString(): string }[] };
}

export interface PingableClient extends HostsCarrier {
  db(): {
    readonly databaseName: string;
    command(document: Record<string, unknown>): Promise<unknown>;
  };
}

export interface DroppableClient {
  db(): {
    readonly databaseName: string;
    dropDatabase(): Promise<boolean>;
  };
}

/** Everything the primitives need together — what the runner holds. */
export type MongoClientLike = PingableClient & DroppableClient;

/** What the runner reports after a successful connectivity check (R40). */
export interface PingResult {
  host: string;
  database: string;
}

/** What the runner reports after dropping the database (R49). */
export interface DropResult {
  database: string;
}

/** Issues a `ping` against the URI's database and reports what it reached. */
export async function pingDatabase(client: PingableClient): Promise<PingResult> {
  const db = client.db();

  await db.command({ ping: 1 });

  return {
    host: client.options.hosts.map((host) => host.toString()).join(','),
    database: db.databaseName,
  };
}

/**
 * Drops the database the connection string points at. Destructive and
 * unconditional: the confirmation that guards it lives in the runner (R47, R49).
 */
export async function dropDatabase(client: DroppableClient): Promise<DropResult> {
  const db = client.db();

  await db.dropDatabase();

  return { database: db.databaseName };
}
