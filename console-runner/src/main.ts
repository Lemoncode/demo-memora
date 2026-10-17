import { confirm, select } from '@inquirer/prompts';
import { createMongoClient, resolveMongoUri } from '@memora/db';

import { checkConnection } from './actions/check-connection';
import { cleanDatabase } from './actions/clean-database';
import { loadSeedData } from './actions/seed-data';

/**
 * The runner's entry point and the **only** module that talks to
 * `@inquirer/prompts` (R45). Every operation lives in `src/actions/` as a plain
 * function that receives its client, so the operations are testable against a
 * double and the prompt layer stays a thin adapter.
 */

type RunnerClient = ReturnType<typeof createMongoClient>;

const CHECK_CONNECTION = 'check-connection';
const CLEAN_DATABASE = 'clean-database';
const LOAD_SEED_DATA = 'load-seed-data';
const EXIT = 'exit';

/**
 * `@inquirer/prompts` rejects with an `ExitPromptError` when the user presses
 * Ctrl+C. The package does not export the class, so it is matched by name — the
 * documented approach, and cheaper than depending on `@inquirer/core` just for a
 * type (R44).
 */
function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

async function closeClient(client: RunnerClient | undefined): Promise<void> {
  if (client === undefined) return;

  try {
    await client.close();
  } catch {
    // Closing is best-effort during shutdown: a failure here must not mask the
    // reason we are shutting down, and there is nothing left to recover.
  }
}

async function run(): Promise<void> {
  let client: RunnerClient | undefined;

  /**
   * Connects lazily and reuses the client. `resolveMongoUri` throws when
   * `MONGODB_URI` is missing; callers catch it so the menu survives (R42).
   */
  const connect = (): RunnerClient => {
    client ??= createMongoClient(resolveMongoUri(process.env));
    return client;
  };

  /**
   * Resolves the client for an operation, or reports why it cannot and hands back
   * `undefined` so the caller returns to the menu. This is the configuration-error
   * path (R42): the explicit `MONGODB_URI` message is printed and **no connection
   * is attempted**.
   */
  const connectOrReport = (): RunnerClient | undefined => {
    try {
      return connect();
    } catch (error) {
      console.error(`✖ ${error instanceof Error ? error.message : String(error)}\n`);
      return undefined;
    }
  };

  try {
    for (;;) {
      const choice = await select({
        message: '¿Qué quieres hacer?',
        choices: [
          { name: 'Comprobar conexión con Mongo', value: CHECK_CONNECTION },
          { name: 'Limpiar base de datos', value: CLEAN_DATABASE },
          { name: 'Cargar datos de prueba', value: LOAD_SEED_DATA },
          { name: 'Salir', value: EXIT },
        ],
      });

      if (choice === EXIT) break;

      if (choice === LOAD_SEED_DATA) {
        console.log(`${loadSeedData().message}\n`);
        continue;
      }

      if (choice === CHECK_CONNECTION) {
        const target = connectOrReport();
        if (target === undefined) continue;

        const result = await checkConnection(target);

        if (result.ok) {
          console.log(
            `✔ Conexión correcta con ${result.host}, base de datos «${result.database}».\n`,
          );
        } else {
          console.error(`✖ No se pudo conectar.\n${result.error}\n`);
        }

        continue;
      }

      if (choice === CLEAN_DATABASE) {
        const target = connectOrReport();
        if (target === undefined) continue;

        // Naming the database in the prompt is the point of the confirmation
        // (R47); reading its name is local and touches no server.
        const database = target.db().databaseName;

        const confirmed = await confirm({
          message: `Vas a BORRAR todos los datos de la base «${database}». ¿Seguro?`,
          default: false, // Enter cancels (R48).
        });

        const result = await cleanDatabase(target, confirmed);

        if (result.status === 'dropped') {
          console.log(`✔ Base de datos «${result.database}» borrada.\n`);
        } else if (result.status === 'cancelled') {
          console.log('Operación cancelada: no se ha borrado nada.\n');
        } else {
          console.error(`✖ No se pudo borrar la base de datos.\n${result.error}\n`);
        }

        continue;
      }
    }
  } catch (error) {
    if (isExitPromptError(error)) {
      // Ctrl+C: leave quietly. No stack trace, and the client is still closed.
      await closeClient(client);
      return;
    }

    await closeClient(client);
    throw error;
  }

  await closeClient(client);
}

await run();
