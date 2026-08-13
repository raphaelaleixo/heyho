import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { buildFeedbackEmail } from '../lib/mail.js';
import { errorPage, prefersHtml, thankYouPage } from '../lib/respond.js';
import { validateFeedback } from '../lib/validate.js';

const DEFAULT_FROM = 'onboarding@resend.dev';
const SEND_FAILED = "That didn't send — please try again in a moment.";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const html = prefersHtml(req.headers.accept);

  const fail = (status: number, error: string) =>
    html
      ? res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').send(errorPage(error))
      : res.status(status).json({ ok: false, error });

  const succeed = () =>
    html
      ? res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(thankYouPage())
      : res.status(200).json({ ok: true });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(405, 'Method not allowed.');
  }

  const result = validateFeedback(req.body);

  // A bot filled the hidden field. Answer exactly as if it had worked, so it
  // learns nothing, and send no mail.
  if (result.status === 'honeypot') return succeed();
  if (result.status === 'error') return fail(400, result.error);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO;
  if (!apiKey || !to) {
    console.error('feedback: RESEND_API_KEY or FEEDBACK_TO is not set');
    return fail(500, SEND_FAILED);
  }

  const mail = buildFeedbackEmail(result.value, {
    to,
    from: process.env.FEEDBACK_FROM || DEFAULT_FROM,
  });

  try {
    const { error } = await new Resend(apiKey).emails.send(mail);
    if (error) {
      console.error('feedback: resend rejected the message', error);
      return fail(500, SEND_FAILED);
    }
  } catch (cause) {
    console.error('feedback: resend threw', cause);
    return fail(500, SEND_FAILED);
  }

  return succeed();
}
