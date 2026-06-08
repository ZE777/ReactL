'use client'

import { useState } from 'react'

/**
 * Markdown 圖片：響應式樣式 + lazy load + 點擊放大燈箱（lightbox）。
 *
 * 為 Client Component（燈箱需 useState），在分享頁（Server Component）內作為 client
 * boundary 渲染。圖片來源多為任意外部網址，故用原生 <img>（非 next/image，避免網域白名單限制）。
 */
export default function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [open, setOpen] = useState(false)
  if (!src) return null

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        onClick={() => setOpen(true)}
        className="my-3 max-w-full h-auto rounded-lg border border-slate-200 dark:border-zinc-700 cursor-zoom-in"
      />
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt ?? ''} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </>
  )
}
