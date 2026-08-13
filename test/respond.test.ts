import { describe, expect, it } from 'vitest';
import { errorPage, prefersHtml, thankYouPage } from '../lib/respond.js';

describe('prefersHtml', () => {
  it('is true for a plain browser form post', () => {
    expect(prefersHtml('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')).toBe(true);
  });

  it('is false for a fetch asking for JSON', () => {
    expect(prefersHtml('application/json')).toBe(false);
  });

  it('is false when the header is missing', () => {
    expect(prefersHtml(undefined)).toBe(false);
  });
});

describe('thankYouPage', () => {
  it('is a complete HTML document', () => {
    const html = thankYouPage();
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('</html>');
  });

  it('thanks the reader and offers the way back', () => {
    expect(thankYouPage()).toContain('Thank you');
    expect(thankYouPage()).toContain('href="/"');
  });
});

describe('errorPage', () => {
  it('shows the reason it was rejected', () => {
    expect(errorPage('Please write a message.')).toContain('Please write a message.');
  });

  it('escapes HTML in the reason', () => {
    expect(errorPage('<script>alert(1)</script>')).not.toContain('<script>alert(1)</script>');
  });
});
