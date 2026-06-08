export type PromptSections = {
  role?: string
  background?: string
  task?: string
  format?: string
  constraints?: string
  examples?: string
}

export type PersonaBuiltinGroup = 'Official' | 'User'

export type Persona = {
  id: string
  name: string
  emoji?: string
  systemPrompt?: string
  promptSections?: PromptSections
  currentVersion?: number
  isBuiltin?: boolean
  /** 'Official' = 系統內建 | 'User' = 使用者自訂 */
  builtinGroup: PersonaBuiltinGroup
  /** 前台公開聊天使用此角色時的 AI 模型（格式 providerId:modelId） */
  modelType?: string
  userId: string
  createdAt?: string
  updatedAt?: string
}

export type PersonaFormData = {
  name: string
  emoji?: string
  isBuiltin: boolean
  /** 前台公開聊天使用的 AI 模型（providerId:modelId） */
  modelType: string
  promptSections: PromptSections
}

export type PersonaVersion = {
  id: string
  personaId?: string
  version: number
  systemPrompt: string
  promptSections?: PromptSections
  changeNote?: string
  createdAt: string
}
