import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { AiKey } from '../types/ai'

/** 取得目前使用者自帶的 AI 金鑰清單（不含系統預設） */
export async function fetchAiKeys(): Promise<AiKey[]> {
  const items = await api.get<ApiResponse<AiKey[]>>('/users/me/ai-keys').then(unwrap)
  return items ?? []
}

/** 新增或更新某供應商的 AI 金鑰（後端存檔前會驗證金鑰有效性） */
export function upsertAiKey(providerId: string, apiKey: string): Promise<AiKey | null> {
  return api.put<ApiResponse<AiKey>>('/users/me/ai-keys', { providerId, apiKey }).then(unwrap)
}

/** 刪除某供應商的 AI 金鑰（回復使用系統預設） */
export function deleteAiKey(providerId: string): Promise<unknown> {
  return api.delete(`/users/me/ai-keys/${providerId}`)
}
