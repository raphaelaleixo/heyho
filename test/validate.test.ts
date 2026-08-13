import { describe, expect, it } from 'vitest';
import { LIMITS, validateFeedback } from '../lib/validate.js';

describe('validateFeedback', () => {
  it('accepts a message on its own', () => {
    const result = validateFeedback({ message: 'My kid loved it!' });
    expect(result).toEqual({ status: 'ok', value: { message: 'My kid loved it!' } });
  });

  it('trims surrounding whitespace', () => {
    const result = validateFeedback({ message: '  spaced out  ' });
    expect(result).toEqual({ status: 'ok', value: { message: 'spaced out' } });
  });

  it('keeps the optional name and email when given', () => {
    const result = validateFeedback({
      message: 'Great',
      name: 'Raphael',
      email: 'parent@example.com',
    });
    expect(result).toEqual({
      status: 'ok',
      value: { message: 'Great', name: 'Raphael', email: 'parent@example.com' },
    });
  });

  it('rejects a missing message', () => {
    expect(validateFeedback({}).status).toBe('error');
  });

  it('rejects a whitespace-only message', () => {
    expect(validateFeedback({ message: '   \n  ' }).status).toBe('error');
  });

  it('rejects a message over the limit', () => {
    const result = validateFeedback({ message: 'x'.repeat(LIMITS.message + 1) });
    expect(result.status).toBe('error');
  });

  it('accepts a message exactly at the limit', () => {
    const result = validateFeedback({ message: 'x'.repeat(LIMITS.message) });
    expect(result.status).toBe('ok');
  });

  it('rejects a malformed email', () => {
    expect(validateFeedback({ message: 'Hi', email: 'not-an-email' }).status).toBe('error');
  });

  it('ignores an empty email rather than rejecting it', () => {
    const result = validateFeedback({ message: 'Hi', email: '   ' });
    expect(result).toEqual({ status: 'ok', value: { message: 'Hi' } });
  });

  it('rejects an over-long name', () => {
    expect(validateFeedback({ message: 'Hi', name: 'y'.repeat(LIMITS.name + 1) }).status).toBe('error');
  });

  it('reports honeypot hits separately from errors', () => {
    const result = validateFeedback({ message: 'Buy pills', website: 'http://spam.example' });
    expect(result).toEqual({ status: 'honeypot' });
  });

  it('treats non-string fields as absent', () => {
    expect(validateFeedback({ message: 42 }).status).toBe('error');
    expect(validateFeedback({ message: 'Hi', name: 5, email: null })).toEqual({
      status: 'ok',
      value: { message: 'Hi' },
    });
  });

  it('survives a non-object body', () => {
    expect(validateFeedback(undefined).status).toBe('error');
    expect(validateFeedback('nope').status).toBe('error');
  });
});
