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
      subject: 'Ho Hey feedback — My kid loved it',
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
