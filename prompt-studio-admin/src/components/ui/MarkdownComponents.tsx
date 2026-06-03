import { useState, useRef } from 'react'
import type { Components } from 'react-markdown'

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 複製失敗（HTTP 或特殊瀏覽器設定），靜默忽略
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded bg-slate-200/80 dark:bg-zinc-700/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
    >
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
          複製
        </>
      )}
    </button>
  )
}

/// ChatGPT 風格程式碼區塊：深色標題列（語言標籤左、複製按鈕右）+ 深色程式碼區
function CodeBlock({ children, className, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const lang = (className ?? '').replace('language-', '') || 'code'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(preRef.current?.querySelector('code')?.textContent ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 複製失敗靜默忽略
    }
  }

  return (
    <div className="rounded-xl overflow-hidden my-3 border border-zinc-700/60 bg-zinc-950">
      {/* 標題列：語言標籤左、複製按鈕右、永遠可見 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/60">
        <span className="text-xs font-mono text-zinc-400">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">已複製</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              複製程式碼
            </>
          )}
        </button>
      </div>
      {/* 程式碼區：透明背景讓外層深色容器顯現，覆寫 prose/hljs 預設背景 */}
      <pre
        ref={preRef}
        className={`${className ?? ''} !m-0 !rounded-none !bg-transparent !border-0 px-4 py-4 overflow-x-auto text-sm`}
        {...props}
      >
        {children}
      </pre>
    </div>
  )
}

/// 表格：右上角顯示複製按鈕，複製為 TSV 格式
function Table({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  const tableRef = useRef<HTMLTableElement>(null)

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

  return (
    <div className="relative group/table overflow-x-auto my-2">
      <div className="absolute top-3 right-4 opacity-0 group-hover/table:opacity-100 transition-opacity z-10">
        <CopyButton getText={getTableText} />
      </div>
      <table ref={tableRef} {...props}>
        {children}
      </table>
    </div>
  )
}

/// 傳入 ReactMarkdown components prop 以啟用程式碼區塊與表格的複製功能
export const markdownComponents: Components = {
  pre: CodeBlock as Components['pre'],
  table: Table as Components['table'],
}
