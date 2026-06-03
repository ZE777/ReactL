export type ModelType = 'gemini-flash' | 'groq-llama'

export type MessageRole = 'user' | 'assistant' | 'system'

export type Message = {
  id: string
  role: MessageRole
  content: string
  createdAt?: string
}

export type Persona = {
  id: string
  name: string
  emoji?: string
  description?: string
  isBuiltin?: boolean
  userId?: string | null
  currentVersion?: number
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
