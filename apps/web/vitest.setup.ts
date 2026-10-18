import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// React sólo activa su red de «update not wrapped in act(...)» cuando esta bandera
// está puesta. El `act` envuelto de Testing Library la pone y la restaura en cada
// llamada, pero un spec que importa `act` de `'react'` directamente la encuentra sin
// poner y React avisa — ocho veces en este suite — y, peor, el resto del suite se
// queda sin esa red. Se pone aquí, para todo el entorno de test.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Testing Library's automatic cleanup only registers itself when Vitest runs with
// globals enabled. We keep globals off (explicit imports in every spec), so the
// unmount is wired here instead — otherwise renders leak between tests.
afterEach(cleanup);
