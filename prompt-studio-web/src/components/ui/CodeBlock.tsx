'use client'

import { useRef, useState, type ReactNode, type ReactElement } from 'react'
import 'highlight.js/styles/github-dark.css'

/**
 * 程式碼區塊：深色標題列（語言標籤左、複製按鈕右）+ 語法高亮程式碼區。
 *
 * 由 Markdown 的 `pre` 映射使用。為 Client Component（需 useState/clipboard），
 * 在分享頁（Server Component）內作為 client boundary 渲染，hydration 後才有複製功能。
 */
export default function CodeBlock({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  // 語言標籤：從內層 <code> 的 className（language-xxx）取出
  const childClassName = (children as ReactElement<{ className?: string }>)?.props?.className ?? ''
  const lang = /language-(\w+)/.exec(childClassName)?.[1] ?? 'code'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(preRef.current?.querySelector('code')?.textContent ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 複製失敗（HTTP 或特殊瀏覽器設定），靜默忽略
    }
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-zinc-700/60 bg-zinc-950">
      {/* 標題列：語言標籤左、複製按鈕右 */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/80 border-b border-zinc-700/60">
        <span className="text-xs font-mono text-zinc-400">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
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
              複製
            </>
          )}
        </button>
      </div>
      {/* 程式碼區：透明背景讓 hljs 主題色顯現 */}
      <pre
        ref={preRef}
        className="!m-0 px-3 py-3 overflow-x-auto text-xs font-mono bg-transparent"
      >
        {children}
      </pre>
    </div>
  )
}
