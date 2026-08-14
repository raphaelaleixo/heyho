// Prints how many times each sheet has been downloaded.
//
// Reading the tally means listing every marker, which list() pages at 1000 —
// a handful of Blob advanced operations per run. That is the cost of an
// append-only counter, and it is the reason this is a script rather than a
// public route: api/ is served to the world, and browsing the store in the
// Vercel dashboard bills advanced operations of its own.
import { list } from '@vercel/blob';
import { countBySheet, DOWNLOAD_PREFIX, SHEETS } from '../lib/downloads.ts';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set. Run `vercel env pull .env.local` first.');
  process.exit(1);
}

const pathnames: string[] = [];
let cursor: string | undefined;

do {
  const page = await list({ prefix: `${DOWNLOAD_PREFIX}/`, cursor, limit: 1000 });
  pathnames.push(...page.blobs.map((blob) => blob.pathname));
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

const counts = countBySheet(pathnames);

for (const sheet of SHEETS) {
  console.log(`${sheet}  ${String(counts[sheet]).padStart(5)}`);
}
console.log(`total ${String(pathnames.length).padStart(4)}`);
