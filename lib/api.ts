// Client-side helpers for talking to the JSON API routes.

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function apiGet<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json();
}

async function sendJson<T>(url: string, method: string, body?: unknown): Promise<{ res: Response; data: T }> {
  const res = await fetch(url, {
    method,
    headers: JSON_HEADERS,
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json()) as T;
  return { res, data };
}

export async function apiPost<T = any>(url: string, body?: unknown) {
  return sendJson<T>(url, 'POST', body);
}

export async function apiPatch<T = any>(url: string, body?: unknown) {
  return sendJson<T>(url, 'PATCH', body);
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' });
  return res.json();
}
