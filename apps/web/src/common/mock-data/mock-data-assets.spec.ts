// @vitest-environment node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { circlesMock } from './circles.mock';
import { inviterMock, viewerMock } from './users.mock';

/**
 * El contrato de R95, hecho mecánico: las imágenes del dataset son los assets del propio
 * diseño, servidos desde `apps/web/public/`, así que **ni el build, ni el suite, ni CI
 * dependen de la red**. Una ruta mal escrita o un fichero renombrado se ven aquí, y no
 * tres grupos más tarde como un hueco en una pantalla.
 */
const publicDir = fileURLToPath(new URL('../../../public/', import.meta.url));

const datasetAssetPaths = [
  viewerMock.avatar_url,
  inviterMock.avatar_url,
  ...circlesMock.map((circle) => circle.cover_url),
];

describe('the shared dataset asset paths', () => {
  it('names a local, root-relative path and never a remote URL', () => {
    for (const path of datasetAssetPaths) {
      expect(path).toMatch(/^\/[\w./-]+$/);
      expect(path).not.toMatch(/^https?:/);
    }
  });

  it('resolves every one of them to a file committed under apps/web/public/', () => {
    const missing = datasetAssetPaths.filter(
      (path) => !existsSync(join(publicDir, path)),
    );

    expect(missing).toStrictEqual([]);
  });
});
