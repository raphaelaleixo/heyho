# Hey Ho, Let's Find! Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a one-page site at `heyho.ludoratory.com` that gives away a printable kids' festival scavenger hunt and emails the author any feedback a parent writes.

**Architecture:** A hand-written static page (`index.html` + `styles.css` + one small `app.js`) served from the repo root by Vercel, plus a single serverless function at `api/feedback.ts` that validates a submission and sends it through Resend. All logic worth testing lives in pure modules under `lib/`; the function is a thin shell around them. There is no bundler, no framework, and no database.

**Tech Stack:** Plain HTML/CSS/JS (ES modules, no build step) · TypeScript for `api/` and `lib/` (compiled by Vercel, type-checked locally) · Resend for email · Vitest for unit tests · Vercel for hosting · self-hosted Sour Gummy + Jua woff2 · `pdftoppm` for PDF previews · headless Chrome for the OG image.

**Design spec:** `docs/superpowers/specs/2026-08-13-heyho-landing-design.md` — read it before starting. Where this plan and the spec disagree, the spec wins and the plan is wrong.

## Global Constraints

- **No build step for the page.** `index.html`, `styles.css`, and `app.js` are served as written. Never introduce Vite, React, MUI, i18next, `react-gameroom`, or Firebase — those are the other projects' defaults and are deliberately rejected here.
- **Node 22, ESM.** `package.json` has `"type": "module"`; TypeScript uses `module`/`moduleResolution: NodeNext`, so **relative imports inside `api/` and `lib/` must carry a `.js` extension** even though the files are `.ts`.
- **Nothing goes in `api/` except real endpoints.** Vercel publishes every file there as a public route. Shared code lives in `lib/`.
- **The author's email address never appears in committed files** — only in the `FEEDBACK_TO` environment variable. `.env` is gitignored; `.env.example` holds names with empty values.
- **Palette (exact):** ink `#141414`, paper `#f7f4e9`, pink `#ff2d6f`, yellow `#ffd93d`, green `#39e08a`, cyan `#4dd0f7`.
- **Type roles:** `Sour Gummy` weight 900 for title, section headings, sticker labels, buttons. `Jua` for subtitles, body copy, form. Both self-hosted from `assets/fonts/`. No request to Google Fonts at runtime.
- **Copy is English only.** No i18n machinery. The *sheet* may later exist in more languages; the page does not.
- **Accessibility is not optional:** DOM order matches reading order despite rotations, `<label>` elements never replaced by placeholders, visible focus rings on both dark and paper backgrounds, alt text on the preview images, body text at 4.5:1 contrast.
- **Commit after every task**, using the message given in that task's final step.

---

### Task 1: Tooling and feedback validation

Sets up the whole toolchain and delivers the first pure module. Everything later depends on this.

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `CLAUDE.md`
- Create: `lib/validate.ts`
- Test: `test/validate.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `validateFeedback(input: unknown): ValidationResult` and the `LIMITS` constant, both imported by Task 2 and Task 3.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "heyho",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Hey Ho, Let's Find! — a free printable scavenger hunt for kids at music festivals",
  "scripts": {
    "dev": "vercel dev",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "fonts": "node scripts/fetch-fonts.mjs",
    "previews": "bash scripts/render-previews.sh",
    "og": "bash scripts/render-og.sh"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install resend
npm install -D vitest typescript @types/node @vercel/node
```

Do not pin versions by hand — take whatever `npm` resolves and let it write the ranges.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["api", "lib", "test", "scripts"]
}
```

- [ ] **Step 4: Create `.env.example`**

```bash
# Resend API key — https://resend.com/api-keys
RESEND_API_KEY=

# Where feedback is delivered. Must be the address that owns the Resend
# account while FEEDBACK_FROM is still onboarding@resend.dev.
FEEDBACK_TO=

# Optional. Defaults to onboarding@resend.dev, which needs no domain
# verification as long as FEEDBACK_TO is the account owner's address.
FEEDBACK_FROM=
```

- [ ] **Step 5: Create `CLAUDE.md`**

````markdown
# CLAUDE.md — Hey Ho, Let's Find!

A one-page site that gives away a printable scavenger hunt for kids at music
festivals, and emails the author any feedback a parent writes.

**This is not a game.** It is a document with a download button and a reply
card. That is the deliberate departure from every other project in
`LudoratoryProjects/`.

## Deliberate deviations from the parent CLAUDE.md

| Parent default | Here | Why |
| --- | --- | --- |
| Vite + React + TypeScript | Hand-written HTML/CSS, no build step | One static page |
| MUI | Hand-written CSS | The look is a hand-made zine; a component library fights it |
| i18next | None | Page copy is English only |
| `react-gameroom` | None | No rooms, no players, no real-time anything |
| Firebase | One Vercel function + Resend | The only server need is "email me this message" |
| SPA rewrites in `vercel.json` | No `vercel.json` | Single page, nothing to rewrite |

Do not "fix" these by aligning with the parent stack.

## Layout

- `index.html`, `styles.css`, `app.js` — the entire page, served as written
- `api/feedback.ts` — the only endpoint. **Every file in `api/` becomes a public
  route**, so shared code lives in `lib/`
- `lib/` — pure, unit-tested modules: validation, email composition, responses
- `scripts/` — asset generation: fonts, PDF previews, OG image
- `assets/` — the PDF, its preview renders, fonts, the social card

## Commands

```sh
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run dev       # vercel dev (needs `vercel link` once)
npm run fonts     # re-download the self-hosted woff2 files
npm run previews  # re-render page-1.png / page-2.png from the PDF
npm run og        # re-render the 1200×630 social card
```

## When the final PDF arrives

Replace `assets/heyho-en.pdf`, run `npm run previews`, commit both the PDF and
the regenerated PNGs. The preview images must never drift from the actual file.

## Sheets in other languages

The download area is a list of variants. A French sheet means one more PDF in
`assets/`, one more `<li>` in the download list, and one more preview render —
**not** a translated page.
````

- [ ] **Step 6: Write the failing test**

Create `test/validate.test.ts`:

```ts
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

  it('keeps the optional age and email when given', () => {
    const result = validateFeedback({
      message: 'Great',
      age: '4 and 7',
      email: 'parent@example.com',
    });
    expect(result).toEqual({
      status: 'ok',
      value: { message: 'Great', age: '4 and 7', email: 'parent@example.com' },
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

  it('rejects an over-long age', () => {
    expect(validateFeedback({ message: 'Hi', age: 'y'.repeat(LIMITS.age + 1) }).status).toBe('error');
  });

  it('reports honeypot hits separately from errors', () => {
    const result = validateFeedback({ message: 'Buy pills', website: 'http://spam.example' });
    expect(result).toEqual({ status: 'honeypot' });
  });

  it('treats non-string fields as absent', () => {
    expect(validateFeedback({ message: 42 }).status).toBe('error');
    expect(validateFeedback({ message: 'Hi', age: 5, email: null })).toEqual({
      status: 'ok',
      value: { message: 'Hi' },
    });
  });

  it('survives a non-object body', () => {
    expect(validateFeedback(undefined).status).toBe('error');
    expect(validateFeedback('nope').status).toBe('error');
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "../lib/validate.js"`.

- [ ] **Step 8: Write the implementation**

Create `lib/validate.ts`:

```ts
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
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 13 tests.

- [ ] **Step 10: Verify types**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json .env.example CLAUDE.md lib/validate.ts test/validate.test.ts
git commit -m "feat: validate feedback submissions"
```

---

### Task 2: Email composition and response bodies

Two more pure modules: what the email looks like, and what the endpoint answers with. Splitting these out keeps the endpoint itself untestable-but-trivial.

**Files:**
- Create: `lib/mail.ts`
- Create: `lib/respond.ts`
- Test: `test/mail.test.ts`
- Test: `test/respond.test.ts`

**Interfaces:**
- Consumes: `Feedback` from `lib/validate.ts`.
- Produces: `buildFeedbackEmail(feedback, options): EmailPayload`, `prefersHtml(accept): boolean`, `thankYouPage(): string`, `errorPage(message): string` — all used by Task 3.

- [ ] **Step 1: Write the failing test for email composition**

Create `test/mail.test.ts`:

```ts
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
    expect(mail.subject).toBe('Hey Ho feedback — We used this at Hellfest and…');
  });

  it('uses the whole message as the subject when it is short', () => {
    const mail = buildFeedbackEmail({ message: 'Brilliant, thanks' }, options);
    expect(mail.subject).toBe('Hey Ho feedback — Brilliant, thanks');
  });

  it('collapses newlines in the subject', () => {
    const mail = buildFeedbackEmail({ message: 'Great\nfun\nthanks' }, options);
    expect(mail.subject).toBe('Hey Ho feedback — Great fun thanks');
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
      { message: 'Kids loved it', age: '6', email: 'parent@example.com' },
      options,
    );
    expect(mail.text).toContain('Kids loved it');
    expect(mail.text).toContain('6');
    expect(mail.text).toContain('parent@example.com');
  });

  it('says so plainly when age and email are missing', () => {
    const mail = buildFeedbackEmail({ message: 'Kids loved it' }, options);
    expect(mail.text).toContain('Age: (not given)');
    expect(mail.text).toContain('Email: (not given)');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/mail.test.ts`
Expected: FAIL — cannot resolve `../lib/mail.js`.

- [ ] **Step 3: Implement email composition**

Create `lib/mail.ts`:

```ts
import type { Feedback } from './validate.js';

const SUBJECT_PREFIX = 'Hey Ho feedback — ';
const SUBJECT_MAX = 48;

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
    oneLine.length <= SUBJECT_MAX ? oneLine : `${oneLine.slice(0, SUBJECT_MAX).trimEnd()}…`;
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run test/mail.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Write the failing test for responses**

Create `test/respond.test.ts`:

```ts
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
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run test/respond.test.ts`
Expected: FAIL — cannot resolve `../lib/respond.js`.

- [ ] **Step 7: Implement the responses**

Create `lib/respond.ts`. These pages are only ever seen with JavaScript disabled, so they are deliberately plain — inline styles, no asset requests, but the palette and voice of the site.

```ts
export function prefersHtml(accept: string | undefined): boolean {
  return (accept ?? '').includes('text/html');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} · Hey Ho, Let's Find!</title>
</head>
<body style="margin:0;background:#f7f4e9;color:#141414;font:16px/1.6 system-ui,sans-serif">
<main style="max-width:32rem;margin:0 auto;padding:3rem 1.5rem">
${body}
<p style="margin-top:2rem"><a href="/" style="color:#141414">← Back to the sheet</a></p>
</main>
</body>
</html>`;
}

export function thankYouPage(): string {
  return page(
    'Thank you',
    `<h1 style="font-size:1.75rem;margin:0 0 1rem">Thank you!</h1>
<p style="margin:0">Your message is on its way to my inbox. If you left an email address, you might hear back.</p>`,
  );
}

export function errorPage(message: string): string {
  return page(
    'That did not send',
    `<h1 style="font-size:1.75rem;margin:0 0 1rem">That didn't send</h1>
<p style="margin:0">${escapeHtml(message)}</p>`,
  );
}
```

- [ ] **Step 8: Run the whole suite**

Run: `npm test && npm run typecheck`
Expected: PASS — 28 tests (13 validate + 8 mail + 7 respond), no type errors.

- [ ] **Step 9: Commit**

```bash
git add lib/mail.ts lib/respond.ts test/mail.test.ts test/respond.test.ts
git commit -m "feat: compose feedback email and no-JS responses"
```

---

### Task 3: The feedback endpoint

**Files:**
- Create: `api/feedback.ts`
- Test: `test/feedback.test.ts`

**Interfaces:**
- Consumes: `validateFeedback` (Task 1), `buildFeedbackEmail`, `prefersHtml`, `thankYouPage`, `errorPage` (Task 2).
- Produces: `POST /api/feedback`, consumed by the form in Task 7. Accepts JSON *or* URL-encoded form bodies (Vercel parses both into `req.body`). Answers `200 {ok:true}`, `400 {ok:false,error}`, `405`, or `500 {ok:false,error}` — or the equivalent HTML pages when the client is a browser form.

- [ ] **Step 1: Write the failing test**

Create `test/feedback.test.ts`. The Resend SDK is mocked at the module boundary — no network in tests.

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

const { default: handler } = await import('../api/feedback.js');

interface FakeRes {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  status(code: number): FakeRes;
  json(body: unknown): FakeRes;
  send(body: unknown): FakeRes;
  setHeader(key: string, value: string): FakeRes;
}

function mockRes(): FakeRes {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
    send(body: unknown) {
      res.body = body;
      return res;
    },
    setHeader(key: string, value: string) {
      res.headers[key] = value;
      return res;
    },
  };
  return res;
}

function mockReq(body: unknown, headers: Record<string, string> = {}, method = 'POST') {
  return { method, body, headers };
}

const call = (req: unknown, res: FakeRes) => handler(req as never, res as never);

describe('POST /api/feedback', () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ data: { id: 'mail_1' }, error: null });
    process.env.RESEND_API_KEY = 'test-key';
    process.env.FEEDBACK_TO = 'author@example.com';
    delete process.env.FEEDBACK_FROM;
  });

  it('sends the mail and answers ok', async () => {
    const res = mockRes();
    await call(mockReq({ message: 'My kid loved it' }), res);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({
      to: 'author@example.com',
      from: 'onboarding@resend.dev',
      subject: 'Hey Ho feedback — My kid loved it',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('honours FEEDBACK_FROM when it is set', async () => {
    process.env.FEEDBACK_FROM = 'hey@ludoratory.com';
    await call(mockReq({ message: 'Hi' }), mockRes());
    expect(send.mock.calls[0][0]).toMatchObject({ from: 'hey@ludoratory.com' });
  });

  it('rejects an invalid submission without sending anything', async () => {
    const res = mockRes();
    await call(mockReq({ message: '   ' }), res);

    expect(send).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'Please write a message.' });
  });

  it('answers a honeypot hit with a clean 200 and sends nothing', async () => {
    const res = mockRes();
    await call(mockReq({ message: 'Buy pills', website: 'http://spam.example' }), res);

    expect(send).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns an HTML thank-you page to a browser form post', async () => {
    const res = mockRes();
    await call(mockReq({ message: 'No JS here' }, { accept: 'text/html' }), res);

    expect(send).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(String(res.body)).toContain('Thank you');
    expect(res.headers['Content-Type']).toContain('text/html');
  });

  it('returns an HTML error page to a browser form post that fails validation', async () => {
    const res = mockRes();
    await call(mockReq({ message: '' }, { accept: 'text/html' }), res);

    expect(res.statusCode).toBe(400);
    expect(String(res.body)).toContain('Please write a message.');
  });

  it('rejects anything that is not a POST', async () => {
    const res = mockRes();
    await call(mockReq({}, {}, 'GET'), res);

    expect(res.statusCode).toBe(405);
    expect(res.headers['Allow']).toBe('POST');
    expect(send).not.toHaveBeenCalled();
  });

  it('answers 500 when Resend reports a failure', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'nope' } });
    const res = mockRes();
    await call(mockReq({ message: 'Hi' }), res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "That didn't send — please try again in a moment." });
  });

  it('answers 500 when Resend throws', async () => {
    send.mockRejectedValue(new Error('network down'));
    const res = mockRes();
    await call(mockReq({ message: 'Hi' }), res);

    expect(res.statusCode).toBe(500);
  });

  it('answers 500 when the server is not configured', async () => {
    delete process.env.FEEDBACK_TO;
    const res = mockRes();
    await call(mockReq({ message: 'Hi' }), res);

    expect(send).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/feedback.test.ts`
Expected: FAIL — cannot resolve `../api/feedback.js`.

- [ ] **Step 3: Implement the endpoint**

Create `api/feedback.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test && npm run typecheck`
Expected: PASS — 38 tests (28 from earlier tasks + 10 here), no type errors.

Two things that may need adjusting against the versions `npm` actually installed:

- If `res.status(...).setHeader(...)` trips the `@vercel/node` types, chain it the other way round (`res.setHeader(...); res.status(...).send(...)`) rather than casting to `any`.
- If TypeScript rejects `replyTo` on the Resend payload, check `CreateEmailOptions` in the installed SDK — versions before v4 name that field `reply_to`. Rename it in `lib/mail.ts` **and** in `test/mail.test.ts` if so.

- [ ] **Step 5: Commit**

```bash
git add api/feedback.ts test/feedback.test.ts
git commit -m "feat: add feedback endpoint backed by Resend"
```

---

### Task 4: Assets — fonts, the PDF, and its previews

No unit tests here; the deliverable is files on disk, verified by inspection. Do not start the page before this lands, or the layout gets built against fallback fonts and imaginary images.

**Files:**
- Create: `scripts/fetch-fonts.mjs`
- Create: `scripts/render-previews.sh`
- Create: `assets/heyho-en.pdf` (copied placeholder)
- Generated: `assets/fonts/*.woff2`, `assets/fonts/fonts.css`, `assets/page-1.png`, `assets/page-2.png`

**Interfaces:**
- Produces: `assets/fonts/fonts.css` declaring the families `Sour Gummy` (weights 100–900) and `Jua` (400); `assets/page-1.png` and `assets/page-2.png`; `assets/heyho-en.pdf`. All referenced by Tasks 5–7.

- [ ] **Step 1: Write the font fetcher**

Create `scripts/fetch-fonts.mjs`. Google's CSS API returns different files per browser and per unicode subset; this asks as Chrome (so it gets woff2) and keeps only the latin subsets.

```js
#!/usr/bin/env node
// Downloads the woff2 files for Sour Gummy + Jua and writes a local
// @font-face stylesheet, so the page makes no request to Google at runtime.
// Re-run with `npm run fonts` if the families ever change.
import { mkdir, writeFile } from 'node:fs/promises';

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Jua&family=Sour+Gummy:wdth,wght@100,100..900&display=swap';
const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const OUT_DIR = new URL('../assets/fonts/', import.meta.url);

// Only these two subsets carry the characters the page actually uses.
const SUBSETS = [
  { name: 'latin', marker: 'U+0000-00FF' },
  { name: 'latin-ext', marker: 'U+0100-02BA' },
];

const field = (block, name) => new RegExp(`${name}: ([^;]+);`).exec(block)?.[1]?.trim();

const css = await fetch(CSS_URL, { headers: { 'User-Agent': CHROME_UA } }).then((r) => {
  if (!r.ok) throw new Error(`Google Fonts answered ${r.status}`);
  return r.text();
});

await mkdir(OUT_DIR, { recursive: true });

const rules = [];
for (const block of css.split('@font-face').slice(1)) {
  const family = field(block, 'font-family')?.replaceAll("'", '');
  const weight = field(block, 'font-weight');
  const range = field(block, 'unicode-range') ?? '';
  const src = /url\((https:[^)]+)\)/.exec(block)?.[1];
  if (!family || !src) continue;

  const subset = SUBSETS.find((s) => range.includes(s.marker));
  if (!subset) continue;

  const file = `${family.toLowerCase().replaceAll(' ', '-')}-${subset.name}.woff2`;
  const bytes = Buffer.from(await fetch(src).then((r) => r.arrayBuffer()));
  await writeFile(new URL(file, OUT_DIR), bytes);
  console.log(`${file}  ${(bytes.length / 1024).toFixed(1)} kB`);

  rules.push(`@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('./${file}') format('woff2');
  unicode-range: ${range};
}`);
}

if (rules.length === 0) throw new Error('No latin subsets found — the CSS format changed.');

await writeFile(
  new URL('fonts.css', OUT_DIR),
  `/* Generated by scripts/fetch-fonts.mjs — do not edit by hand. */\n${rules.join('\n')}\n`,
);
console.log(`\nWrote assets/fonts/fonts.css with ${rules.length} @font-face rules.`);
```

- [ ] **Step 2: Run it and check the result**

Run:

```bash
npm run fonts
ls -la assets/fonts/
grep -c "@font-face" assets/fonts/fonts.css
```

Expected: at least one `.woff2` per family, each over 5 kB, and `fonts.css` containing `font-family: 'Sour Gummy'` with a `font-weight: 100 900` range and `font-family: 'Jua'`. If Sour Gummy's rule says only `font-weight: 400`, the variable request failed — check the `wdth,wght@100,100..900` part of `CSS_URL`.

- [ ] **Step 3: Copy in the placeholder PDF**

The final sheet does not exist yet; the draft on the author's Desktop stands in so the previews and download are real from day one.

```bash
mkdir -p assets
cp ~/Desktop/heyho.pdf assets/heyho-en.pdf
```

- [ ] **Step 4: Write the preview renderer**

Create `scripts/render-previews.sh`:

```bash
#!/usr/bin/env bash
# Renders every page of the sheet to assets/page-N.png so the previews on the
# page can never drift from the file people actually download.
# Re-run after replacing assets/heyho-en.pdf.
set -euo pipefail

PDF="${1:-assets/heyho-en.pdf}"
OUT_DIR="${2:-assets}"

if [ ! -f "$PDF" ]; then
  echo "No PDF at $PDF" >&2
  exit 1
fi

if ! command -v pdftoppm >/dev/null 2>&1; then
  echo "pdftoppm not found. Install it with: brew install poppler" >&2
  exit 1
fi

rm -f "$OUT_DIR"/page-*.png

# Cap the width rather than fixing a DPI: the sheet's page geometry is not
# ours to predict (the current draft is poster-sized, and -r 110 rasterised it
# at 2934px wide, 3.7 MB for the pair). The previews are displayed at roughly
# half a phone screen, and this page has to load on festival mobile data.
pdftoppm -png -scale-to-x 900 -scale-to-y -1 -aa yes -aaVector yes "$PDF" "$OUT_DIR/page"

ls -1 "$OUT_DIR"/page-*.png
```

- [ ] **Step 5: Render the previews**

Run:

```bash
chmod +x scripts/render-previews.sh
npm run previews
```

Expected: `assets/page-1.png` and `assets/page-2.png` listed. Open both and confirm they show the sheet's two pages right way up and legibly — these are what a parent judges the sheet by.

- [ ] **Step 6: Commit**

```bash
git add scripts/fetch-fonts.mjs scripts/render-previews.sh assets/
git commit -m "chore: add self-hosted fonts, placeholder sheet and page previews"
```

---

### Task 5: Page shell and hero

**Files:**
- Create: `index.html`
- Create: `styles.css`

**Interfaces:**
- Consumes: `assets/fonts/fonts.css` (Task 4).
- Produces: the document skeleton and CSS custom properties (`--ink`, `--paper`, `--pink`, `--yellow`, `--green`, `--cyan`, `--stroke`) plus the utility classes `.display` and `.sticker`, all used by Tasks 6 and 7.

- [ ] **Step 1: Create `index.html` with the shell and hero**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hey Ho, Let's Find! — a free printable scavenger hunt for kids at festivals</title>
<meta name="description" content="A print-and-go scavenger hunt for kids at a music festival. Spot the crowd, take on missions, remember the day. Free PDF, two pages, no app required.">
<link rel="preload" href="/assets/fonts/sour-gummy-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<link rel="stylesheet" href="/styles.css">
</head>
<body>

<header class="stage">
  <div class="stage__checker" aria-hidden="true"></div>
  <div class="wrap">
    <h1 class="display stage__title">Hey&nbsp;Ho,<br>Let's&nbsp;Find!</h1>
    <p class="stage__lede">A print-and-go scavenger hunt for kids at a music festival. Paper, pencil, no signal required.</p>
    <ul class="downloads">
      <li>
        <a class="display button" href="/assets/heyho-en.pdf" download data-sheet="en">↓ Print it free</a>
        <span class="downloads__meta">PDF · 2 pages · A4 &amp; Letter · English</span>
      </li>
    </ul>
  </div>
</header>

<div class="tear" aria-hidden="true"></div>

<main class="paper">
  <div class="wrap">
    <!-- Task 6 fills this in -->
  </div>
</main>

</body>
</html>
```

Note the preload path assumes `assets/fonts/sour-gummy-latin.woff2` exists — confirm the exact filename printed by `npm run fonts` in Task 4 and correct the `href` if it differs.

- [ ] **Step 2: Create `styles.css` with tokens, resets and the hero**

```css
/* Hey Ho, Let's Find! — hand-written, no build step, no framework.
   Sour Gummy (900) shouts, Jua talks. */

:root {
  --ink: #141414;
  --paper: #f7f4e9;
  --pink: #ff2d6f;
  --yellow: #ffd93d;
  --green: #39e08a;
  --cyan: #4dd0f7;
  --stroke: 3px;
  --wrap: 34rem;

  --font-display: 'Sour Gummy', 'Trebuchet MS', system-ui, sans-serif;
  --font-body: 'Jua', 'Trebuchet MS', system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.6;
}

img { max-width: 100%; height: auto; display: block; }

a { color: inherit; }

:focus-visible {
  outline: 3px solid var(--pink);
  outline-offset: 3px;
  border-radius: 2px;
}

.display {
  font-family: var(--font-display);
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
}

.wrap {
  width: 100%;
  max-width: var(--wrap);
  margin-inline: auto;
  padding-inline: 1.25rem;
}

/* Reusable sticker block: thick outline, hard offset shadow. */
.sticker {
  border: var(--stroke) solid var(--ink);
  border-radius: 14px;
  box-shadow: 5px 5px 0 var(--ink);
}

/* ---------- The stage (hero) ---------- */

.stage {
  position: relative;
  overflow: hidden;
  background: var(--ink);
  padding-block: 3rem 2.5rem;
}

.stage__checker {
  position: absolute;
  top: -3rem;
  right: -3rem;
  width: 14rem;
  height: 14rem;
  background: repeating-conic-gradient(var(--pink) 0 25%, var(--ink) 0 50%) 0 0 / 2rem 2rem;
  transform: rotate(12deg);
}

.stage > .wrap { position: relative; }

.stage__title {
  margin: 0;
  font-size: clamp(2.75rem, 13vw, 4rem);
  color: var(--yellow);
  -webkit-text-stroke: 4px var(--ink);
  paint-order: stroke fill;
  text-shadow: 6px 6px 0 var(--pink);
}

.stage__lede {
  margin: 1.25rem 0 0;
  max-width: 26rem;
  padding: 0.75rem 0.9rem;
  background: var(--paper);
  color: var(--ink);
  font-size: 1rem;
  box-shadow: 5px 5px 0 rgb(0 0 0 / 0.55);
  transform: rotate(-0.8deg);
}

.downloads { list-style: none; margin: 1.75rem 0 0; padding: 0; }
.downloads li + li { margin-top: 1rem; }

.button {
  display: inline-block;
  padding: 0.85rem 1.4rem;
  border: var(--stroke) solid var(--ink);
  border-radius: 999px;
  background: var(--green);
  color: var(--ink);
  font-size: 1.125rem;
  text-decoration: none;
  box-shadow: 5px 5px 0 var(--yellow);
  transform: rotate(-1.5deg);
}

.button:hover { transform: rotate(-1.5deg) translate(-1px, -1px); box-shadow: 6px 6px 0 var(--yellow); }
.button:active { transform: rotate(-1.5deg) translate(2px, 2px); box-shadow: 2px 2px 0 var(--yellow); }

.downloads__meta {
  display: block;
  margin-top: 0.6rem;
  color: #a9a49a;
  font-size: 0.85rem;
}

/* ---------- Torn edge between stage and paper ---------- */

.tear {
  height: 1rem;
  background: var(--paper);
  clip-path: polygon(
    0 55%, 4% 15%, 9% 62%, 14% 22%, 20% 68%, 26% 18%, 32% 60%, 38% 25%,
    44% 70%, 50% 20%, 56% 64%, 62% 22%, 68% 66%, 74% 18%, 80% 60%,
    86% 26%, 92% 64%, 97% 20%, 100% 58%, 100% 100%, 0 100%
  );
}

.paper { padding-block: 0.5rem 3rem; }

@media (prefers-reduced-motion: reduce) {
  .button, .button:hover, .button:active { transition: none; }
}
```

- [ ] **Step 3: Look at it**

Run: `npx serve . -l 4173` (or `python3 -m http.server 4173`), then open `http://localhost:4173`.

Check, at a 390px-wide window and at desktop width:
- The title renders in Sour Gummy Black — heavy and rounded, not a fallback sans. If it looks like Trebuchet, the `fonts.css` path or filename is wrong.
- The lede renders in Jua.
- The checkerboard bleeds off the top-right corner without causing horizontal scroll.
- The download button downloads the PDF.
- Tabbing to the button shows a pink focus ring against the dark background.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: add page shell and hero"
```

---

### Task 6: The paper sections

**Files:**
- Modify: `index.html` (replace the `<!-- Task 6 fills this in -->` comment inside `main.paper > .wrap`)
- Modify: `styles.css` (append)

**Interfaces:**
- Consumes: `.wrap`, `.display`, `.sticker`, the colour tokens (Task 5), and `assets/page-1.png` / `assets/page-2.png` (Task 4).
- Produces: the finished content sections; Task 7 appends the reply card and footer after them.

- [ ] **Step 1: Replace the placeholder comment in `index.html`**

The three sticker cards mirror the sheet's own structure, so the page and the printable describe themselves the same way.

```html
    <section class="section" aria-labelledby="whats-on">
      <h2 class="display section__title" id="whats-on">What's on the sheet</h2>
      <ul class="cards">
        <li class="sticker card card--cyan">
          <h3 class="display card__title">Spot it</h3>
          <p class="card__text">Festival style and concert scenes — colored hair, band shirts, the crowd putting on its own show. Tally each one up to five times.</p>
        </li>
        <li class="sticker card card--pink">
          <h3 class="display card__title">Do it</h3>
          <p class="card__text">Eight special missions: invent a new dance move, high-five another kid, pick a landmark as home base, bin your rubbish.</p>
        </li>
        <li class="sticker card card--green">
          <h3 class="display card__title">Keep it</h3>
          <p class="card__text">The after-party page — the coolest outfit, the silliest thing you saw, the band name you'd pick, the one thing you never want to forget.</p>
        </li>
      </ul>
    </section>

    <section class="section" aria-labelledby="take-a-look">
      <h2 class="display section__title" id="take-a-look">Take a look</h2>
      <div class="previews">
        <a class="preview" href="/assets/page-1.png">
          <img src="/assets/page-1.png" width="850" height="1100" loading="lazy"
               alt="Page one of the sheet: a Festival Style grid and a Concert Scenes grid, each box with five circles to tick.">
        </a>
        <a class="preview" href="/assets/page-2.png">
          <img src="/assets/page-2.png" width="850" height="1100" loading="lazy"
               alt="Page two of the sheet: eight Special Missions to complete, then four After-Party questions to write answers in.">
        </a>
      </div>
      <p class="previews__meta">Both pages — tap to see them full size.</p>
    </section>

    <section class="section" aria-labelledby="how-to">
      <h2 class="display section__title" id="how-to">How to use it</h2>
      <p>Print it, hand it over with a pencil, and that's the whole setup.</p>
      <p>No app to install, no account, nothing to charge, and it keeps working when the signal doesn't — which, at a festival, is most of the day.</p>
    </section>

    <section class="section" aria-labelledby="why">
      <h2 class="display section__title" id="why">Why I made this</h2>
      <p>Going to events with my daughter made me realise how handy it is to have extra entertainment for the little ones.</p>
      <p>If this activity made your festival easier, or your kids enjoyed it, I'd be thrilled to know.</p>
    </section>
```

- [ ] **Step 2: Append the styles to `styles.css`**

```css
/* ---------- Paper sections ---------- */

.section { margin-top: 2.5rem; }

.section__title {
  margin: 0 0 0.9rem;
  font-size: 1.4rem;
}

.section p { margin: 0 0 0.75rem; }
.section p:last-child { margin-bottom: 0; }

.cards { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.9rem; }

.card { padding: 0.85rem 1rem; }
.card:nth-child(1) { transform: rotate(-1deg); }
.card:nth-child(2) { transform: rotate(0.8deg); }
.card:nth-child(3) { transform: rotate(-0.6deg); }

.card--cyan  { background: var(--cyan); }
.card--pink  { background: var(--pink); color: #fff; }
.card--green { background: var(--green); }

.card__title { margin: 0 0 0.25rem; font-size: 1.1rem; }
.card__text { margin: 0; font-size: 0.95rem; line-height: 1.5; }

.previews { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

.preview {
  display: block;
  border: 2px solid var(--ink);
  background: #fff;
  box-shadow: 4px 4px 0 rgb(20 20 20 / 0.14);
}

.preview:nth-child(1) { transform: rotate(-2deg); }
.preview:nth-child(2) { transform: rotate(1.6deg); }

.previews__meta {
  margin: 1.1rem 0 0;
  text-align: center;
  font-size: 0.85rem;
  color: #5a564c;
}
```

- [ ] **Step 3: Look at it again**

Reload `http://localhost:4173` and check:
- The rotated cards don't overlap each other or cause horizontal scroll at 390px.
- Both preview images load and are legible enough to judge the sheet; clicking one opens the full-size PNG.
- Pink card text (`#fff` on `--ink`-outlined pink) is comfortably readable.
- With a screen reader or the browser's accessibility tree, headings read in order: *What's on the sheet* → *Take a look* → *How to use it* → *Why I made this*.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: add sheet description, previews and story sections"
```

---

### Task 7: The reply card

**Files:**
- Modify: `index.html` (append inside `main.paper > .wrap`, after the *Why I made this* section)
- Modify: `styles.css` (append)
- Create: `app.js`

**Interfaces:**
- Consumes: `POST /api/feedback` (Task 3), `.sticker` and the tokens (Task 5).
- Produces: the `[data-sheet]` download links that Task 8's analytics hooks into (already present from Task 5), and the `#reply` form.

- [ ] **Step 1: Append the form and footer to `index.html`**

The `website` field is the honeypot. It is hidden from sight *and* from assistive tech, and marked `tabindex="-1"` so a keyboard user can never land in it.

```html
    <section class="section" aria-labelledby="tell-me">
      <form class="sticker reply" id="reply" action="/api/feedback" method="post">
        <h2 class="display section__title" id="tell-me">Tell me how it went</h2>
        <p class="reply__note">This goes straight to my inbox. Nothing is published, and I'll only ever write back to a grown-up.</p>

        <div class="field">
          <label class="display field__label" for="message">How did it go?</label>
          <textarea class="field__input" id="message" name="message" rows="4" maxlength="2000" required></textarea>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="display field__label" for="age">Kids' ages</label>
            <input class="field__input" id="age" name="age" type="text" maxlength="40" autocomplete="off" placeholder="optional">
          </div>
          <div class="field">
            <label class="display field__label" for="email">Your email</label>
            <input class="field__input" id="email" name="email" type="email" maxlength="200" autocomplete="email" placeholder="optional">
          </div>
        </div>

        <div class="honeypot" aria-hidden="true">
          <label for="website">Leave this empty</label>
          <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>

        <button class="display button button--send" type="submit">Send it →</button>
        <p class="reply__status" role="status" aria-live="polite"></p>
      </form>
    </section>

    <footer class="footer">
      <p>Made by <a href="https://ludoratory.com">Ludoratory</a> — more games and printables.</p>
    </footer>
```

- [ ] **Step 2: Append the styles**

```css
/* ---------- Reply card ---------- */

.reply {
  background: #fff;
  border-style: dashed;
  border-radius: 4px;
  padding: 1.25rem 1.1rem 1.4rem;
  transform: rotate(-0.5deg);
  box-shadow: 6px 6px 0 rgb(20 20 20 / 0.15);
}

.reply__note { margin: -0.4rem 0 1rem; font-size: 0.85rem; color: #5a564c; }

.field { margin-bottom: 0.9rem; }
.field__label { display: block; margin-bottom: 0.3rem; font-size: 0.9rem; }

.field__input {
  width: 100%;
  padding: 0.55rem 0.6rem;
  border: 2px solid var(--ink);
  border-radius: 2px;
  background: #fffdf6;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 1rem;
}

.field__input::placeholder { color: #8a857a; }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

/* Honeypot: hidden from people, present for bots. Never display:none — some
   bots skip hidden inputs, and this one needs to look fillable. */
.honeypot {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.button--send {
  background: var(--yellow);
  box-shadow: 5px 5px 0 var(--ink);
  transform: rotate(-1deg);
  font-size: 1rem;
  cursor: pointer;
}

.button--send:hover { transform: rotate(-1deg) translate(-1px, -1px); }
.button--send:active { transform: rotate(-1deg) translate(2px, 2px); box-shadow: 2px 2px 0 var(--ink); }
.button--send[disabled] { opacity: 0.6; cursor: progress; }

.reply__status { margin: 0.9rem 0 0; font-size: 0.95rem; min-height: 1.5rem; }
.reply__status--error { color: #b3003c; }

.footer {
  margin-top: 2.5rem;
  text-align: center;
  font-size: 0.85rem;
  color: #5a564c;
}

.footer a { text-decoration: none; border-bottom: 2px solid var(--pink); }
```

- [ ] **Step 3: Create `app.js`**

Progressive enhancement: without this file the form still posts and the endpoint answers with an HTML page. With it, the card answers in place.

```js
// Submits the reply card without leaving the page. The form works without
// this file — api/feedback.ts answers a plain form post with an HTML page.
const form = document.querySelector('#reply');
const status = form?.querySelector('.reply__status');
const button = form?.querySelector('button[type="submit"]');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  status.classList.remove('reply__status--error');
  status.textContent = 'Sending…';
  button.disabled = true;

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok && result.ok) {
      form.querySelectorAll('.field, .button--send').forEach((el) => el.remove());
      status.textContent = 'Thank you — that landed in my inbox. Have a great festival!';
      return;
    }

    status.textContent = result.error ?? "That didn't send — please try again in a moment.";
    status.classList.add('reply__status--error');
  } catch {
    status.textContent = "That didn't send — check your connection and try again.";
    status.classList.add('reply__status--error');
  } finally {
    button.disabled = false;
  }
});
```

- [ ] **Step 4: Load the script from `index.html`**

Add immediately before `</body>`:

```html
<script src="/app.js" type="module"></script>
```

- [ ] **Step 5: Test the form end to end**

The endpoint needs Vercel's runtime, so a plain static server is not enough here.

```bash
vercel link          # once, if the project isn't linked yet
cp .env.example .env # then fill in RESEND_API_KEY and FEEDBACK_TO
vercel dev
```

Check at `http://localhost:3000`:
- Submitting with an empty message shows the browser's own required-field prompt.
- A real submission shows "Sending…", then the thank-you text, and the fields disappear.
- **The email actually arrives.** This is the one thing no unit test can prove.
- Replying to that email addresses the parent's address when one was given.
- Disabling JavaScript (DevTools → Settings → Debugger → Disable JavaScript) and submitting lands on the plain thank-you page, and the mail still arrives.
- Filling the honeypot from the console — `document.querySelector('#website').value = 'bot'` — still answers success, and **no** mail arrives.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: add the reply card"
```

---

### Task 8: Social card, metadata and download analytics

**Files:**
- Create: `scripts/render-og.sh`
- Create: `assets/og.html`
- Generated: `assets/og.png`
- Modify: `index.html` (`<head>`, and the analytics snippet before `</body>`)
- Modify: `app.js` (append the download tracking)

**Interfaces:**
- Consumes: the `[data-sheet]` download links (Task 5), the palette and fonts (Tasks 4–5).
- Produces: `assets/og.png` (1200×630) and a `download` analytics event carrying `{ sheet: 'en' }`.

- [ ] **Step 1: Create `assets/og.html`**

A standalone 1200×630 document, screenshotted into the social card. It restates the hero rather than importing it, because it needs a fixed size and a horizontal layout.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="fonts/fonts.css">
<style>
  body {
    margin: 0; width: 1200px; height: 630px; overflow: hidden;
    background: #141414; color: #ffd93d;
    font-family: 'Jua', sans-serif;
    display: flex; align-items: center; gap: 3rem; padding: 0 4.5rem;
    position: relative;
  }
  .checker {
    position: absolute; top: -80px; right: -80px; width: 380px; height: 380px;
    background: repeating-conic-gradient(#ff2d6f 0 25%, #141414 0 50%) 0 0 / 54px 54px;
    transform: rotate(12deg);
  }
  h1 {
    font-family: 'Sour Gummy', sans-serif; font-weight: 900; text-transform: uppercase;
    font-size: 88px; line-height: 1; margin: 0;
    -webkit-text-stroke: 8px #141414; paint-order: stroke fill;
    text-shadow: 12px 12px 0 #ff2d6f;
  }
  p {
    margin: 28px 0 0; max-width: 30ch; font-size: 27px; line-height: 1.45;
    color: #141414; background: #f7f4e9; padding: 16px 18px;
    transform: rotate(-0.8deg); box-shadow: 8px 8px 0 rgb(0 0 0 / .55);
  }
  .sheets { display: flex; gap: 18px; flex: none; position: relative; }
  .sheets img {
    width: 210px; border: 4px solid #141414; background: #fff;
    box-shadow: 10px 10px 0 rgb(0 0 0 / .5);
  }
  .sheets img:first-child { transform: rotate(-4deg); }
  .sheets img:last-child { transform: rotate(3deg); }
</style>
</head>
<body>
  <div class="checker"></div>
  <div>
    <h1>Hey Ho,<br>Let's Find!</h1>
    <p>A free print-and-go scavenger hunt for kids at a music festival.</p>
  </div>
  <div class="sheets">
    <img src="page-1.png" alt="">
    <img src="page-2.png" alt="">
  </div>
</body>
</html>
```

- [ ] **Step 2: Create `scripts/render-og.sh`**

```bash
#!/usr/bin/env bash
# Screenshots assets/og.html into the 1200×630 social card.
# Re-run after changing og.html or the sheet previews.
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found at $CHROME" >&2; exit 1; }

OUT="$(pwd)/assets/og.png"
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --window-size=1200,630 --screenshot="$OUT" \
  --virtual-time-budget=4000 \
  "file://$(pwd)/assets/og.html"

echo "Wrote $OUT"
```

- [ ] **Step 3: Render and inspect the card**

```bash
chmod +x scripts/render-og.sh
npm run og
open assets/og.png
```

Expected: exactly 1200×630 (`sips -g pixelWidth -g pixelHeight assets/og.png`), fonts rendered as Sour Gummy and Jua rather than fallbacks, both sheet thumbnails visible, nothing clipped at the edges.

- [ ] **Step 4: Add the metadata to `index.html`**

Insert after the existing `<meta name="description">`:

```html
<link rel="canonical" href="https://heyho.ludoratory.com/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ludoratory">
<meta property="og:url" content="https://heyho.ludoratory.com/">
<meta property="og:title" content="Hey Ho, Let's Find! — a free printable scavenger hunt for kids at festivals">
<meta property="og:description" content="Spot the crowd, take on missions, remember the day. Free two-page PDF. No app, no account, works with no signal.">
<meta property="og:image" content="https://heyho.ludoratory.com/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Hey Ho, Let's Find! in bold yellow letters beside the two printable sheets.">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#141414">
```

- [ ] **Step 5: Add the analytics snippet to `index.html`**

Immediately before the existing `<script src="/app.js">` line. The stub queues events fired before the script loads; `/_vercel/insights/script.js` only exists on a Vercel deployment, so it 404s locally — that is expected and harmless.

```html
<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
<script defer src="/_vercel/insights/script.js"></script>
```

- [ ] **Step 6: Append download tracking to `app.js`**

```js
// Count downloads. Page views come along with the analytics script and are
// simply ignored — there is no download-only mode.
document.querySelectorAll('[data-sheet]').forEach((link) => {
  link.addEventListener('click', () => {
    window.va?.('event', { name: 'download', data: { sheet: link.dataset.sheet } });
  });
});
```

- [ ] **Step 7: Verify locally**

Reload the page and check the console shows no errors beyond the expected 404 for `/_vercel/insights/script.js`, and that clicking the download button still downloads the PDF.

- [ ] **Step 8: Commit**

```bash
git add scripts/render-og.sh assets/og.html assets/og.png index.html app.js
git commit -m "feat: add social card, metadata and download tracking"
```

---

### Task 9: Deploy to heyho.ludoratory.com

**Files:**
- None created. This task is configuration and verification.

**Interfaces:**
- Consumes: everything above.
- Produces: a live site at `https://heyho.ludoratory.com`.

- [ ] **Step 1: Upgrade the Vercel CLI**

The installed CLI is far behind (41.x against 58.x) and older versions mishandle framework-less projects with an `api/` directory.

```bash
npm i -g vercel@latest
vercel --version
```

- [ ] **Step 2: Link the project**

```bash
vercel link
```

Choose the personal scope and the name `heyho`. Framework preset: **Other**. Root directory: `./`. No build command, no output directory.

- [ ] **Step 3: Set the environment variables**

```bash
vercel env add RESEND_API_KEY production
vercel env add RESEND_API_KEY preview
vercel env add FEEDBACK_TO production
vercel env add FEEDBACK_TO preview
```

Paste the Resend key and the destination address at each prompt. Do not add `FEEDBACK_FROM` — the default `onboarding@resend.dev` is correct until a domain is verified.

- [ ] **Step 4: Deploy a preview and test it there**

```bash
vercel
```

On the preview URL, confirm: the page renders with both fonts, the PDF downloads, the previews load, and a test submission **arrives in the inbox**. Fix anything broken before going near production.

- [ ] **Step 5: Deploy to production**

```bash
vercel --prod
```

- [ ] **Step 6: Attach the domain**

```bash
vercel domains add heyho.ludoratory.com
```

Follow the CLI's DNS instructions for `ludoratory.com` (a `CNAME` on the `heyho` subdomain pointing at Vercel). Then confirm:

```bash
curl -sI https://heyho.ludoratory.com | head -3
curl -sI https://heyho.ludoratory.com/assets/heyho-en.pdf | head -3
```

Expected: `HTTP/2 200` for both, and `content-type: application/pdf` for the second.

- [ ] **Step 7: Enable Web Analytics**

In the Vercel dashboard, open the project → Analytics → enable Web Analytics. Then load the live page, click the download button, and confirm a `download` event appears (allow a few minutes).

**If custom events turn out to be unavailable on the current plan:** don't fight it. Add `vercel.json` with a redirect that gives the download its own countable path, and point the button at it:

```json
{ "redirects": [{ "source": "/download/en", "destination": "/assets/heyho-en.pdf" }] }
```

`/download/en` then shows up in Top Pages as a proxy for download count.

- [ ] **Step 8: Final verification pass on the live site**

Walk the whole thing on a real phone, not just a narrow desktop window:

- The page is legible outdoors at arm's length; the hero needs no zooming.
- The download saves a PDF that opens in the phone's viewer.
- The reply card sends, and the mail arrives.
- Paste `https://heyho.ludoratory.com` into WhatsApp or Slack and confirm the card shows `og.png` rather than a blank rectangle.
- Run Lighthouse on mobile; investigate anything under 95 for Accessibility.

- [ ] **Step 9: Commit any fixes and push**

```bash
git add -A
git commit -m "chore: deploy to heyho.ludoratory.com"
git push
```

---

## Notes for whoever executes this

**The PDF is a placeholder.** `assets/heyho-en.pdf` is the author's draft, and its spot-it labels all read "Colored hair". Ship the site with it anyway — the layout, previews and download all work — and when the finished sheet arrives, replace the file, run `npm run previews` and `npm run og`, and commit. The copy in Task 6's "Spot it" card describes the sheet's *sections*, not the individual items, so it survives the swap.

**A French sheet is expected later.** It is one more `<li>` in `.downloads` with `data-sheet="fr"`, one more PDF, and one more preview render. The page copy stays English. Do not add i18n.

**The Ludoratory catalog listing is not in this repo.** The spec calls for the sheet to be listed alongside the games, but that is an edit in the `ludoratory` project. Raise it with the author once the site is live rather than reaching into a sibling repo from here.

**What is deliberately not being built:** a digital version of the hunt, a sheet generator, a mailing list, accounts, or any backend beyond the one email endpoint. If one of these seems necessary mid-implementation, stop and raise it rather than building it.
