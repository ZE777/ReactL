import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import CodeBlock from '@/components/ui/CodeBlock'

/**
 * 公開站共用 Markdown 渲染元件（聊天室串流回應、分享頁皆用）。
 *
 * 無 hooks、不依賴 @tailwindcss/typography，樣式以 components 映射內聯，
 * 因此可同時用於 Client Component（ChatClient）與 Server Component（分享頁）。
 */
const components: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-2 ml-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-5 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h1 className="mt-4 mb-2 text-base font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 text-base font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-sm font-semibold first:mt-0">{children}</h3>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-600 dark:text-violet-400 underline underline-offset-2 hover:text-violet-700 dark:hover:text-violet-300"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-slate-300 dark:border-zinc-600 pl-3 text-slate-500 dark:text-zinc-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-slate-200 dark:border-zinc-700" />,
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
  // 程式碼區塊容器：語法高亮 + 語言標籤 + 複製按鈕（client 元件）
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
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
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
