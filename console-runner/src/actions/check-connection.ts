import { pingDatabase, type PingableClient } from '@memora/db';

/** Outcome of a connectivity check. Never an exception — the menu must survive. */
export type CheckResult =
  { ok: true; host: string; database: string } | { ok: false; error: string };

/**
 * Pings Mongo and reports what it reached (R40). Prompt-free and client-injected
 * (R45), so it is tested against a double rather than a live server.
 */
export async function checkConnection(client: PingableClient): Promise<CheckResult> {
  try {
    const { host, database } = await pingDatabase(client);

    return { ok: true, host, database };
  } catch (error) {
    // The driver's own message is kept verbatim — it says what actually went wrong
    // — and the hint names the one command that fixes the common case (R41).
    const message = error instanceof Error ? error.message : String(error);

    return {
      ok: false,
      error: `${message}\n¿Está Mongo levantado? Prueba con \`pnpm db:up\`.`,
    };
  }
}
