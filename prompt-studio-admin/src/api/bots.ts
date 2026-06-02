import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { BotBinding } from '../types/bot'

export async function fetchBots(): Promise<BotBinding[]> {
  const items = await api.get<ApiResponse<BotBinding[]>>('/bot-bindings').then(unwrap)
  return (items ?? []).map(b => ({ ...b, botTokenMasked: '••••' + b.tokenLastFour }))
}
