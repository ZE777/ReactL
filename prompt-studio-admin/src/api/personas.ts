import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { Persona } from '../types/persona'
import type { PromptSections } from '../types/persona'

function parsePersonaSections(persona: Persona): Persona {
  if (persona.promptSections && typeof persona.promptSections === 'string') {
    try {
      return { ...persona, promptSections: JSON.parse(persona.promptSections as unknown as string) as PromptSections }
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
