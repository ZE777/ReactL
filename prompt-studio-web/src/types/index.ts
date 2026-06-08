/** AI 模型識別碼，格式 "providerId:modelId"，例如 "groq:llama-3.3-70b-versatile"（由後端定義，故為開放字串）*/
export type ModelType = string

export type MessageRole = 'user' | 'assistant' | 'system'

export type Message = {
  id: string
  role: MessageRole
  content: string
  createdAt?: string
  /** 回應被後端 token 上限截斷（SSE 收到 truncated chunk） */
  truncated?: boolean
}

export type Persona = {
  id: string
  name: string
  emoji?: string
  description?: string
  isBuiltin?: boolean
  userId?: string | null
  currentVersion?: number
  /** 前台公開聊天使用此角色時的 AI 模型（格式 providerId:modelId） */
  modelType?: string
}

export type SharedConversation = {
  id: string
  title: string
  personaName?: string
  personaEmoji?: string
  personaId?: string
  isDeleted: boolean
  messages: Message[]
  createdAt: string
  shareSlug: string
}

export type ApiError = {
  detail: string
  status?: number
}
