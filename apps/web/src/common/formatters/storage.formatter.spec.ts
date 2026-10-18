// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { formatStorageUsage } from './storage.formatter';

const GB = 1_000_000_000;

describe('formatStorageUsage', () => {
  it('renders the profile panel label «3,1 GB de 5 GB usados · plan Gratis»', () => {
    expect(formatStorageUsage(3.1 * GB, 5 * GB, 'Gratis').label).toBe(
      '3,1 GB de 5 GB usados · plan Gratis',
    );
  });

  it('writes the decimal with a Spanish comma, never a point', () => {
    const { label } = formatStorageUsage(1.4 * GB, 5 * GB, 'Gratis');

    expect(label).toContain('1,4 GB');
    expect(label).not.toContain('1.4');
  });

  it('drops the decimal when the figure is a whole number of GB', () => {
    expect(formatStorageUsage(2 * GB, 5 * GB, 'Gratis').label).toBe(
      '2 GB de 5 GB usados · plan Gratis',
    );
  });

  it('counts GB in decimal units, as the 5 000 000 000-byte plan reads «5 GB»', () => {
    expect(formatStorageUsage(1 * GB, 5 * GB, 'Gratis').label).toContain(
      '1 GB de 5 GB usados',
    );
  });

  it('keeps one decimal at most, which is all the design ever shows', () => {
    expect(formatStorageUsage(3.14 * GB, 5 * GB, 'Gratis').label).toBe(
      '3,1 GB de 5 GB usados · plan Gratis',
    );
  });

  it('gives the Progress bar the artboard value, 62 %', () => {
    expect(formatStorageUsage(3.1 * GB, 5 * GB, 'Gratis').percent).toBe(62);
  });

  it('rounds the percentage to a whole number', () => {
    expect(formatStorageUsage(1 * GB, 3 * GB, 'Gratis').percent).toBe(33);
  });

  it('names the plan the caller passes, already in its Spanish form', () => {
    expect(formatStorageUsage(3.1 * GB, 5 * GB, 'Premium').label).toBe(
      '3,1 GB de 5 GB usados · plan Premium',
    );
  });
});
