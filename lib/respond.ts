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
