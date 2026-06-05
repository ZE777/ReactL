/** 存取碼（邀請連結 / 存取權限），對應後端 AccessCodeResponse */
export type AccessCode = {
  id: string
  /** 後端生成的存取碼 */
  code: string
  label: string | null
  /** 每日 token 上限；0 代表不限制 */
  dailyTokenLimit: number
  /** 過期時間（ISO 字串）；null 代表永不過期 */
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  /** 今日已用 token 數 */
  usedTokensToday: number
  /** 今日請求次數 */
  requestsToday: number
}
