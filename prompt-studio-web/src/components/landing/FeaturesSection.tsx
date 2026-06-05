'use client'

import { motion } from 'framer-motion'

const FEATURES = [
  {
    icon: '✍️',
    title: 'Prompt Builder',
    desc: '結構化六區塊表單（角色、背景、任務、格式、限制、範例），引導你寫出完整的 System Prompt，搭配即時完整度提示與 AI 強化按鈕。',
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    icon: '🤖',
    title: 'Persona 版本管理',
    desc: '每次儲存自動建立快照，支援一鍵回滾到任意歷史版本。再也不怕改壞了 Prompt 回不去。',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: '📱',
    title: '多平台 Bot 部署',
    desc: '設定一次 Persona，同步部署到 Line Bot、Discord Bot 與網頁聊天室。Token 加密儲存，前端只顯示後四碼。',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  {
    icon: '⚡',
    title: 'SSE Streaming 回應',
    desc: '串接 Groq、Mistral、Cerebras、SambaNova 等多家 OpenAI 相容模型，支援打字機效果串流輸出與停止生成，並可自帶 API 金鑰（BYOK）。',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    icon: '📊',
    title: 'Token 用量統計',
    desc: '圖表顯示近 30 天每日用量趨勢，依來源（Admin / Web / Line / Discord）分色，掌握 AI API 消耗狀況。',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: '🔒',
    title: 'JWT 驗證後台',
    desc: 'HttpOnly Cookie 儲存 JWT，搭配 Refresh Token 無感續簽。後台所有路由均受 PrivateRoute 保護。',
    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
]

export default function FeaturesSection() {
  return (
    <section className="px-4 py-20 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 mb-3">
          為 AI Bot 設計師打造的控制台
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">
          從設計 Persona 到上線部署，一站式管理你的 AI 對話體驗。
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 hover:border-violet-300 dark:hover:border-violet-700/60 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 ${f.color}`}>
              {f.icon}
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-zinc-100 mb-1.5 text-sm">
              {f.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
