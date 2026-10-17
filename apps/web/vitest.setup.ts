import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library's automatic cleanup only registers itself when Vitest runs with
// globals enabled. We keep globals off (explicit imports in every spec), so the
// unmount is wired here instead — otherwise renders leak between tests.
afterEach(cleanup);
