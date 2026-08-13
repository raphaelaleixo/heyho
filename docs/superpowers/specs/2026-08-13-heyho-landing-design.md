# Hey Ho, Let's Find! — landing page design

**Date:** 2026-08-13
**Status:** approved for planning
**Domain:** `heyho.ludoratory.com`

## What this is

A one-page site that gives away a printable scavenger hunt for kids at music festivals,
tells the story of why it exists, and collects feedback from parents who used it.

It is **not** a game. It is a document with a download button and a reply card. That is the
deliberate departure from the other projects in `LudoratoryProjects/`, which are all
multi-device real-time web games.

**Success looks like:** a parent scans a QR code on a paper sheet at a festival, or follows a
link from a forum, understands what the sheet is within a few seconds, downloads the PDF, and
— some of the time — writes back to say how it went.

## Deliberate deviations from the directory defaults

The parent `CLAUDE.md` prescribes Vite + React + MUI + i18next + `react-gameroom` + Firebase for
projects here. None of that applies:

| Default | Here | Why |
| --- | --- | --- |
| Vite + React + TypeScript | Hand-written HTML + CSS, no build step | One static page; a bundler would add ~40 dependencies and a build to ship a document |
| MUI | Hand-written CSS | The whole point is a hand-made zine look; a component library fights it |
| i18next | None | Page copy is English only |
| `react-gameroom` | None | No rooms, no players, no real-time anything |
| Firebase | One Vercel function + Resend | The only server-side need is "email me this message" |
| SPA rewrites in `vercel.json` | No `vercel.json` | Single page; nothing to rewrite |

This table is repeated in the project's own `CLAUDE.md` so the reasoning survives.

## Repository shape

```
heyho/
  index.html              the entire page
  styles.css              hand-written
  assets/
    heyho-en.pdf          the printable (placeholder until the final file lands)
    page-1.png            preview renders of the sheet
    page-2.png
    og.png                1200×630 social card
    fonts/                self-hosted woff2 (Sour Gummy, Jua — latin subset)
  api/
    feedback.ts           serverless function → Resend
  lib/
    validate.ts           pure validation, unit-tested (outside api/ so Vercel
                          doesn't publish it as a second endpoint)
  scripts/
    render-previews.sh    PDF → page-N.png
  test/
    validate.test.ts
  package.json            deps: resend; devDeps: vitest, typescript
  .env.example            RESEND_API_KEY, FEEDBACK_TO
  .gitignore              node_modules, .env*, .superpowers/, .vercel
  CLAUDE.md
```

Vercel serves the repo root statically and auto-detects `api/`. No framework preset.

## Page structure

One scroll, six beats, ordered so a parent deciding in ~8 seconds gets the file without scrolling:

1. **Hero** — title, one line of what it is, download button, and the file facts
   (`PDF · 2 pages · A4 & Letter`).
2. **What's on the sheet** — three sticker cards mirroring the sheet's own structure:
   *Spot it* (style & scenes tallies), *Do it* (missions), *Keep it* (after-party questions).
3. **Preview** — both pages as images, tap to enlarge. Nobody downloads blind.
4. **How to use it** — print, hand it over with a pencil. States the selling point explicitly:
   no app, no account, nothing to charge, works with no signal.
5. **Why I made this** — the note from the sheet, in the author's voice. This is what earns
   enough trust to make someone print it.
6. **Reply card** — the feedback form. Then a footer link to Ludoratory.

### Download list

The download area is built as a **list of sheet variants** from day one, even though it ships with
one entry (English). Adding French means one PDF in `assets/` and one more entry — no
restructuring. Page copy stays English regardless of how many sheets exist.

## Visual direction

**Chosen:** dark hero, paper below ("C2" in the brainstorm mockups, kept locally under
`.superpowers/brainstorm/` — gitignored, not part of the repo).

The hero is the gig at night: near-black ground, hot-pink checkerboard bursting off the top-right
corner, headline in yellow with a heavy black stroke and pink offset shadow. A torn paper edge
hands the reader over to the rest of the page, which sits on warm off-white paper with a fine
grain — the same coloured scraps and sticker blocks, now in black on paper. The page acts out the
product: loud gig on top, printable in your hands underneath.

**Palette:** ink `#141414`, paper `#f7f4e9`, pink `#ff2d6f`, yellow `#ffd93d`, green `#39e08a`,
cyan `#4dd0f7`.

**Typography:** **Sour Gummy Black** (900) shouts — page title, section headings, sticker labels,
buttons. **Jua** talks — subtitles, body copy, form. Both self-hosted as woff2, latin subset, with
`font-display: swap` and a rounded system fallback stack.

**Zine grammar, kept kid-friendly:** thick black outlines, hard offset shadows, elements rotated
by ~1–2°, halftone/paper grain, tape-and-scrap framing. Bright and homemade — never grimy or
spiky. The parent is the one deciding, and the page has to read as *playful-homemade*, not sketchy.

**Accessibility, despite the collage:**
- Rotations are presentational; DOM order matches reading order.
- Preview images carry alt text describing what's on each page.
- Form fields use real `<label>` elements, never placeholder-as-label.
- Focus rings are visible against both the dark hero and the paper.
- Body text holds a 4.5:1 contrast ratio; the yellow-on-near-black headline is large-text scale.
- No motion beyond hover states; nothing that needs `prefers-reduced-motion`.

## Feedback endpoint

### Contract

`POST /api/feedback`

| Field | Required | Rules |
| --- | --- | --- |
| `message` | yes | 1–2000 chars after trim |
| `age` | no | ≤ 40 chars, free text ("6", "4 and 7") |
| `email` | no | ≤ 200 chars, must contain a plausible address if present |
| `website` | — | honeypot; must be empty or the request is silently accepted and dropped |

Responses: `200 {ok:true}` on success, `400 {ok:false,error}` on validation failure,
`500 {ok:false}` if Resend fails. A honeypot hit returns `200` without sending — bots get no
signal that they were caught.

### Delivery

Resend, with:
- **from:** `onboarding@resend.dev` — Resend's default sender, which requires no domain
  verification as long as the recipient is the account owner's own address. Swappable for
  `hey@ludoratory.com` later without touching the page.
- **to:** `FEEDBACK_TO` (env var — the real address never appears in the page source).
- **reply-to:** the parent's email when supplied, so replying from the inbox just works.
- **subject:** `Hey Ho feedback — <first few words of the message>`.

### Progressive enhancement

The form is a real `<form action="/api/feedback" method="post">`. Without JavaScript, the function
returns a small styled thank-you page. With JavaScript, submission is a `fetch` and the reply card
flips to a "got it" state in place. Errors surface inside the card, never as an alert.

### Anti-spam

Honeypot field plus length caps. No captcha — proportionate to the expected volume, and a captcha
on a kids' activity page is friction where trust matters most. If bots find it, Vercel BotID is a
one-line addition.

### Privacy

No cookies, no accounts, no analytics on the form. Nothing a child would ever fill in is
requested. The card states plainly: the message goes to a private inbox and nothing is published.

## Assets

**Fonts** self-hosted in `assets/fonts/` — no request to Google on load. Faster on festival wifi,
and no third-party call on a page aimed at parents.

**PDF and previews.** The author supplies the final PDF at `assets/heyho-en.pdf`;
`scripts/render-previews.sh` renders `page-1.png` and `page-2.png` from whatever PDF is present, so
the preview can never drift from the actual file. During the build the current placeholder PDF is
used, and the script is re-run when the final file lands. The script tries the PDF rasterisers
available on macOS in order (`pdftoppm`, `sips`, `qlmanage`) and fails loudly if none work.

**Social card.** `assets/og.png` at 1200×630, composed from the hero, referenced by `og:image` and
`twitter:image`, alongside title, description, and canonical URL — links pasted into WhatsApp or a
forum show the sheet, not a blank card.

## Analytics

Vercel Web Analytics, with a custom `download` event fired on the download button, tagged with
which sheet variant was taken.

Known limitation, accepted: enabling custom events also records page views — there is no
download-only mode. It is cookieless and collects no personal data, so no consent banner is
needed; the page-view numbers are simply ignored.

## Correctness

The only logic in the project is request validation, so that is where the tests go:

- `lib/validate.ts` is a pure function with vitest coverage: missing message, whitespace-only
  message, over-length message, honeypot filled, malformed email, valid submission with and
  without optional fields.
- `api/feedback.ts` stays a thin shell: parse → validate → send → respond.

Everything else is verified by eye, and must be checked before the work is called done:
the page at 390px and at desktop width, a real submission arriving in the inbox, the PDF
downloading, and the no-JavaScript form path returning the thank-you page.

## Shipping

`git init`, a Vercel project with no framework preset, `RESEND_API_KEY` and `FEEDBACK_TO` set as
env vars, and `heyho.ludoratory.com` pointed at the deployment. The `ship-game` skill is not used —
it assumes a game and the catalog's game format — so the domain and the catalog listing are wired
by hand.

## Out of scope

Deliberately not built, and not to be added without a new decision:

- A digital version of the hunt played on a phone.
- A generator that builds custom sheets.
- Email capture / a mailing list for future printables.
- Any form of account, saved state, or backend beyond the one email endpoint.
- Page translation (the *sheets* may become multilingual; the page does not).
