import { describe, expect, it } from 'vitest';
import { buildFeedbackEmail } from '../lib/mail.js';

const options = { to: 'author@example.com', from: 'onboarding@resend.dev' };

describe('buildFeedbackEmail', () => {
  it('addresses the mail from the configured pair', () => {
    const mail = buildFeedbackEmail({ message: 'Lovely sheet' }, options);
    expect(mail.to).toBe('author@example.com');
    expect(mail.from).toBe('onboarding@resend.dev');
  });

  it('builds a subject from the first words of the message', () => {
    const mail = buildFeedbackEmail(
      { message: 'We used this at Hellfest and my son filled every box' },
      options,
    );
    expect(mail.subject).toBe('Ho Hey feedback — We used this at Hellfest and…');
  });

  it('uses the whole message as the subject when it is short', () => {
    const mail = buildFeedbackEmail({ message: 'Brilliant, thanks' }, options);
    expect(mail.subject).toBe('Ho Hey feedback — Brilliant, thanks');
  });

  it('collapses newlines in the subject', () => {
    const mail = buildFeedbackEmail({ message: 'Great\nfun\nthanks' }, options);
    expect(mail.subject).toBe('Ho Hey feedback — Great fun thanks');
  });

  it('sets reply-to when the parent left an address', () => {
    const mail = buildFeedbackEmail({ message: 'Hi', email: 'parent@example.com' }, options);
    expect(mail.replyTo).toBe('parent@example.com');
  });

  it('omits reply-to entirely when no address was given', () => {
    const mail = buildFeedbackEmail({ message: 'Hi' }, options);
    expect(mail.replyTo).toBeUndefined();
  });

  it('puts the message, age and email in the body', () => {
    const mail = buildFeedbackEmail(
      { message: 'Kids loved it', name: 'Raphael', email: 'parent@example.com' },
      options,
    );
    expect(mail.text).toContain('Kids loved it');
    expect(mail.text).toContain('Raphael');
    expect(mail.text).toContain('parent@example.com');
  });

  it('says so plainly when age and email are missing', () => {
    const mail = buildFeedbackEmail({ message: 'Kids loved it' }, options);
    expect(mail.text).toContain('Name: (not given)');
    expect(mail.text).toContain('Email: (not given)');
  });

  it('does not add ellipsis for a message at the excerpt limit', () => {
    const mail = buildFeedbackEmail(
      { message: 'Exactly twenty nine chars now' },
      options,
    );
    expect(mail.subject).toBe('Ho Hey feedback — Exactly twenty nine chars now');
    expect(mail.subject).not.toContain('…');
  });

  it('adds ellipsis for a message beyond the excerpt limit', () => {
    const mail = buildFeedbackEmail(
      { message: 'Exactly twenty nine chars now!' },
      options,
    );
    expect(mail.subject).toBe('Ho Hey feedback — Exactly twenty nine chars now…');
    expect(mail.subject).toContain('…');
  });
});
