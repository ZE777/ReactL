export type BotPlatform = 'line' | 'discord'

export type BotBinding = {
  id: string
  platform: BotPlatform
  botName: string
  tokenLastFour: string
  botTokenMasked: string    // "••••" + tokenLastFour, computed on fetch
  channelSecretMasked?: string
  modelType: string
  isEnabled: boolean
  personaId: string | null
  personaName: string | null
  createdAt: string
  updatedAt: string
}

export type BotFormData = {
  platform: BotPlatform
  botName: string
  botToken: string
  channelSecret?: string
  personaId: string
  modelType: string
}
