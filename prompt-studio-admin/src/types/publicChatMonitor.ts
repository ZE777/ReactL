/** 前台聊天監控：對話列表項目（以工作階段分組），對應後端 PublicChatConversationSummary */
export type PublicChatConversation = {
  /** 對話工作階段識別碼 */
  sessionId: string
  /** 存取碼字串快照（匿名為 null） */
  accessCodeText: string | null
  /** 存取碼目前的備註標籤（碼已刪除或匿名時為 null） */
  accessCodeLabel: string | null
  /** 此對話最近一次使用的角色名稱（無角色或角色已刪除時為 null） */
  personaName: string | null
  /** 此對話最近一次使用的 AI 模型（providerId:modelId） */
  modelType: string | null
  /** 此對話的訊息總數 */
  messageCount: number
  /** 此對話累計 token 用量（輸入 + 輸出） */
  totalTokens: number
  /** 第一則訊息時間（ISO 字串） */
  firstMessageAt: string
  /** 最後一則訊息時間（ISO 字串） */
  lastMessageAt: string
}

/** 前台聊天監控：單則訊息，對應後端 PublicChatLogItem */
export type PublicChatLogItem = {
  id: string
  /** user / assistant */
  role: string
  content: string
  /** 此則訊息當下使用的角色名稱（無角色或已刪除時為 null） */
  personaName: string | null
  modelType: string | null
  tokensIn: number
  tokensOut: number
  createdAt: string
}
