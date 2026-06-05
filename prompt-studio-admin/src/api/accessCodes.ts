import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { AccessCode } from '../types/accessCode'

/** 建立存取碼的輸入（code 由後端生成） */
export type CreateAccessCodeData = {
  label?: string | null
  dailyTokenLimit?: number | null
  expiresAt?: string | null
}

/** 更新存取碼的輸入 */
export type UpdateAccessCodeData = {
  label?: string | null
  dailyTokenLimit: number
  expiresAt?: string | null
}

/** 取得所有存取碼（需 Admin 權限） */
export async function fetchAccessCodes(): Promise<AccessCode[]> {
  const items = await api.get<ApiResponse<AccessCode[]>>('/access-codes').then(unwrap)
  return items ?? []
}

/** 建立存取碼，後端生成 code 並回傳完整資料 */
export function createAccessCode(data: CreateAccessCodeData): Promise<AccessCode> {
  return api.post<ApiResponse<AccessCode>>('/access-codes', data).then(unwrap)
}

/** 更新存取碼（label / dailyTokenLimit / expiresAt） */
export function updateAccessCode(id: string, data: UpdateAccessCodeData): Promise<AccessCode> {
  return api.put<ApiResponse<AccessCode>>(`/access-codes/${id}`, data).then(unwrap)
}

/** 啟用 / 停用存取碼 */
export function setAccessCodeActive(id: string, isActive: boolean): Promise<AccessCode> {
  return api.patch<ApiResponse<AccessCode>>(`/access-codes/${id}/active`, { isActive }).then(unwrap)
}

/** 刪除存取碼 */
export function deleteAccessCode(id: string): Promise<unknown> {
  return api.delete(`/access-codes/${id}`)
}
