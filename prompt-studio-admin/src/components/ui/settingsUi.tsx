import type { ReactNode } from 'react'
import Card from './Card'

/** 設定類頁面的卡片區塊（標題 + 描述 + 內容） */
export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-700/25">
        <p className="text-lg font-semibold text-slate-700 dark:text-zinc-200">{title}</p>
        {description && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </Card>
  )
}

/** 設定區塊內的單列欄位（左標題 + 右內容） */
export function FieldRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 py-4 border-b border-dashed border-slate-200/70 dark:border-zinc-700/25 last:border-0 last:pb-0 first:pt-0">
      <div className="sm:w-36 sm:flex-shrink-0">
        <p className="text-base text-slate-600 dark:text-zinc-400">{label}</p>
        {hint && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

/** 密碼/金鑰欄位的顯示/隱藏眼睛圖示 */
export function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
