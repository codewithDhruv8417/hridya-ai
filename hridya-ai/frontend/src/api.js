// Backend address - uvicorn runs on localhost:8000
const BASE_URL = 'http://127.0.0.1:8000';

// Small helper so we don't repeat the fetch boilerplate in every component
export async function api(path, method = 'GET', body = null) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Server error, please try again');
  return data;
}
