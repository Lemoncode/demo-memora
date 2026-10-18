// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { circlesMock } from './circles.mock';

describe('circlesMock', () => {
  it('seeds the four circles of the desktop rail, in the artboard order', () => {
    expect(circlesMock.map((circle) => circle.name)).toStrictEqual([
      'Familia García',
      'Lisboa 2026',
      'Amigas de la uni',
      'Boda de Ana y Leo',
    ]);
  });

  it('carries name and cover image only — none of Part 2 (R48)', () => {
    for (const circle of circlesMock) {
      expect(Object.keys(circle).toSorted()).toStrictEqual(['cover_url', 'name']);
    }
  });
});
