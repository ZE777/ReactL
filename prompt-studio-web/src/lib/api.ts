const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

type FetchOptions = Omit<RequestInit, 'body'> & { body?: unknown }

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, ...rest } = options
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(detail)
  }
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, init),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}

export async function fetchSharedConversation(slug: string) {
  return api.get<import('@/types').SharedConversation>(`/api/public/${slug}`)
}

export async function fetchPublicPersonas() {
  return api.get<import('@/types').Persona[]>('/api/personas?isBuiltin=true')
}
