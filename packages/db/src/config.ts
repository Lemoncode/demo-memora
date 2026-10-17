/** The environment record `resolveMongoUri` reads from. */
export type EnvRecord = Record<string, string | undefined>;

export const MONGODB_URI_VAR = 'MONGODB_URI';

/** The canonical local URI, quoted in the error so the fix is obvious (R28, R31). */
const EXAMPLE_URI = 'mongodb://localhost:27017/memora';

/**
 * Resolves the MongoDB connection string from the given environment record.
 *
 * Pure by design (R30): it never touches `process.env` itself and never reads a
 * file, so callers decide what environment an operation runs against.
 */
export function resolveMongoUri(env: EnvRecord): string {
  const value = env[MONGODB_URI_VAR]?.trim();

  if (value === undefined || value === '') {
    throw new Error(
      `${MONGODB_URI_VAR} no está definida. Copia .env.example a .env en la raíz del ` +
        `repositorio y ajusta el valor (por ejemplo ${EXAMPLE_URI}).`,
    );
  }

  return value;
}
