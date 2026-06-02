'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/8 dark:bg-violet-500/6 blur-3xl" />
      </div>

      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        initial="hidden"
        animate="show"
        className="max-w-3xl flex flex-col items-center gap-6"
      >
        {/* Badge */}
        <motion.div variants={fadeUp}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            AI Bot 控制台 · 作品集展示
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 leading-tight">
          設計你的 AI 角色，
          <br />
          <span className="text-violet-500">部署到每一個對話</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p variants={fadeUp} className="text-lg text-slate-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          用結構化 Prompt Builder 打造 Persona、測試 AI 回應，
          一鍵將設定同步到 Line Bot、Discord Bot 與網頁聊天室。
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/chat"
            className="px-6 py-2.5 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors shadow-sm shadow-violet-500/30"
          >
            立即試用聊天室 →
          </Link>
          <Link
            href="/about"
            className="px-6 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            了解此專案
          </Link>
        </motion.div>
      </motion.div>

      {/* Preview card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16 w-full max-w-2xl"
      >
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-slate-400 dark:text-zinc-500 font-mono">prompt-studio · 客服小幫手</span>
          </div>
          {/* Mock chat */}
          <div className="p-5 flex flex-col gap-3">
            <div className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs shrink-0">🤖</span>
              <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-200 max-w-sm">
                您好！我是客服小幫手，請問有什麼我可以協助您的嗎？
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-violet-500 rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-white max-w-sm">
                我想了解退換貨的流程
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs shrink-0">🤖</span>
              <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-200 max-w-sm">
                當然！退換貨流程如下：
                <ol className="mt-1 ml-4 list-decimal text-xs text-slate-500 dark:text-zinc-400 space-y-0.5">
                  <li>在訂單頁點選「申請退換貨」</li>
                  <li>填寫原因並上傳商品照片</li>
                  <li>等待 1–2 個工作天審核通知</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
