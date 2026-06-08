import { useState } from 'react'

/**
 * 圖片／影片／音訊嵌入元件與輔助函式。
 *
 * YouTube／Vimeo 不放行 raw <iframe>，而是由 Markdown 的 `a` 映射偵測「裸連結」
 * （顯示文字 === href）後，以我們自行組出的 embed 網址渲染，來源網域固定。
 * 直接的 .mp4/.mp3 等連結則以 <video>/<audio> 播放。圖片支援 lazy load 與點擊放大燈箱。
 */
const VIDEO_EXT = /\.(mp4|webm|ogv|mov)(\?.*)?$/i
const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac)(\?.*)?$/i

export function isVideoUrl(url?: string): boolean {
  return !!url && VIDEO_EXT.test(url)
}

export function isAudioUrl(url?: string): boolean {
  return !!url && AUDIO_EXT.test(url)
}

export function isMediaUrl(url?: string): boolean {
  return isVideoUrl(url) || isAudioUrl(url)
}

/** 解析 YouTube／Vimeo 連結為受控的 embed 來源；非可嵌入網址回傳 null。 */
export function parseEmbed(url?: string): { src: string; title: string } | null {
  if (!url) return null
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  const host = u.hostname.replace(/^www\./, '')

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id =
      u.searchParams.get('v') ??
      (/^\/(?:shorts|embed)\/([\w-]+)/.exec(u.pathname)?.[1] ?? null)
    if (id) return { src: `https://www.youtube.com/embed/${id}`, title: 'YouTube 影片' }
  }
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1)
    if (id) return { src: `https://www.youtube.com/embed/${id}`, title: 'YouTube 影片' }
  }
  if (host === 'vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean)[0]
    if (id && /^\d+$/.test(id)) return { src: `https://player.vimeo.com/video/${id}`, title: 'Vimeo 影片' }
  }
  return null
}

/** 16:9 響應式 iframe 影片嵌入（YouTube／Vimeo）。 */
export function VideoEmbed({ src, title }: { src: string; title: string }) {
  return (
    <div
      className="my-3 relative w-full overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-700"
      style={{ aspectRatio: '16 / 9' }}
    >
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  )
}

/** 直接媒體連結（.mp4/.mp3…）的原生播放器。 */
export function MediaPlayer({ src }: { src: string }) {
  if (isAudioUrl(src)) {
    return <audio controls src={src} className="my-3 w-full" />
  }
  return (
    <video
      controls
      src={src}
      className="my-3 max-w-full rounded-lg border border-slate-200 dark:border-zinc-700"
    />
  )
}

/** Markdown 圖片：響應式樣式 + lazy load + 點擊放大燈箱。 */
export function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [open, setOpen] = useState(false)
  if (!src) return null

  return (
    <>
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
          <img src={src} alt={alt ?? ''} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </>
  )
}
