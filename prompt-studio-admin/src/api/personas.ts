import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { Persona } from '../types/persona'
import type { PromptSections } from '../types/persona'

function isString(v: unknown): v is string { return typeof v === 'string' }

function parsePersonaSections(persona: Persona): Persona {
  // 後端有時以 JSON 字串形式回傳 promptSections（已知後端設計問題）
  if (isString(persona.promptSections)) {
    try {
      return { ...persona, promptSections: JSON.parse(persona.promptSections) as PromptSections }
    } catch {
      return { ...persona, promptSections: undefined }
    }
  }
  return persona
}

export async function fetchPersonas(): Promise<Persona[]> {
  return api.get<ApiResponse<Persona[]>>('/personas').then(unwrap)
}

export async function fetchPersonaDetail(id: string): Promise<Persona> {
  const persona = await api.get<ApiResponse<Persona>>(`/personas/${id}`).then(unwrap)
  return parsePersonaSections(persona)
}
