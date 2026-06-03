import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { unwrap } from '../../lib/api'
import type { ApiResponse } from '../../types/api'
import type { AiProvider } from '../../types/ai'
import Spinner from './Spinner'
import Button from './Button'

type PersonaOption = {
  id: string
  name: string
}

type Props = {
  open: boolean
  onClose: () => void
  /** 確認後回傳選取的模型值、對話名稱與角色 ID */
  onConfirm: (modelValue: string, title: string, personaId?: string | null) => void
  defaultValue?: string
  /** 是否顯示對話名稱輸入欄（新增對話時 true，切換模型時 false）*/
  showTitleInput?: boolean
  /** 傳入後顯示角色選擇（僅新增對話時使用）*/
  personas?: PersonaOption[]
}

/**
 * 從 "provider:model" 格式解析供應商 id
 * 若格式不符則回傳 null
 */
function parseProviderFromValue(value: string): { providerId: string; modelId: string } | null {
  const idx = value.indexOf(':')
  if (idx <= 0) return null
  return { providerId: value.slice(0, idx), modelId: value.slice(idx + 1) }
}

/**
 * 從供應商列表中找出第一個已設定且有模型的供應商的第一個模型
 */
function getFirstConfiguredModel(providers: AiProvider[]): string | null {
  for (const p of providers) {
    if (p.isConfigured && p.models.length > 0) {
      return `${p.id}:${p.models[0].id}`
    }
  }
  return null
}

/**
 * 驗證 defaultValue 在供應商列表中是否存在且對應供應商已設定
 */
function isValueValid(value: string, providers: AiProvider[]): boolean {
  const parsed = parseProviderFromValue(value)
  if (!parsed) return false
  const provider = providers.find(p => p.id === parsed.providerId)
  if (!provider || !provider.isConfigured) return false
  return provider.models.some(m => m.id === parsed.modelId)
}

export default function ModelPickerModal({
  open,
  onClose,
  onConfirm,
  defaultValue,
  showTitleInput = true,
  personas,
}: Props) {
  const [selected, setSelected] = useState<string>(defaultValue ?? '')
  const [title, setTitle] = useState('')
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('')

  const { data: providers, isLoading, error } = useQuery<AiProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: () => api.get<ApiResponse<AiProvider[]>>('/ai/providers').then(unwrap),
    enabled: open,
  })

  // 當資料載入後，根據 defaultValue 或第一個可用模型設定初始選取值
  useEffect(() => {
    if (!providers) return

    if (defaultValue && isValueValid(defaultValue, providers)) {
      setSelected(defaultValue)
    } else {
      const first = getFirstConfiguredModel(providers)
      if (first) setSelected(first)
    }
  }, [providers, defaultValue])

  // 重新開啟時重設選取值與名稱
  useEffect(() => {
    if (open) {
      if (defaultValue) setSelected(defaultValue)
      setTitle('')
      setSelectedPersonaId('')
    }
  }, [open, defaultValue])

  function handleConfirm() {
    if (!selected) return
    if (personas !== undefined) {
      onConfirm(selected, title.trim(), selectedPersonaId || null)
    } else {
      onConfirm(selected, title.trim())
    }
  }

  const confirmDisabled = !selected || isLoading

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal 面板 */}
      <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* 標題列 */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-700/25">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100">
              {showTitleInput ? '新增對話' : '選擇 AI 模型'}
            </h2>
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">
              {showTitleInput ? '填寫對話名稱、選擇模型與 Persona 角色' : '選擇供應商與模型後按「確認選用」'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 內容區 */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {/* 對話名稱輸入欄（僅新增對話時顯示） */}
          {showTitleInput && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-1.5">
                對話名稱
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="預設為「新對話」"
                autoFocus
                maxLength={100}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              />
            </div>
          )}

          {/* 角色選擇（僅新增對話時顯示） */}
          {personas !== undefined && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-1.5">
                Persona 角色
              </label>
              <select
                value={selectedPersonaId}
                onChange={e => setSelectedPersonaId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">（不指定角色）</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 py-6 justify-center text-slate-400 dark:text-zinc-400">
              <Spinner size="sm" />
              <span className="text-sm">載入模型列表...</span>
            </div>
          )}

          {error && (
            <div className="py-4 px-4 text-center border border-red-400 dark:border-red-500 rounded-lg">
              <p className="text-sm text-red-500 dark:text-red-400">無法載入模型列表，請稍後再試</p>
            </div>
          )}

          {!error && providers && providers.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400 dark:text-zinc-400">目前沒有可用的 AI 供應商</p>
            </div>
          )}

          {!error && providers && providers.length > 0 && (
            <div className="space-y-4">
              {providers.map((provider, providerIdx) => (
                <div key={provider.id}>
                  {/* 供應商標題列 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                      {provider.displayName}
                    </span>
                    {provider.isConfigured ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/40">
                        {/* 勾選圖示 */}
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        已設定
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/40">
                        {/* 鎖頭圖示 */}
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        未設定
                      </span>
                    )}
                  </div>

                  {/* 模型列表 */}
                  {provider.isConfigured ? (
                    <div className="space-y-1">
                      {provider.models.map(model => {
                        const value = `${provider.id}:${model.id}`
                        const isSelected = selected === value
                        return (
                          <label
                            key={model.id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border ${
                              isSelected
                                ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300/60 dark:border-violet-700/40'
                                : 'bg-slate-50 dark:bg-zinc-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <input
                              type="radio"
                              name="model-picker"
                              value={value}
                              checked={isSelected}
                              onChange={() => setSelected(value)}
                              className="accent-violet-600 w-3.5 h-3.5 flex-shrink-0"
                            />
                            <span className={`text-sm ${
                              isSelected
                                ? 'text-violet-700 dark:text-violet-300 font-medium'
                                : 'text-slate-600 dark:text-zinc-400'
                            }`}>
                              {model.displayName}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-700/25">
                      <p className="text-sm text-slate-400 dark:text-zinc-400 italic">
                        需設定 API Key 才能使用此供應商
                      </p>
                    </div>
                  )}

                  {/* 供應商之間的分隔線（最後一個不顯示） */}
                  {providerIdx < providers.length - 1 && (
                    <div className="mt-4 border-t border-slate-100 dark:border-zinc-700/25" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按鈕列 */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-700/25 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={confirmDisabled}
          >
            確認選用
          </Button>
        </div>
      </div>
    </div>
  )
}
