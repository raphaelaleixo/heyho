import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { downloadPathname, validateSheet } from '../lib/downloads.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const sheet = validateSheet(req.query.sheet);
  if (sheet.status === 'error') return res.status(400).end();

  // One empty blob per download, named for the moment it happened. Counting is
  // a list() over the prefix rather than a read-modify-write, so two downloads
  // landing together can never overwrite each other's tally.
  //
  // Nothing in here is allowed to cost anyone their sheet. The browser has
  // already started the PDF and never reads this response, so a missing token,
  // a rejected write or a blown Hobby quota loses a count and nothing else.
  // Blob refuses an empty body, so the marker holds the slug it is already
  // filed under — two bytes, and a stray blob explains itself.
  try {
    await put(downloadPathname(sheet.value, new Date(), randomUUID().slice(0, 8)), sheet.value, {
      access: 'private',
      contentType: 'text/plain',
    });
  } catch (cause) {
    console.error('download: could not record the download', cause);
  }

  return res.status(204).end();
}
