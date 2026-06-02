export type PromptCategory = '寫作' | '程式' | '翻譯' | '其他'

export type PromptTemplate = {
  id: string
  title: string
  content: string
  category: PromptCategory
  tags: string[]
  usageCount: number
  createdAt?: string
  updatedAt?: string
}

export type PromptFormData = {
  title: string
  content: string
  category: PromptCategory
  tags: string   // comma-separated input string; parsed to array before API call
}
