/** Client-side fetch helper that turns non-2xx responses and network failures into thrown errors. */

function messageFromBody(body: unknown, status: number): string {
  if (body !== null && typeof body === 'object' && 'error' in body) {
    const error = (body as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return `Request failed (${status})`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    console.error(`[fetchJson] ${init?.method ?? 'GET'} ${url} network error:`, err);
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    throw new Error(messageFromBody(body, res.status));
  }
  if (body === null) {
    throw new Error('The server returned an unexpected response.');
  }
  return body as T;
}

export function postJson<T>(url: string, payload: unknown, method: 'POST' | 'PATCH' = 'POST'): Promise<T> {
  return fetchJson<T>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** Normalises anything thrown into a user-presentable message. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}
