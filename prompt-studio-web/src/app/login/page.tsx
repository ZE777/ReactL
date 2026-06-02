'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/login', { email, password })
      // JWT 由後端寫入 HttpOnly Cookie，前端直接導向後台
      window.location.href = 'http://localhost:5173'
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗，請確認帳號密碼')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-100 text-lg">
            <span className="text-violet-500 text-xl">⬡</span>
            Prompt Studio
          </Link>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">登入管理後台</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-300 mb-1.5">
                密碼
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-zinc-500 mt-5">
          <Link href="/" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
            ← 返回首頁
          </Link>
        </p>
      </div>
    </div>
  )
}
