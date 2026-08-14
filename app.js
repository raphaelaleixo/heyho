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
      status.focus();
      return;
    }

    status.textContent = result.error ?? "That didn't send — please try again in a moment.";
    status.classList.add('reply__status--error');
    status.focus();
  } catch {
    status.textContent = "That didn't send — check your connection and try again.";
    status.classList.add('reply__status--error');
    status.focus();
  } finally {
    button.disabled = false;
  }
});

// Count downloads. A beacon rather than a fetch, because the browser is busy
// starting the PDF and may leave the page before a normal request finishes —
// sendBeacon is handed to the OS and outlives the page. Nothing is read back:
// the link keeps pointing straight at the file, so a blocked or failed beacon
// costs a count and never the download.
document.querySelectorAll('[data-sheet]').forEach((link) => {
  link.addEventListener('click', () => {
    navigator.sendBeacon(`/api/download?sheet=${encodeURIComponent(link.dataset.sheet)}`);
  });
});
