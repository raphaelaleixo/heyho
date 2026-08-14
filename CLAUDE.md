# CLAUDE.md — Ho Hey, Let's Play!

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
| Firebase | Two Vercel functions + Resend + Vercel Blob | The server needs are "email me this message" and "count that download" |
| SPA rewrites in `vercel.json` | No `vercel.json` | Single page, nothing to rewrite |

Do not "fix" these by aligning with the parent stack.

## Layout

- `index.html`, `styles.css`, `app.js` — the entire page, served as written
- `api/feedback.ts`, `api/download.ts` — the only two endpoints. **Every file in
  `api/` becomes a public route** (except `_`-prefixed ones, which are excluded
  from routing), so shared code lives in `lib/`
- `lib/` — pure, unit-tested modules: validation, email composition, responses,
  download pathnames and counting
- `scripts/` — asset generation (fonts, PDF previews) and reading the counter
- `assets/` — the PDF, its preview renders, fonts, the social card

## Commands

```sh
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run serve     # vercel dev (needs `vercel link` once)
npm run downloads # how many times each sheet has been downloaded
npm run fonts     # re-download the self-hosted woff2 files
npm run previews  # re-render page-1.png / page-2.png from the PDF
```

## Counting downloads

There is no analytics script on the page and no third party involved. Clicking
a download button fires a `navigator.sendBeacon` at `api/download.ts`, which
writes one empty-ish marker blob per download to a private Vercel Blob store,
named `downloads/<sheet>/<iso-timestamp>-<nonce>`. Counting is a prefixed
`list()`, so concurrent downloads can never overwrite each other's tally the
way a read-modify-write counter would, and the timestamps give
downloads-over-time for free.

Read the tally with `npm run downloads`. It is a script rather than a route
because everything in `api/` is public, and because browsing the store in the
Vercel dashboard bills Blob advanced operations of its own.

Three things to keep in mind:

- **The beacon counts button presses, not completed downloads**, and anyone
  hitting `/assets/heyho-*.pdf` directly is invisible to it. The privacy line
  in `index.html` is worded to promise exactly that and no more.
- **Nothing in `api/download.ts` may throw.** A missing token, a rejected write
  or an exhausted quota must lose a count and never a download — the browser has
  already started the PDF and never reads the response.
- **Hobby includes 10K Blob advanced operations a month**, and one download is
  one `put`. Past that Vercel does not bill; Blob simply stops for 30 days.
  Listing to count also spends advanced operations, one per 1000 markers.

`vercel dev` reads `.env` but **not** `.env.local`, so `BLOB_READ_WRITE_TOKEN`
has to be in `.env` for local work. Vercel injects it in production.
`vercel blob create-store` writes it to `.env.local` — copy it across.

The scripts that share code with `lib/` run through Node's type stripping
(`--experimental-strip-types`) and import `../lib/*.ts` by its real extension,
which is why `allowImportingTsExtensions` is on. That keeps one source of truth
for the pathname format without introducing a build step.

`assets/og.png` is **hand-made, not generated** — it is a drawn 1200×630 card,
not something a script can reproduce. There used to be an `og.html` plus a
headless-Chrome `npm run og` that rendered a wordmark-and-line version; both
were deleted once the card became artwork, because running them would have
silently overwritten it. Replace the card by dropping in a new 1200×630 PNG and
updating `og:image:alt` in `index.html` to match.

The dev server script is `serve`, **not** `dev`, and must stay that way. No
framework is detected here, so `vercel dev` falls back to running `npm run dev`
as its development command — if that script is itself `vercel dev`, the CLI
detects the recursion and refuses to start at all. Renaming it back breaks the
only way to run the API locally.

## When the final PDF arrives

Replace `assets/heyho-en.pdf`, run `npm run previews`, commit both the PDF and
the regenerated PNGs. The preview images must never drift from the actual file.

## Sheets in other languages

The download area is a list of variants. A French sheet means one more PDF in
`assets/`, one more `<li>` in the download list, and one more preview render —
**not** a translated page.
