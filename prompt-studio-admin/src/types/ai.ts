/** AI 模型定義 */
export type AiModel = {
  /** 模型識別碼（用於組合 provider:model 字串） */
  id: string
  /** 顯示名稱 */
  displayName: string
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
