import { dropDatabase, type DroppableClient } from '@memora/db';

/** Outcome of the destructive operation. */
export type CleanResult =
  | { status: 'dropped'; database: string }
  | { status: 'cancelled' }
  | { status: 'failed'; error: string };

/**
 * Drops the database — the one destructive operation in this delivery.
 *
 * `confirmed` is passed in rather than asked for here: the prompt lives in the menu
 * layer (R45), which keeps this function testable and makes the guard explicit at
 * the call site.
 */
export async function cleanDatabase(
  client: DroppableClient,
  confirmed: boolean,
): Promise<CleanResult> {
  // Guard first, before anything touches the client (R50).
  if (!confirmed) return { status: 'cancelled' };

  try {
    const { database } = await dropDatabase(client);

    return { status: 'dropped', database };
  } catch (error) {
    // Reported, not thrown: a failed drop must leave the menu usable (R51).
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
