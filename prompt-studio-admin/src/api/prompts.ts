import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { PromptTemplate } from '../types/prompt'

function parseTagsFromApi(raw: PromptTemplate & { tags: string | string[] | null }): PromptTemplate {
  const tags = typeof raw.tags === 'string'
    ? raw.tags.split(',').map(t => t.trim()).filter(Boolean)
    : (raw.tags ?? [])
  return { ...raw, tags }
}

export async function fetchPrompts(): Promise<PromptTemplate[]> {
  const items = await api.get<ApiResponse<PromptTemplate[]>>('/prompt-templates').then(unwrap)
  return (items ?? []).map(t => parseTagsFromApi(t as PromptTemplate & { tags: string | string[] | null }))
}
