// fallback 對應後端 IIS Express 的 sslPort，需含 /api/v1 版本前綴（與 .env.example 一致）
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:44345/api/v1'

// 一般 API 請求 10 秒逾時；SSE streaming 由呼叫端自行管理 AbortController
const DEFAULT_TIMEOUT_MS = 10_000

type FetchOptions = Omit<RequestInit, 'body'> & { body?: unknown }

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, signal: callerSignal, ...rest } = options

  // 合併呼叫端傳入的 signal 與預設逾時 signal
  const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, timeoutSignal])
    : timeoutSignal

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `HTTP ${res.status}`)
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
  // 只允許英數字與連字號，防止路徑穿越（path traversal）
  if (!/^[a-zA-Z0-9-]{1,128}$/.test(slug)) throw new Error('Invalid slug')
  const res = await api.get<{ data: import('@/types').SharedConversation }>(
    `/conversations/share/${slug}`,
    { cache: 'no-store' }
  )
  return res.data
}

export async function fetchPublicPersonas() {
  const res = await api.get<{ data: import('@/types').Persona[] }>('/public/personas')
  return res.data
}

// ── 公開存取碼 ────────────────────────────────────────────────────────────────
export type PublicAccessStatus = {
  /** 本站是否要求存取碼 */
  requireAccessCode: boolean
  /** 提供的碼是否有效 */
  valid: boolean
  label: string | null
  dailyTokenLimit: number
  usedToday: number
  /** 今日剩餘 token；null = 不限制 */
  remaining: number | null
}

/** 查詢存取碼狀態（剩餘額度）；code 由 X-Access-Code 標頭帶入 */
export async function fetchAccessStatus(code: string | null) {
  const res = await api.get<{ data: PublicAccessStatus }>('/public/access/status', {
    cache: 'no-store',
    headers: code ? { 'X-Access-Code': code } : undefined,
  })
  return res.data
}
