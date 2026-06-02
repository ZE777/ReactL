import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '關於此專案',
  description: '全端作品集專案：AI Prompt Studio，前台 Next.js + 後台 Vite + 後端 ASP.NET Core 8。',
}

const MODULES = [
  { name: '後台 Admin', tech: 'Vite + React + TypeScript', desc: 'Persona CRUD、Prompt Builder、對話測試、Bot 管理、Token 統計' },
  { name: '前台 Web', tech: 'Next.js 16 + App Router', desc: 'Landing Page（SSG）、外部聊天室（CSR）、對話分享頁（SSR + 動態 metadata）' },
  { name: '後端 API', tech: 'ASP.NET Core 8 + EF Core 8', desc: 'JWT 驗證、AI Streaming SSE、Line / Discord Webhook、AES Token 加密' },
  { name: '資料庫', tech: 'MS SQL Server + EF Migrations', desc: 'Code-First，涵蓋 Users / Conversations / Personas / BotBindings 等 9 張資料表' },
]

const HIGHLIGHTS = [
  '後台 Prompt Builder：六區塊引導 + 即時完整度 % + AI 強化（Groq）',
  'Persona 版本管理：自動快照、一鍵回滾',
  'SSE Streaming：打字機效果 + AbortController 停止生成',
  'Bot Token 安全：後端 AES 加密儲存，前端只顯示後 4 碼',
  'Strategy Pattern：Groq / Gemini Provider 可擴充切換',
  'Line & Discord Webhook：簽章驗證 + Adapter 封裝',
]

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-2">Portfolio Project</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-50 mb-3">
            AI Prompt Studio
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
            一個完整的全端作品集專案，展示從 AI 對話設計到多平台 Bot 部署的端到端開發能力。
            後台 Vite SPA + 前台 Next.js SSR/SSG + ASP.NET Core 8 REST API + MS SQL。
          </p>
        </div>

        {/* Modules */}
        <section className="mb-12">
          <h2 className="text-base font-semibold text-slate-700 dark:text-zinc-200 mb-4">模組架構</h2>
          <div className="flex flex-col gap-3">
            {MODULES.map(m => (
              <div key={m.name} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="sm:w-40 shrink-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">{m.name}</p>
                  <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5">{m.tech}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Highlights */}
        <section className="mb-12">
          <h2 className="text-base font-semibold text-slate-700 dark:text-zinc-200 mb-4">技術亮點</h2>
          <ul className="flex flex-col gap-2">
            {HIGHLIGHTS.map(h => (
              <li key={h} className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300">
                <span className="mt-0.5 text-violet-500 text-xs shrink-0">✦</span>
                {h}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="flex gap-3">
          <Link
            href="/chat"
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
          >
            試用聊天室
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            返回首頁
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
