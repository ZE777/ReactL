import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { Persona, PersonaFormData, PromptSections } from '../../types/persona'
import type { ApiError, ApiResponse } from '../../types/api'
import api, { unwrap } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import PromptBuilder, { assembleSystemPrompt } from './PromptBuilder'

const EMOJI_OPTIONS = [
  '🤖','🧠','🎯','💡','📝','🔬','🎨','👨‍💻','👩‍💻','📊',
  '🗣️','🤝','💬','🔧','🌐','📚','⚡','🛡️','🎭','🔮',
  '🌟','💼','🚀','🎓','🧑‍🏫','🕵️','🧑‍🔬','📣','🧩','🦊',
  '🐉','🌈','🔑','⚙️','🏆','🎪','🧬','🌿','💎','🎲',
]

function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-14 h-9 flex items-center justify-center text-lg rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-violet-400 dark:hover:border-violet-600 transition-colors cursor-pointer"
        title="選擇 Emoji"
      >
        {value || '🤖'}
      </button>

      {open && (
        <div className="absolute top-10 left-0 z-50 w-56 p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onChange(emoji); setOpen(false) }}
                className={`w-6 h-6 flex items-center justify-center text-base rounded hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${value === emoji ? 'bg-violet-100 dark:bg-violet-900/40' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="mt-1.5 w-full text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 text-center py-1 cursor-pointer transition-colors"
            >
              清除
            </button>
          )}
        </div>
      )}
    </div>
  )
}

type BaseFields = { name: string; emoji?: string }

type Props = {
  persona?: Persona
  onSuccess?: () => void
  hideHeader?: boolean
  /** 編輯模式下確認放棄變更後呼叫，由父層負責導回空選擇狀態 */
  onDiscard?: () => void
}

const EMPTY_SECTIONS: PromptSections = {}

export default function PersonaForm({ persona, onSuccess, hideHeader, onDiscard }: Props) {
  const queryClient = useQueryClient()
  const { push: toast } = useToast()
  const isEdit = !!persona

  const { register, handleSubmit, formState: { errors, isDirty }, reset, watch, setValue } = useForm<BaseFields>({
    defaultValues: {
      name: persona?.name ?? '',
      emoji: persona?.emoji ?? '',
    },
  })

  const [sections, setSections] = useState<PromptSections>(persona?.promptSections ?? EMPTY_SECTIONS)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)

  useEffect(() => {
    reset({
      name: persona?.name ?? '',
      emoji: persona?.emoji ?? '',
    })
    setSections(persona?.promptSections ?? EMPTY_SECTIONS)
  }, [persona, reset])

  const mutation = useMutation({
    mutationFn: (data: PersonaFormData & { systemPrompt: string }) => {
      const body = {
        name: data.name,
        emoji: data.emoji,
        systemPrompt: data.systemPrompt,
        promptSections: JSON.stringify(data.promptSections),
      }
      return isEdit
        ? api.put<ApiResponse<Persona>>(`/personas/${persona!.id}`, body).then(unwrap)
        : api.post<ApiResponse<Persona>>('/personas', body).then(unwrap)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['personas', persona!.id] })
      } else {
        reset()
        setSections(EMPTY_SECTIONS)
      }
      onSuccess?.()
      toast('success', isEdit ? 'Persona 已更新' : 'Persona 建立成功')
    },
    onError: (error: AxiosError<ApiError>) => {
      toast('error', error.response?.data?.detail ?? (isEdit ? '更新失敗' : '建立失敗，請稍後再試'))
    },
  })

  function onSubmit(base: BaseFields) {
    mutation.mutate({ ...base, promptSections: sections, systemPrompt: assembleSystemPrompt(sections) })
  }

  async function handleEnhance() {
    // 檢查至少有一個區塊有內容才發送
    const hasContent = Object.values(sections).some(v => v?.trim())
    if (!hasContent) {
      toast('warning', '請先填寫 Prompt 內容')
      return
    }
    setIsEnhancing(true)
    try {
      // 將各區塊原始內容傳給後端，AI 個別強化後以 sections 物件回傳
      const result = await api.post<ApiResponse<{ sections: PromptSections }>>('/personas/enhance-prompt', { sections }).then(unwrap)
      toast('info', 'AI 強化完成，請確認後儲存')
      // 只填入 AI 有回傳內容的欄位，避免 AI 未涵蓋的選填區塊被清空
      setSections(prev => {
        const enhanced = result.sections
        return {
          ...prev,
          ...(enhanced.role?.trim()        && { role: enhanced.role }),
          ...(enhanced.background?.trim()  && { background: enhanced.background }),
          ...(enhanced.task?.trim()        && { task: enhanced.task }),
          ...(enhanced.format?.trim()      && { format: enhanced.format }),
          ...(enhanced.constraints?.trim() && { constraints: enhanced.constraints }),
          ...(enhanced.examples?.trim()    && { examples: enhanced.examples }),
        }
      })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const status = axiosErr?.response?.status
      // 5xx 與網路錯誤已由全域攔截器顯示 Toast，避免重複
      if (status && status < 500) {
        toast('error', axiosErr.response?.data?.detail ?? 'AI 強化失敗，請稍後再試')
      }
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">
      {/* 標題列 */}
      {!hideHeader && (
        <div className="pb-5 mb-5 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-zinc-200">
            {isEdit ? `編輯 Persona — ${persona!.name}` : '新增 Persona'}
          </h3>
          <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">
            {isEdit ? `目前版本 v${persona!.currentVersion ?? 1}，儲存後自動快照` : '設定 AI 的角色與行為準則'}
          </p>
        </div>
      )}

      {/* 基本欄位 */}
      <div className="flex items-start gap-4 py-4 border-b border-dashed border-slate-200/70 dark:border-zinc-700/25">
        <div className="w-28 flex-shrink-0 pt-1">
          <p className="text-sm text-slate-600 dark:text-zinc-400">基本資料</p>
        </div>
        <div className="flex-1 flex gap-3">
          <div className="flex-shrink-0">
            <EmojiPicker
              value={watch('emoji') ?? ''}
              onChange={v => setValue('emoji', v)}
            />
          </div>
          <div className="flex-1">
            <Input
              {...register('name', { required: '請填寫名稱', minLength: { value: 2, message: '名稱至少要兩個字' } })}
              placeholder="例：技術顧問"
              error={errors.name?.message}
            />
          </div>
        </div>
      </div>

      {/* Prompt Builder */}
      <div className="py-4">
        <PromptBuilder
          value={sections}
          onChange={setSections}
          onEnhance={handleEnhance}
          isEnhancing={isEnhancing}
        />
      </div>

      {/* 操作列 */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="danger-ghost"
          size="sm"
          onClick={() => {
            const sectionsChanged = isEdit
              ? JSON.stringify(sections) !== JSON.stringify(persona!.promptSections ?? EMPTY_SECTIONS)
              : Object.keys(sections).length > 0
            if (isDirty || sectionsChanged) {
              // 有未儲存變更，用 Modal 確認
              setShowDiscardModal(true)
            } else {
              // 無變更：edit 模式直接返回，new 模式清空
              if (isEdit) onDiscard?.()
              else { reset(); setSections(EMPTY_SECTIONS) }
            }
          }}
        >
          {isEdit ? '放棄變更' : '清除'}
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? '儲存變更' : '新增 Persona'}
        </Button>
      </div>

      {/* 放棄變更確認 Modal */}
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title={isEdit ? '放棄變更' : '清除內容'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowDiscardModal(false)}>
              繼續編輯
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowDiscardModal(false)
                if (isEdit) {
                  onDiscard?.()
                } else {
                  reset()
                  setSections(EMPTY_SECTIONS)
                }
              }}
            >
              {isEdit ? '確認放棄' : '確認清除'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          {isEdit
            ? '有未儲存的變更，放棄後將返回選擇頁面，修改內容不會保留。'
            : '目前填寫的內容將全部清除，確定要繼續嗎？'}
        </p>
      </Modal>
    </form>
  )
}
