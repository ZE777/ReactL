import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import TechStackSection from '@/components/landing/TechStackSection'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Prompt Studio — AI Bot 控制台',
  description: '設計 Persona、管理 Prompt、部署到 Line Bot 與 Discord Bot。全端作品集專案。',
}

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <TechStackSection />

        {/* CTA Bottom */}
        <section className="px-4 py-20 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-3">
              立刻體驗 AI 對話
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
              無需登入，直接在聊天室與內建 Persona 對話。
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors shadow-sm shadow-violet-500/30"
            >
              進入聊天室 →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
