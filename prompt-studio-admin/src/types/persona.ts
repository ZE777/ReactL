export type PromptSections = {
  role?: string
  background?: string
  task?: string
  format?: string
  constraints?: string
  examples?: string
}

export type Persona = {
  id: string
  name: string
  emoji?: string
  systemPrompt?: string
  promptSections?: PromptSections
  currentVersion?: number
  isBuiltin?: boolean
  createdAt?: string
  updatedAt?: string
}

export type PersonaFormData = {
  name: string
  emoji?: string
  promptSections: PromptSections
}

export type PersonaVersion = {
  id: string
  personaId: string
  version: number
  systemPrompt: string
  promptSections?: PromptSections
  changeNote?: string
  createdAt: string
}
