import type { Feedback } from './validate.js';

const SUBJECT_PREFIX = 'Hey Ho feedback — ';
const SUBJECT_MAX = 48;
const EXCERPT_MAX = SUBJECT_MAX - SUBJECT_PREFIX.length - 1; // room for the ellipsis

export interface MailOptions {
  to: string;
  from: string;
}

export interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  text: string;
  replyTo?: string;
}

function subjectFor(message: string): string {
  const oneLine = message.replace(/\s+/g, ' ').trim();
  const trimmed =
    oneLine.length <= EXCERPT_MAX ? oneLine : `${oneLine.slice(0, EXCERPT_MAX).trimEnd()}…`;
  return SUBJECT_PREFIX + trimmed;
}

export function buildFeedbackEmail(feedback: Feedback, options: MailOptions): EmailPayload {
  const text = [
    feedback.message,
    '',
    '—',
    `Age: ${feedback.age ?? '(not given)'}`,
    `Email: ${feedback.email ?? '(not given)'}`,
    '',
    'Sent from the reply card on heyho.ludoratory.com',
  ].join('\n');

  return {
    to: options.to,
    from: options.from,
    subject: subjectFor(feedback.message),
    text,
    ...(feedback.email && { replyTo: feedback.email }),
  };
}
