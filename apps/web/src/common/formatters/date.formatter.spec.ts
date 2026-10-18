// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { formatLongDate } from './date.formatter';

/** Mediodía UTC: el día mostrado es el mismo de UTC−11 a UTC+11, que cubre toda zona
 * horaria en la que este suite se ejecuta de verdad. */
const atNoonUtc = (month: number, day: number): Date =>
  new Date(Date.UTC(2026, month - 1, day, 12));

describe('formatLongDate', () => {
  it('renders the invitation expiry as «24 de octubre»', () => {
    expect(formatLongDate(new Date('2026-10-24T12:00:00.000Z'))).toBe('24 de octubre');
  });

  it('names every month in Spanish', () => {
    const months = Array.from({ length: 12 }, (_, index) =>
      formatLongDate(atNoonUtc(index + 1, 15)),
    );

    expect(months).toStrictEqual([
      '15 de enero',
      '15 de febrero',
      '15 de marzo',
      '15 de abril',
      '15 de mayo',
      '15 de junio',
      '15 de julio',
      '15 de agosto',
      '15 de septiembre',
      '15 de octubre',
      '15 de noviembre',
      '15 de diciembre',
    ]);
  });

  it('never shows the year', () => {
    expect(formatLongDate(atNoonUtc(12, 31))).not.toMatch(/\d{4}/);
  });

  it('writes a single-digit day without a leading zero', () => {
    expect(formatLongDate(atNoonUtc(3, 1))).toBe('1 de marzo');
  });
});
