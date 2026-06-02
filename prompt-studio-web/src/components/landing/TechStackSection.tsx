'use client'

import { motion } from 'framer-motion'

const STACK = [
  { layer: '前台', items: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind v4', 'Framer Motion'] },
  { layer: '後台', items: ['Vite + React', 'React Router v6', 'Zustand', 'React Query', 'RHF + Zod'] },
  { layer: '後端', items: ['ASP.NET Core 8', 'EF Core 8', 'MS SQL', 'JWT Bearer', 'Serilog'] },
  { layer: 'AI / 外部', items: ['Groq Llama 3.1', 'Gemini 2.0 Flash', 'Line Bot API', 'Discord Bot API', 'SSE Streaming'] },
]

export default function TechStackSection() {
  return (
    <section className="px-4 py-20 bg-slate-50 dark:bg-zinc-900/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-2">
            技術棧
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            前後端分離全端作品集，覆蓋現代 Web 開發技術棧
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STACK.map((s, i) => (
            <motion.div
              key={s.layer}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4"
            >
              <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-3">{s.layer}</p>
              <ul className="flex flex-col gap-1.5">
                {s.items.map(item => (
                  <li key={item} className="text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
