/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  【練習 2/3】對話公開分享頁 — RSC 核心練習                  ║
 * ║  對應學習：Phase 5-B.3 / 5-B.4 / 5-B.5 / 5-B.6 / 5-B.8   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * 這個檔案是本次 Next.js 練習的「主戰場」，一個檔案涵蓋：
 *
 *   5-B.3  App Router 檔案約定：page.tsx 是 Server Component
 *   5-B.4  Server vs Client：這個 page 完全不需要 'use client'
 *   5-B.5  RSC 資料抓取：直接 async/await，不需要 useEffect
 *   5-B.6  Streaming + Suspense：搭配 loading.tsx 自動處理
 *   5-B.8  RSC 決策樹：何時需要 'use client'（這頁不需要！）
 *
 * ─────────────────────────────────────────────────────────────
 * 【關鍵知識：Next.js 16 Breaking Change — params 是 Promise！】
 *
 *   在 Next.js 14 你這樣寫：
 *     export default function Page({ params }: { params: { slug: string } }) {
 *       const { slug } = params  // 直接取，不需要 await
 *     }
 *
 *   在 Next.js 15/16 params 變成 Promise，必須 await：
 *     export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
 *       const { slug } = await params  // ← 必須 await！
 *     }
 *
 *   同樣的規則適用於 generateMetadata。
 *
 * ─────────────────────────────────────────────────────────────
 * 【你的任務，共 3 步驟】
 *
 * 步驟 A：實作 generateMetadata（動態 SEO）
 *   - 接收 params: Promise<{ slug: string }>，await 後取得 slug
 *   - 呼叫後端 /api/public/{slug} 取得對話資料
 *   - 回傳 Metadata 物件，包含：
 *       title: `${conversation.title} | Prompt Studio`
 *       description: `由 ${persona名稱} 生成的對話紀錄`
 *       openGraph: { title, description, type: 'article' }
 *   - 用 React.cache() 包住 fetch，讓 metadata 和 page 共用同一份快取，
 *     避免對同一個 slug 發出兩次 API 請求
 *
 * 步驟 B：實作 Page 元件（Server Component 資料抓取）
 *   - 宣告為 async function
 *   - await params 取得 slug
 *   - 呼叫 fetchSharedConversation(slug) 取得對話（已在 lib/api.ts 定義）
 *   - 如果 404（throw Error 或 null），呼叫 notFound() from 'next/navigation'
 *   - 渲染對話內容（見下方版面說明）
 *
 * 步驟 C：版面設計
 *   大致結構：
 *   ┌── 標頭 ─────────────────────────────────────────────────┐
 *   │  {persona.emoji} {persona.name}    分享於 {日期}         │
 *   │  {conversation.title}                                   │
 *   ├── 訊息列表 ────────────────────────────────────────────┤
 *   │  user 訊息：右對齊，bg-violet-500 text-white            │
 *   │  assistant 訊息：左對齊，bg-slate-100 dark:bg-zinc-800  │
 *   └─────────────────────────────────────────────────────────┘
 *   - 只顯示 role === 'user' 或 'assistant' 的訊息（跳過 system）
 *
 * ─────────────────────────────────────────────────────────────
 * 完成判斷：
 *   ✅ 在瀏覽器打開 /share/test-slug，頁面能顯示對話內容
 *   ✅ 檢查 <title> 標籤，應該顯示對話標題而非預設 "Prompt Studio"
 *   ✅ 打開 Network 面板，確認只有一次 /api/public/{slug} 請求
 *   ✅ 暫時把 fetchSharedConversation 改成 delay 5 秒，
 *      確認 loading.tsx 的骨架有正確出現
 */

import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import { fetchSharedConversation } from '@/lib/api'
import type { SharedConversation } from '@/types'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

// ─── 步驟 A：用 React.cache 包住 fetch，避免 metadata + page 雙重請求 ──────
// TODO: 取消下方的註解，完成 cachedFetch 函式
// const cachedFetch = cache(async (slug: string): Promise<SharedConversation | null> => {
//   try {
//     return await fetchSharedConversation(slug)
//   } catch {
//     return null
//   }
// })

// ─── 步驟 A：generateMetadata ──────────────────────────────────────────────
// TODO: 取消下方的註解並實作（記得 await params！）
// export async function generateMetadata(
//   { params }: { params: Promise<{ slug: string }> }
// ): Promise<Metadata> {
//   const { slug } = await params
//   const conv = await cachedFetch(slug)
//   if (!conv) return { title: '找不到此分享' }
//   return {
//     title: `${conv.title} | Prompt Studio`,
//     description: `由 ${conv.personaName ?? 'AI'} 生成的對話紀錄`,
//     openGraph: {
//       title: conv.title,
//       description: `由 ${conv.personaName ?? 'AI'} 生成的對話紀錄`,
//       type: 'article',
//     },
//   }
// }

// ─── 步驟 B + C：Page 元件 ──────────────────────────────────────────────────
// TODO: 取消下方的註解並完成實作
// export default async function SharePage(
//   { params }: { params: Promise<{ slug: string }> }
// ) {
//   const { slug } = await params
//   const conv = await cachedFetch(slug)
//   if (!conv) notFound()
//
//   return (
//     <>
//       <Header />
//       <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-10">
//         {/* 步驟 C：在這裡實作標頭 + 訊息列表 */}
//       </main>
//       <Footer />
//     </>
//   )
// }

// ─── 暫時佔位（實作完步驟 A+B+C 後刪掉這個） ────────────────────────────
export default function SharePage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 dark:text-zinc-500 text-sm">
          🚧 這個頁面等你來實作！請閱讀上方的 TODO 說明。
        </p>
        <Link href="/" className="mt-4 inline-block text-xs text-violet-500 hover:underline">
          ← 返回首頁
        </Link>
      </main>
      <Footer />
    </>
  )
}
