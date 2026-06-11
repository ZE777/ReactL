import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { BotBinding, TrustedUser } from '../types/bot'

export async function fetchBots(): Promise<BotBinding[]> {
  const items = await api.get<ApiResponse<BotBinding[]>>('/bot-bindings').then(unwrap)
  return (items ?? []).map(b => ({ ...b, botTokenMasked: '••••' + b.tokenLastFour }))
}

// ── 信任名單（動態白名單）─────────────────────────────────────────────────
export async function fetchTrustedUsers(botId: string): Promise<TrustedUser[]> {
  return (await api.get<ApiResponse<TrustedUser[]>>(`/bot-bindings/${botId}/trusted-users`).then(unwrap)) ?? []
}

export async function addTrustedUser(
  botId: string,
  body: { discordUserId: string; label?: string; tier?: string; systemRole?: 'owner' | 'trusted' },
): Promise<TrustedUser> {
  return api.post<ApiResponse<TrustedUser>>(`/bot-bindings/${botId}/trusted-users`, body).then(unwrap)
}

export async function removeTrustedUser(botId: string, discordUserId: string): Promise<void> {
  await api.delete(`/bot-bindings/${botId}/trusted-users/${discordUserId}`)
}
