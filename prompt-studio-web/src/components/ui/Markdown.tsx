import type { ReactElement, ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkEmoji from 'remark-emoji'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize from 'rehype-sanitize'
import 'katex/dist/katex.min.css'
import CodeBlock from '@/components/ui/CodeBlock'
import Mermaid from '@/components/ui/Mermaid'
import MarkdownTable from '@/components/ui/MarkdownTable'
import MarkdownImage from '@/components/ui/MarkdownImage'
import {
  VideoEmbed,
  MediaPlayer,
  parseEmbed,
  isVideoUrl,
  isAudioUrl,
  isMediaUrl,
} from '@/components/ui/MarkdownMedia'
import { sanitizeSchema } from '@/components/ui/markdownSanitize'

/** 從 react node 樹遞迴取出純文字（避開 rehype-highlight 產生的 span 結構）。 */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  const el = node as ReactElement<{ children?: ReactNode }>
  return extractText(el.props?.children)
}

/**
 * 公開站共用 Markdown 渲染元件（聊天室串流回應、分享頁皆用）。
 *
 * 無 hooks、不依賴 @tailwindcss/typography，樣式以 components 映射內聯，
 * 因此可同時用於 Client Component（ChatClient）與 Server Component（分享頁）。
 *
 * 支援格式：GFM（表格／刪除線／任務清單／footnotes）、數學公式（KaTeX）、emoji shortcode、
 * 受控原始 HTML（rehype-raw + sanitize 白名單，含 <details>）、程式碼語法高亮 + 行號、
 * Mermaid 圖表、圖片（lazy + 燈箱）、影片／音訊與 YouTube/Vimeo 嵌入。
 */
const components: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-2 ml-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-5 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-slate-400 dark:text-zinc-500">{children}</del>,
  h1: ({ children }) => <h1 className="mt-4 mb-2 text-base font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 text-base font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-sm font-semibold first:mt-0">{children}</h3>,
  // 連結：偵測「裸連結」（顯示文字 === href）為 YouTube/Vimeo 或直接媒體時改為嵌入播放
  a: ({ href, children }) => {
    const text = extractText(children)
    if (href && text === href) {
      const embed = parseEmbed(href)
      if (embed) return <VideoEmbed src={embed.src} title={embed.title} />
      if (isMediaUrl(href)) return <MediaPlayer src={href} />
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-violet-600 dark:text-violet-400 underline underline-offset-2 hover:text-violet-700 dark:hover:text-violet-300"
      >
        {children}
      </a>
    )
  },
  // 圖片：媒體副檔名改用 video/audio，其餘為 lazy + 燈箱圖片
  img: ({ src, alt }) => {
    const url = typeof src === 'string' ? src : undefined
    if (isVideoUrl(url) || isAudioUrl(url)) return <MediaPlayer src={url as string} />
    return <MarkdownImage src={url} alt={typeof alt === 'string' ? alt : undefined} />
  },
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-slate-300 dark:border-zinc-600 pl-3 text-slate-500 dark:text-zinc-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-slate-200 dark:border-zinc-700" />,
  // 可折疊區塊（<details>/<summary>，經 rehype-raw + sanitize 白名單放行）
  details: ({ children }) => (
    <details className="my-3 rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-2 [&>summary]:cursor-pointer">
      {children}
    </details>
  ),
  summary: ({ children }) => (
    <summary className="font-medium text-slate-700 dark:text-zinc-200 select-none">{children}</summary>
  ),
  // 註腳區段（GFM footnotes）：上方分隔線 + 較小字級
  section: ({ children, ...props }) => {
    const isFootnotes = (props as { className?: string }).className?.includes('footnotes')
    if (isFootnotes) {
      return (
        <section className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-700 text-xs text-slate-500 dark:text-zinc-400">
          {children}
        </section>
      )
    }
    return <section {...props}>{children}</section>
  },
  sup: ({ children }) => <sup className="text-[0.7em] text-violet-600 dark:text-violet-400">{children}</sup>,
  // 行內 code 與區塊 code：區塊由 rehype-highlight 加上 hljs/language- class，
  // 並由 pre→CodeBlock 包成深色容器；行內 code 才套用此處的 pill 樣式。
  code: ({ className, children, ...props }) => {
    const isBlock = /(?:language-|hljs)/.test(className ?? '')
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-zinc-700/70 text-[0.85em] font-mono break-words" {...props}>
        {children}
      </code>
    )
  },
  // 程式碼區塊容器：偵測 ```mermaid 改用 Mermaid 圖表元件，否則語法高亮 + 行號 + 複製（client 元件）
  pre: ({ children }) => {
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>
    if (/language-mermaid/.test(child?.props?.className ?? '')) {
      return <Mermaid code={extractText(child.props?.children).replace(/\n$/, '')} />
    }
    return <CodeBlock>{children}</CodeBlock>
  },
  // 表格：右上角 hover 複製按鈕（複製為 TSV，client 元件）
  table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
  th: ({ children }) => (
    <th className="border border-slate-200 dark:border-zinc-700 px-2 py-1 text-left font-semibold bg-slate-50 dark:bg-zinc-800">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 dark:border-zinc-700 px-2 py-1">{children}</td>
  ),
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex, rehypeHighlight]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
