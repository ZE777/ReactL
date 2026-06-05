export type BotPlatform = 'line' | 'discord'

export type BotBinding = {
  id: string
  platform: BotPlatform
  botName: string
  tokenLastFour: string
  botTokenMasked: string    // "••••" + tokenLastFour, computed on fetch
  channelSecretMasked?: string
  modelType: string
  isEnabled: boolean
  personaId: string | null
  personaName: string | null
  /** 後端組裝好的完整 Webhook URL，前端直接複製使用 */
  webhookUrl: string
  /** 此 Bot 專用的 Webhook 基礎 URL；null 代表使用系統預設 */
  webhookBaseUrl: string | null
  /** Discord Application ID（Discord 平台專用） */
  discordApplicationId: string | null
  /** Discord Application Public Key（Discord 平台專用） */
  discordPublicKey: string | null
  /**
   * Bot 憑證/設定驗證結果（持久化，LINE/Discord 共用，列表也會帶出）：
   * true=有效、false=無效、null/undefined=尚未驗證。
   */
  credentialValid?: boolean | null
  /** 憑證驗證失敗原因（人類可讀，僅建立/更新/換 Token 回應有；不持久化） */
  credentialError?: string | null
  createdAt: string
  updatedAt: string
}

export type BotFormData = {
  platform: BotPlatform
  botName: string
  botToken: string
  channelSecret?: string
  personaId: string
  modelType: string
  /** Bot 專屬 Webhook 基礎 URL（選填）；留空則使用系統預設 */
  webhookBaseUrl?: string
  /** Discord Application ID（Discord 平台必填） */
  discordApplicationId?: string
  /** Discord Application Public Key（Discord 平台必填） */
  discordPublicKey?: string
}
