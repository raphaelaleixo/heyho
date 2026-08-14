export const SHEETS = ['en', 'fr'] as const;

export type Sheet = (typeof SHEETS)[number];

export type SheetResult = { status: 'ok'; value: Sheet } | { status: 'error'; error: string };

// Every marker lives under this one folder, so counting is a single prefixed
// list() and nothing else in the store can be mistaken for a download.
export const DOWNLOAD_PREFIX = 'downloads';

export function isSheet(value: unknown): value is Sheet {
  return typeof value === 'string' && (SHEETS as readonly string[]).includes(value);
}

export function validateSheet(input: unknown): SheetResult {
  // The beacon posts to /api/download?sheet=en, and a repeated query parameter
  // arrives as an array. Only a lone, known slug counts — anything else would
  // let a stranger invent folders in the store by guessing the URL.
  if (!isSheet(input)) return { status: 'error', error: 'Unknown sheet.' };
  return { status: 'ok', value: input };
}

// The timestamp is the payload: the file is empty and its name is the record.
// Sorting by pathname sorts by time, so downloads-over-time needs no parsing
// beyond this, and a nonce keeps two downloads in the same millisecond apart.
export function downloadPathname(sheet: Sheet, at: Date, nonce: string): string {
  return `${DOWNLOAD_PREFIX}/${sheet}/${at.toISOString()}-${nonce}`;
}

export function countBySheet(pathnames: readonly string[]): Record<Sheet, number> {
  const counts = Object.fromEntries(SHEETS.map((sheet) => [sheet, 0])) as Record<Sheet, number>;

  for (const pathname of pathnames) {
    const [prefix, sheet] = pathname.split('/');
    if (prefix === DOWNLOAD_PREFIX && isSheet(sheet)) counts[sheet] += 1;
  }

  return counts;
}
