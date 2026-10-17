// @memora/db — the only place in the repository that resolves MONGODB_URI or
// constructs a Mongo client (R29). Consumed as TypeScript source: no build step and
// no emitted dist/ (R36).

export { MONGODB_URI_VAR, resolveMongoUri } from './config';
export type { EnvRecord } from './config';

export {
  SERVER_SELECTION_TIMEOUT_MS,
  createMongoClient,
  dropDatabase,
  pingDatabase,
} from './client';
export type {
  DropResult,
  DroppableClient,
  MongoClientLike,
  PingableClient,
  PingResult,
} from './client';
