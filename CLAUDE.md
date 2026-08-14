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
npm run serve     # vercel dev (needs `vercel link` once)
npm run fonts     # re-download the self-hosted woff2 files
npm run previews  # re-render page-1.png / page-2.png from the PDF
npm run og        # re-render the 1200×630 social card
```

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
