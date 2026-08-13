export const LIMITS = {
  message: 2000,
  age: 40,
  email: 200,
} as const;

export interface Feedback {
  message: string;
  age?: string;
  email?: string;
}

export type ValidationResult =
  | { status: 'ok'; value: Feedback }
  | { status: 'honeypot' }
  | { status: 'error'; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateFeedback(input: unknown): ValidationResult {
  const body = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;

  // Honeypot: a real person never sees this field, so anything in it is a bot.
  // Reported separately so the caller can answer 200 without sending mail —
  // bots get no signal that they were caught.
  if (str(body.website) !== '') return { status: 'honeypot' };

  const message = str(body.message);
  if (message === '') return { status: 'error', error: 'Please write a message.' };
  if (message.length > LIMITS.message) {
    return { status: 'error', error: 'That message is a bit too long — could you trim it?' };
  }

  const age = str(body.age);
  if (age.length > LIMITS.age) return { status: 'error', error: 'That age is too long.' };

  const email = str(body.email);
  if (email.length > LIMITS.email) return { status: 'error', error: 'That email is too long.' };
  if (email !== '' && !EMAIL_PATTERN.test(email)) {
    return { status: 'error', error: "That email address doesn't look right." };
  }

  return {
    status: 'ok',
    value: { message, ...(age !== '' && { age }), ...(email !== '' && { email }) },
  };
}
