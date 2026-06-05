import { useMemo, useState } from 'react'
import type { PromptSections } from '../../types/persona'
import { useToast } from '../../context/ToastContext'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import GhostButton from '../ui/GhostButton'

type SectionDef = {
  key: keyof PromptSections
  label: string
  placeholder: string
  required: boolean
  hint?: string
}

const SECTIONS: SectionDef[] = [
  { key: 'role',        label: '角色定義',  required: true,  hint: '這個 AI 是誰',       placeholder: '你是一位專業的客服人員' },
  { key: 'background',  label: '背景說明',  required: true,  hint: '所在情境',            placeholder: '服務於一家電商平台' },
  { key: 'task',        label: '任務描述',  required: true,  hint: '主要職責',            placeholder: '負責處理退換貨、訂單查詢等客服問題' },
  { key: 'format',      label: '輸出格式',  required: false, hint: '回答的格式要求',      placeholder: '條列式回答，不超過 3 點，語氣親切' },
  { key: 'constraints', label: '限制條件',  required: false, hint: '不能做什麼',          placeholder: '不討論競品，不做任何退款承諾' },
  { key: 'examples',    label: '範例對話',  required: false, hint: '輸入輸出範例（可選）', placeholder: 'Q: 我要退貨\nA: 您好，請提供訂單編號...' },
]

export function assembleSystemPrompt(s: PromptSections): string {
  const parts: string[] = []
  if (s.role?.trim())        parts.push(s.role.trim())
  if (s.background?.trim())  parts.push(`背景：${s.background.trim()}`)
  if (s.task?.trim())        parts.push(`任務：${s.task.trim()}`)
  if (s.format?.trim())      parts.push(`回覆格式：${s.format.trim()}`)
  if (s.constraints?.trim()) parts.push(`限制：${s.constraints.trim()}`)
  if (s.examples?.trim())    parts.push(`範例：\n${s.examples.trim()}`)
  return parts.join('\n\n')
}

function calcCompleteness(s: PromptSections): { score: number; items: { key: keyof PromptSections; label: string; filled: boolean; required: boolean }[] } {
  const items = SECTIONS.map(sec => ({
    key: sec.key,
    label: sec.label,
    filled: !!s[sec.key]?.trim(),
    required: sec.required,
  }))
  const filled = items.filter(i => i.filled).length
  return { score: Math.round((filled / SECTIONS.length) * 100), items }
}

type Props = {
  value: PromptSections
  onChange: (v: PromptSections) => void
  onEnhance?: () => void
  isEnhancing?: boolean
  sectionErrors?: Partial<Record<keyof PromptSections, string>>
  enhancedKeys?: Set<keyof PromptSections>
  onSectionBlur?: (key: keyof PromptSections) => void
}

export default function PromptBuilder({ value, onChange, onEnhance, isEnhancing, sectionErrors, enhancedKeys, onSectionBlur }: Props) {
  const { push: toast } = useToast()
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const assembled = useMemo(() => assembleSystemPrompt(value), [value])
  const { score, items } = useMemo(() => calcCompleteness(value), [value])

  function setField(key: keyof PromptSections, v: string) {
    onChange({ ...value, [key]: v })
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(assembled)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast('error', '複製失敗，請手動選取文字')
    }
  }

  return (
    <div className="flex gap-5">
      {/* 左側：Section 欄位 */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Prompt Builder</p>
          {isEnhancing && (
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md">
              <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" strokeWidth="2.5" className="stroke-violet-200 dark:stroke-violet-800" />
                <circle cx="12" cy="12" r="9" strokeWidth="2.5" strokeDasharray="18 38" strokeLinecap="round" className="stroke-violet-600 dark:stroke-violet-400" />
              </svg>
              AI 強化中…
            </span>
          )}
          <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-700" />
        </div>

        {SECTIONS.map(s => (
          <div key={s.key} className="flex items-start gap-4 py-3 border-b border-dashed border-slate-200/70 dark:border-zinc-700/25 last:border-0">
            <div className="w-24 flex-shrink-0 pt-1">
              <p className="text-sm text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                {s.label}
                {s.required && <span className="text-red-400">*</span>}
              </p>
              {s.hint && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">{s.hint}</p>}
            </div>
            <div className="flex-1">
              <Textarea
                value={value[s.key] ?? ''}
                onChange={e => setField(s.key, e.target.value)}
                onBlur={() => onSectionBlur?.(s.key)}
                placeholder={s.placeholder}
                rows={s.key === 'examples' ? 3 : 2}
                disabled={isEnhancing}
                error={sectionErrors?.[s.key]}
                className={enhancedKeys?.has(s.key) ? 'ring-2 ring-amber-400/60 border-amber-300 dark:border-amber-600' : ''}
              />
            </div>
          </div>
        ))}

        {/* 動作列 */}
        <div className="flex items-center justify-between pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onEnhance}
            loading={isEnhancing}
            title="使用 AI 強化 Prompt 內容（後端串接後啟用）"
          >
            ✨ AI 強化
          </Button>
          <div className="flex gap-2">
            {assembled && (
              <GhostButton onClick={handleCopy} disabled={isEnhancing}>
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-500">已複製</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>複製 Prompt</span>
                  </>
                )}
              </GhostButton>
            )}
            <button
              type="button"
              onClick={() => setShowPreview(v => !v)}
              disabled={isEnhancing}
              className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded bg-slate-300/80 dark:bg-zinc-400/30 text-slate-800 dark:text-white hover:bg-slate-400 dark:hover:bg-zinc-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {showPreview ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  <span>隱藏預覽</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>預覽結果</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 組裝結果預覽 */}
        {showPreview && (
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl">
            <p className="text-sm text-slate-400 dark:text-zinc-400 mb-2">組裝後 System Prompt</p>
            {assembled ? (
              <pre className="text-sm text-slate-600 dark:text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">{assembled}</pre>
            ) : (
              <p className="text-sm text-slate-400 dark:text-zinc-400 italic">尚無內容，請填寫上方欄位</p>
            )}
          </div>
        )}
      </div>

      {/* 右側：完整度面板 */}
      <div className="w-44 flex-shrink-0">
        <CompletenessPanel score={score} items={items} />
      </div>
    </div>
  )
}

type CompletItem = { key: string; label: string; filled: boolean; required: boolean }

function CompletenessPanel({ score, items }: { score: number; items: CompletItem[] }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'
  const textColor = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-400'

  return (
    <div className="sticky top-6 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm text-slate-400 dark:text-zinc-400">完整度</p>
          <p className={`text-sm font-semibold ${textColor}`}>{score}%</p>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <span className={`text-sm ${item.filled ? 'text-emerald-500' : 'text-red-400'}`} aria-hidden="true">
              {item.filled ? '●' : '○'}
            </span>
            <span className="sr-only">{item.filled ? '已填寫' : '未填寫'}</span>
            <span className={`text-sm ${item.filled ? 'text-slate-600 dark:text-zinc-400' : 'text-slate-400 dark:text-zinc-400'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {score < 100 && (
        <p className="text-sm text-slate-400 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-700/25 pt-2">
          {score < 50 ? '⚠️ 建議補充必填項' : score < 80 ? '可考慮補充選填項' : '即將完成 🎉'}
        </p>
      )}
    </div>
  )
}
