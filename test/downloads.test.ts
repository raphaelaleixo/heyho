import { describe, expect, it } from 'vitest';
import { countBySheet, downloadPathname, validateSheet } from '../lib/downloads.js';

describe('validateSheet', () => {
  it('accepts a known sheet', () => {
    expect(validateSheet('en')).toEqual({ status: 'ok', value: 'en' });
    expect(validateSheet('fr')).toEqual({ status: 'ok', value: 'fr' });
  });

  it('rejects a sheet it does not know', () => {
    expect(validateSheet('de').status).toBe('error');
  });

  it('rejects a repeated query parameter', () => {
    expect(validateSheet(['en', 'fr']).status).toBe('error');
  });

  it('rejects a missing sheet', () => {
    expect(validateSheet(undefined).status).toBe('error');
  });

  it('rejects a path that would escape the prefix', () => {
    expect(validateSheet('../../secrets').status).toBe('error');
  });
});

describe('downloadPathname', () => {
  it('files the marker under the sheet, named for the moment', () => {
    const at = new Date('2026-08-14T09:30:00.000Z');
    expect(downloadPathname('en', at, 'a1b2c3d4')).toBe(
      'downloads/en/2026-08-14T09:30:00.000Z-a1b2c3d4',
    );
  });

  it('sorts by time when sorted by name', () => {
    const earlier = downloadPathname('en', new Date('2026-08-14T09:00:00.000Z'), 'zzzzzzzz');
    const later = downloadPathname('en', new Date('2026-08-14T10:00:00.000Z'), 'aaaaaaaa');
    expect([later, earlier].sort()).toEqual([earlier, later]);
  });

  it('keeps two downloads in the same millisecond apart', () => {
    const at = new Date('2026-08-14T09:30:00.000Z');
    expect(downloadPathname('en', at, 'aaaaaaaa')).not.toBe(downloadPathname('en', at, 'bbbbbbbb'));
  });
});

describe('countBySheet', () => {
  it('counts each sheet separately', () => {
    const counts = countBySheet([
      'downloads/en/2026-08-14T09:00:00.000Z-aaaaaaaa',
      'downloads/en/2026-08-14T09:00:01.000Z-bbbbbbbb',
      'downloads/fr/2026-08-14T09:00:02.000Z-cccccccc',
    ]);
    expect(counts).toEqual({ en: 2, fr: 1 });
  });

  it('reports zero for a sheet nobody has downloaded', () => {
    expect(countBySheet([])).toEqual({ en: 0, fr: 0 });
  });

  it('ignores anything outside the downloads prefix', () => {
    expect(countBySheet(['other/en/2026-08-14T09:00:00.000Z-aaaaaaaa'])).toEqual({ en: 0, fr: 0 });
  });

  it('ignores a folder that is not a sheet', () => {
    expect(countBySheet(['downloads/de/2026-08-14T09:00:00.000Z-aaaaaaaa'])).toEqual({
      en: 0,
      fr: 0,
    });
  });
});
