import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The smoke test renders the page component directly, so it needs only the React
// transform — not the Start/Nitro plugins. That keeps the suite hermetic (R56):
// no SSR pipeline, no route generation, no network.
export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
