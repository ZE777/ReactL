/** AI 模型定義 */
export type AiModel = {
  /** 模型識別碼（用於組合 provider:model 字串） */
  id: string
  /** 顯示名稱 */
  displayName: string
  /** 是否推薦用於 function-calling 場景（如 Discord agent 工具）；非推薦會在選單提示 */
  recommendedForTools?: boolean
}

/** AI 供應商定義 */
export type AiProvider = {
  /** 供應商識別碼 */
  id: string
  /** 顯示名稱 */
  displayName: string
  /** 是否已設定 API Key */
  isConfigured: boolean
  /** 此供應商提供的模型列表 */
  models: AiModel[]
}

/** 使用者自帶的 AI 金鑰（後端永不回傳原文，只回後 4 碼） */
export type AiKey = {
  id: string
  /** 供應商識別碼，對應 AiProvider.id */
  providerId: string
  /** 供應商顯示名稱 */
  providerDisplayName: string
  /** 金鑰後 4 碼，顯示用 */
  keyLastFour: string
  isActive: boolean
  /** 是否為系統預設金鑰（一般使用者清單不會出現） */
  isSystem: boolean
  createdAt: string
  updatedAt: string
}
