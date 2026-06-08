import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { PublicChatConversation, PublicChatLogItem } from '../types/publicChatMonitor'

/** 後端 PagedResponse<T> 形狀（與 MonitorPage 共用） */
export type PagedResponse<T> = {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** 取得前台聊天對話列表（需 Admin 權限） */
export function fetchPublicChatConversations(
  params: { page: number; pageSize?: number; search?: string },
): Promise<PagedResponse<PublicChatConversation>> {
  const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize ?? 30) })
  if (params.search?.trim()) qs.set('search', params.search.trim())
  return api
    .get<ApiResponse<PagedResponse<PublicChatConversation>>>(`/public-chat-monitor/conversations?${qs}`)
    .then(unwrap)
}

/** 取得聊天記錄保留天數（逾期自動清除；0 = 永久保留） */
export function fetchPublicChatRetentionDays(): Promise<number> {
  return api.get<ApiResponse<number>>('/public-chat-monitor/retention-days').then(unwrap)
}

/** 取得指定對話的完整訊息記錄（需 Admin 權限） */
export function fetchPublicChatMessages(
  params: { sessionId: string; page: number; pageSize?: number },
): Promise<PagedResponse<PublicChatLogItem>> {
  const qs = new URLSearchParams({
    sessionId: params.sessionId,
    page: String(params.page),
    pageSize: String(params.pageSize ?? 50),
  })
  return api
    .get<ApiResponse<PagedResponse<PublicChatLogItem>>>(`/public-chat-monitor/messages?${qs}`)
    .then(unwrap)
}
