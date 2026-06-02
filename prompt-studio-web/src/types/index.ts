export type ModelType = 'gemini-flash' | 'groq-llama'

export type MessageRole = 'user' | 'assistant' | 'system'

export type Message = {
  id: string
  role: MessageRole
  content: string
  createdAt?: string
}

export type Persona = {
  id: number
  name: string
  emoji?: string
  description?: string
  systemPrompt?: string
  isBuiltin?: boolean
}

export type SharedConversation = {
  id: string
  title: string
  personaName?: string
  personaEmoji?: string
  messages: Message[]
  createdAt: string
  shareSlug: string
}

export type ApiError = {
  detail: string
  status?: number
}
