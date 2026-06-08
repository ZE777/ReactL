import { memo, useEffect, useRef, useState } from 'react'

/**
 * Mermaid 圖表區塊：深色標題列（標籤左、複製原始碼 + 下載 SVG 右）+ 渲染後的 SVG。
 *
 * 由 markdownComponents 的 `pre` 映射在偵測到 ```mermaid 區塊時使用。
 *
 * 串流容錯：聊天回應逐 token 進來時 code 多半語法不完整，故對 code 做 debounce，
 * 並以 mermaid.parse 驗證，失敗時保留上一張有效 SVG／顯示佔位，不拋錯崩潰。
 */
let mermaidId = 0

function MermaidImpl({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')
  const [errored, setErrored] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const mermaid = (await import('mermaid')).default
        const isDark = document.documentElement.classList.contains('dark')
        mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default', securityLevel: 'strict' })
        await mermaid.parse(code) // 驗證；語法不完整會 throw
        const { svg } = await mermaid.render(`mermaid-${mermaidId++}`, code)
        if (!cancelled) {
          setSvg(svg)
          setErrored(false)
        }
      } catch {
        if (!cancelled) setErrored(true)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [code])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 複製失敗靜默忽略
    }
  }

  function handleDownload() {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return
    const source = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-xl overflow-hidden my-3 border border-zinc-700/60 bg-zinc-950">
      {/* 標題列：標籤左、複製原始碼 + 下載 SVG 右、永遠可見 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/60">
        <span className="text-xs font-mono text-zinc-400">mermaid</span>
        <div className="flex items-center gap-3">
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
                複製原始碼
              </>
            )}
          </button>
          {svg && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              下載 SVG
            </button>
          )}
        </div>
      </div>
      {/* 圖表區：白底讓 SVG 可讀；未繪出時顯示佔位 */}
      <div ref={containerRef} className="px-4 py-4 overflow-x-auto bg-white dark:bg-zinc-900 flex justify-center">
        {svg ? (
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <span className="text-xs text-zinc-400 py-4">{errored ? '圖表語法解析中…' : '圖表繪製中…'}</span>
        )}
      </div>
    </div>
  )
}

const Mermaid = memo(MermaidImpl)
export default Mermaid
