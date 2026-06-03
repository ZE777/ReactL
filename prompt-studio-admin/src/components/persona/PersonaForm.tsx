import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function close() {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(o => !o)}
        className="w-14 h-10 flex items-center justify-center text-lg rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-violet-400 dark:hover:border-violet-600 transition-colors cursor-pointer"
        title="選擇 Emoji"
      >
        {value || '🤖'}
      </button>

      {open && (
        <div role="dialog" aria-label="選擇 Emoji" className="absolute top-10 left-0 z-50 w-56 p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                type="button"
                aria-label={emoji}
                onClick={() => { onChange(emoji); close() }}
                className={`w-6 h-6 flex items-center justify-center text-base rounded hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${value === emoji ? 'bg-violet-100 dark:bg-violet-900/40' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); close() }}
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
const REQUIRED_SECTIONS: (keyof PromptSections)[] = ['role', 'background', 'task']

/** 後端有時會把整個 JSON 字串塞入 role 欄位，而非分區回傳；這裡統一正規化 */
function parseEnhancedSections(raw: PromptSections): PromptSections {
  const roleVal = raw.role?.trim() ?? ''
  // 加長度上限防止解析超大字串，65536 遠超正常 prompt 範圍
  if (roleVal.startsWith('{') && roleVal.length < 65536) {
    try {
      const parsed = JSON.parse(roleVal) as Record<string, unknown>
      return {
        role:        typeof parsed.role        === 'string' ? parsed.role        : raw.role,
        background:  typeof parsed.background  === 'string' ? parsed.background  : raw.background,
        task:        typeof parsed.task        === 'string' ? parsed.task        : raw.task,
        format:      typeof parsed.format      === 'string' ? parsed.format      : raw.format,
        constraints: typeof parsed.constraints === 'string' ? parsed.constraints : raw.constraints,
        examples: Array.isArray(parsed.examples)
          ? (parsed.examples as string[]).join('\n')
          : typeof parsed.examples === 'string'
            ? parsed.examples
            : raw.examples,
      }
    } catch {
      // 解析失敗就照原始結構走
    }
  }
  const examples = Array.isArray((raw as Record<string, unknown>).examples)
    ? ((raw as Record<string, unknown>).examples as string[]).join('\n')
    : raw.examples
  return { ...raw, examples }
}

export default function PersonaForm({ persona, onSuccess, hideHeader, onDiscard }: Props) {
  const queryClient = useQueryClient()
  const { push: toast } = useToast()
  const isEdit = !!persona

  const { register, handleSubmit, formState: { errors, isDirty }, reset, watch, control, setValue } = useForm<BaseFields>({
    defaultValues: {
      name: persona?.name ?? '',
      emoji: persona?.emoji ?? '',
    },
    mode: 'onChange',
  })

  const [sections, setSections] = useState<PromptSections>(persona?.promptSections ?? EMPTY_SECTIONS)
  const [isBuiltin, setIsBuiltin] = useState(persona?.isBuiltin ?? false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [enhancedKeys, setEnhancedKeys] = useState<Set<keyof PromptSections>>(new Set())
  /** 新增模式初始為 true（開啟即提示必填）；編輯模式初始為 false（touched-aware） */
  const [submittedOnce, setSubmittedOnce] = useState(!isEdit)
  /** 已被 blur 過的 section 欄位（用於 touched 驗證） */
  const [touchedSections, setTouchedSections] = useState<Set<keyof PromptSections>>(new Set())
  const enhanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 錯誤只在送出過或 blur 過的欄位顯示，避免初次開啟即全紅
  const sectionErrors = useMemo((): Partial<Record<keyof PromptSections, string>> => {
    if (submittedOnce) {
      return Object.fromEntries(
        REQUIRED_SECTIONS
          .filter(k => !sections[k]?.trim())
          .map(k => [k, '此欄位為必填'])
      )
    }
    return Object.fromEntries(
      [...touchedSections]
        .filter(k => REQUIRED_SECTIONS.includes(k) && !sections[k]?.trim())
        .map(k => [k, '此欄位為必填'])
    )
  }, [sections, submittedOnce, touchedSections])

  // 切換 persona 時重置表單與 touch 狀態；依賴 persona?.id 確保只在切換時觸發
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    reset({ name: persona?.name ?? '', emoji: persona?.emoji ?? '' })
    setSections(persona?.promptSections ?? EMPTY_SECTIONS)
    setIsBuiltin(persona?.isBuiltin ?? false)
    // 新增模式保持 true（開啟即顯示必填紅框）；編輯模式重置為 false
    setSubmittedOnce(persona == null)
    setTouchedSections(new Set())
  }, [persona?.id])

  // 清除強化 highlight timer，避免 unmount 後呼叫 setState
  useEffect(() => {
    return () => { if (enhanceTimerRef.current) clearTimeout(enhanceTimerRef.current) }
  }, [])

  const mutation = useMutation({
    mutationFn: (data: PersonaFormData & { systemPrompt: string }) => {
      const body = {
        name: data.name,
        emoji: data.emoji,
        systemPrompt: data.systemPrompt,
        promptSections: JSON.stringify(data.promptSections),
        isBuiltin: data.isBuiltin,
      }
      return isEdit
        ? api.put<ApiResponse<Persona>>(`/personas/${persona!.id}`, body).then(unwrap)
        : api.post<ApiResponse<Persona>>('/personas', body).then(unwrap)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['persona-detail', persona!.id] })
      } else {
        reset()
        setSections(EMPTY_SECTIONS)
        setSubmittedOnce(true)
        setTouchedSections(new Set())
      }
      onSuccess?.()
      toast('success', isEdit ? 'Persona 已更新' : 'Persona 建立成功')
    },
    onError: (error: AxiosError<ApiError>) => {
      toast('error', error.response?.data?.detail ?? (isEdit ? '更新失敗' : '建立失敗，請稍後再試'))
    },
  })

  const enhanceMutation = useMutation({
    mutationFn: () =>
      api.post<ApiResponse<{ sections: PromptSections }>>('/personas/enhance-prompt', { sections }).then(unwrap),
    onSuccess: (result) => {
      const e = parseEnhancedSections(result.sections)
      const changed = new Set<keyof PromptSections>()
      if (e.role?.trim())        changed.add('role')
      if (e.background?.trim())  changed.add('background')
      if (e.task?.trim())        changed.add('task')
      if (e.format?.trim())      changed.add('format')
      if (e.constraints?.trim()) changed.add('constraints')
      if (e.examples?.trim())    changed.add('examples')
      setSections(prev => ({
        ...prev,
        ...(e.role?.trim()        && { role: e.role }),
        ...(e.background?.trim()  && { background: e.background }),
        ...(e.task?.trim()        && { task: e.task }),
        ...(e.format?.trim()      && { format: e.format }),
        ...(e.constraints?.trim() && { constraints: e.constraints }),
        ...(e.examples?.trim()    && { examples: e.examples }),
      }))
      setEnhancedKeys(changed)
      if (enhanceTimerRef.current) clearTimeout(enhanceTimerRef.current)
      enhanceTimerRef.current = setTimeout(() => setEnhancedKeys(new Set()), 2500)
      toast('info', 'AI 強化完成，請確認後儲存')
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status
      // 5xx 與網路錯誤已由全域攔截器顯示 Toast，避免重複
      if (status && status < 500) {
        toast('error', error.response?.data?.detail ?? 'AI 強化失敗，請稍後再試')
      }
    },
  })

  function handleEnhance() {
    const hasContent = Object.values(sections).some(v => v?.trim())
    if (!hasContent) {
      toast('warning', '請先填寫 Prompt 內容')
      return
    }
    enhanceMutation.mutate()
  }

  function onSubmit(base: BaseFields) {
    setSubmittedOnce(true)
    // 用即時計算避免 stale closure 的 sectionErrors
    const hasErrors = REQUIRED_SECTIONS.some(k => !sections[k]?.trim())
    if (hasErrors) return
    mutation.mutate({ ...base, isBuiltin, promptSections: sections, systemPrompt: assembleSystemPrompt(sections) })
  }

  const isEnhancing = enhanceMutation.isPending

  // 新增模式：name >= 2 字 且三個必填 section 皆有內容
  const nameValue = useWatch({ control, name: 'name' })
  const isCreateFormValid = !isEdit &&
    (nameValue?.trim().length ?? 0) >= 2 &&
    REQUIRED_SECTIONS.every(k => !!sections[k]?.trim())

  // 編輯模式：有實際變更才讓儲存/放棄按鈕亮起
  const hasChanges = useMemo(() => {
    if (!isEdit) return true
    const sectionsChanged = JSON.stringify(sections) !== JSON.stringify(persona!.promptSections ?? EMPTY_SECTIONS)
    const builtinChanged = isBuiltin !== (persona!.isBuiltin ?? false)
    return isDirty || sectionsChanged || builtinChanged
  }, [isEdit, isDirty, sections, isBuiltin, persona])

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
        <div className="w-24 flex-shrink-0 pt-1">
          <p className="text-sm text-slate-600 dark:text-zinc-400">基本資料</p>
        </div>
        <div className="flex items-end gap-3 flex-1">
          <EmojiPicker
            value={watch('emoji') ?? ''}
            onChange={v => setValue('emoji', v)}
          />
          <div className="flex-1">
            <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">
              Persona 名稱 <span className="text-red-400">*</span>
            </label>
            <Input
              {...register('name', { required: '請填寫名稱', minLength: { value: 2, message: '名稱至少要兩個字' } })}
              placeholder="例：技術顧問"
              error={
                submittedOnce
                  ? (!nameValue?.trim() ? '請填寫名稱' : (nameValue.trim().length < 2 ? '名稱至少要兩個字' : undefined))
                  : errors.name?.message
              }
            />
          </div>
        </div>
      </div>

      {/* 公開設定 */}
      <div className="flex items-center gap-4 py-4 border-b border-dashed border-slate-200/70 dark:border-zinc-700/25">
        <div className="w-24 flex-shrink-0">
          <p className="text-sm text-slate-600 dark:text-zinc-400">公開設定</p>
        </div>
        <div className="flex items-center justify-between flex-1">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">公開顯示於前台</p>
            <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">啟用後此 Persona 可在前台頁面被選用</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isBuiltin}
            onClick={() => setIsBuiltin(v => !v)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
              isBuiltin ? 'bg-violet-500' : 'bg-slate-200 dark:bg-zinc-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                isBuiltin ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Prompt Builder */}
      <div className="py-4">
        <PromptBuilder
          value={sections}
          onChange={setSections}
          onEnhance={handleEnhance}
          isEnhancing={isEnhancing}
          sectionErrors={sectionErrors}
          enhancedKeys={enhancedKeys}
          onSectionBlur={key => setTouchedSections(prev => new Set([...prev, key]))}
        />
      </div>

      {/* 操作列：強化中鎖定送出與放棄，避免提交舊內容或中途離開 */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant={isEdit && !hasChanges ? 'ghost' : 'danger-ghost'}
          size="sm"
          disabled={isEnhancing}
          onClick={() => {
            if (hasChanges) {
              setShowDiscardModal(true)
            } else {
              if (isEdit) onDiscard?.()
              else { reset(); setSections(EMPTY_SECTIONS) }
            }
          }}
        >
          {isEdit ? '放棄變更' : '清除'}
        </Button>
        <Button type="submit" size="sm" loading={mutation.isPending} disabled={isEnhancing || (isEdit ? !hasChanges : !isCreateFormValid)}>
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
