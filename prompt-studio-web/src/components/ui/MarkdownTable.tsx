'use client'

import { useRef, useState, type ReactNode } from 'react'

/**
 * Markdown 表格：右上角 hover 顯示複製按鈕，複製為 TSV 格式。
 *
 * 由 Markdown 的 `table` 映射使用。為 Client Component（需 useState/clipboard），
 * 在分享頁（Server Component）內作為 client boundary 渲染，hydration 後才有複製功能。
 * 行為對齊後台 admin 的 MarkdownComponents Table。
 */
export default function MarkdownTable({ children }: { children?: ReactNode }) {
  const tableRef = useRef<HTMLTableElement>(null)
  const [copied, setCopied] = useState(false)

  function getTableText() {
    const rows = Array.from(tableRef.current?.querySelectorAll('tr') ?? [])
    return rows
      .map(row =>
        Array.from(row.querySelectorAll('th, td'))
          .map(cell => cell.textContent?.trim() ?? '')
          .join('\t')
      )
      .join('\n')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getTableText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 複製失敗（HTTP 或特殊瀏覽器設定），靜默忽略
    }
  }

  return (
    <div className="relative group/table my-3 overflow-x-auto">
      <div className="absolute top-1 right-1 opacity-0 group-hover/table:opacity-100 transition-opacity z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-200/80 dark:bg-zinc-700/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-500">已複製</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              複製
            </>
          )}
        </button>
      </div>
      <table ref={tableRef} className="w-full text-xs border-collapse">{children}</table>
    </div>
  )
}
