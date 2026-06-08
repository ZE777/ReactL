import { useState, useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkEmoji from 'remark-emoji'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize from 'rehype-sanitize'
import type { PluggableList } from 'unified'
import Mermaid from './Mermaid'
import {
  VideoEmbed,
  MediaPlayer,
  MarkdownImage,
  parseEmbed,
  isVideoUrl,
  isAudioUrl,
  isMediaUrl,
} from './MarkdownMedia'
import { sanitizeSchema } from './markdownSanitize'

/**
 * 後台聊天 Markdown 的 remark／rehype 外掛清單，供 ChatPage／MonitorPage／PublicChatMonitorPage
 * 共用，確保三處渲染能力一致。
 *
 * 支援：GFM（表格／刪除線／任務清單／footnotes）、數學公式（KaTeX）、emoji shortcode、
 * 受控原始 HTML（rehype-raw + sanitize 白名單，含 <details>）。
 * rehype 順序：raw 先把原始 HTML 解析進樹 → sanitize 白名單過濾 → katex／highlight 產生
 * （兩者輸出在 sanitize 之後，故其 class/style 不會被移除）。
 */
export const remarkPlugins: PluggableList = [remarkGfm, remarkMath, remarkEmoji]
export const rehypePlugins: PluggableList = [
  rehypeRaw,
  [rehypeSanitize, sanitizeSchema],
  rehypeKatex,
  rehypeHighlight,
]

/** 從 react node 樹遞迴取出純文字（避開 rehype-highlight 產生的 span 結構）。 */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  const el = node as ReactElement<{ children?: ReactNode }>
  return extractText(el.props?.children)
}

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

/// ChatGPT 風格程式碼區塊：深色標題列（語言標籤左、複製按鈕右）+ 深色程式碼區 + 多行行號
function CodeBlock({ children, className, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const lang = (className ?? '').replace('language-', '') || 'code'

  // 行號：以純文字行數推算（pre 預設不換行，每邏輯行 = 每視覺行）
  const codeText = extractText(children).replace(/\n$/, '')
  const lineCount = codeText.split('\n').length
  const showLineNumbers = lineCount > 1

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
      {/* 程式碼區：行號欄（select-none）+ 透明背景讓外層深色容器顯現，覆寫 prose/hljs 預設背景 */}
      <div className="flex overflow-x-auto text-sm leading-6">
        {showLineNumbers && (
          <div
            aria-hidden
            className="select-none flex-none py-4 pl-4 pr-3 text-right font-mono text-zinc-600 border-r border-zinc-800"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        <pre
          ref={preRef}
          className={`${className ?? ''} !m-0 !rounded-none !bg-transparent !border-0 px-4 py-4 leading-6 flex-1`}
          {...props}
        >
          {children}
        </pre>
      </div>
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

/// pre 分派：偵測 ```mermaid 改用 Mermaid 圖表元件，否則用 CodeBlock
function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const child = children as ReactElement<{ className?: string; children?: ReactNode }>
  if (/language-mermaid/.test(child?.props?.className ?? '')) {
    return <Mermaid code={extractText(child.props?.children).replace(/\n$/, '')} />
  }
  return <CodeBlock {...props}>{children}</CodeBlock>
}

/// 連結：裸連結（顯示文字 === href）為 YouTube/Vimeo 或直接媒體時改為嵌入播放
function Anchor({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const text = extractText(children)
  if (href && text === href) {
    const embed = parseEmbed(href)
    if (embed) return <VideoEmbed src={embed.src} title={embed.title} />
    if (isMediaUrl(href)) return <MediaPlayer src={href} />
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  )
}

/// 圖片：媒體副檔名改用 video/audio，其餘為 lazy + 燈箱圖片
function Img({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const url = typeof src === 'string' ? src : undefined
  if (isVideoUrl(url) || isAudioUrl(url)) return <MediaPlayer src={url as string} />
  return <MarkdownImage src={url} alt={typeof alt === 'string' ? alt : undefined} />
}

/// 傳入 ReactMarkdown components prop 以啟用程式碼區塊、表格、Mermaid 圖表、媒體嵌入與可折疊區塊
export const markdownComponents: Components = {
  pre: Pre as Components['pre'],
  table: Table as Components['table'],
  a: Anchor as Components['a'],
  img: Img as Components['img'],
  details: ({ children }) => (
    <details className="my-3 rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-2 [&>summary]:cursor-pointer">
      {children}
    </details>
  ),
  summary: ({ children }) => (
    <summary className="font-medium text-slate-700 dark:text-zinc-200 select-none">{children}</summary>
  ),
}
