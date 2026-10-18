import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The smoke test renders the page component directly, so it needs only the React
// transform — not the Start/Nitro plugins. That keeps the suite hermetic (R56):
// no SSR pipeline, no route generation, no network.
//
// `scripts/` is collected too, so the token generator's unit tests run under the
// existing `test` gate (#11 R5/R6). jsdom is the default because most specs render
// components; the generator's spec opts out with `@vitest-environment node`.
export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}', 'scripts/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
