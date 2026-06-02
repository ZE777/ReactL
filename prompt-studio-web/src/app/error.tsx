'use client'

import { useEffect } from 'react'
import Link from 'next/link'

type Props = { error: Error & { digest?: string }; reset: () => void }

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl">
        ⚠️
      </div>
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 mb-1">
          發生了一點問題
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm">
          頁面載入時發生錯誤，請重試或返回首頁。
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
        >
          重試
        </button>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          返回首頁
        </Link>
      </div>
    </div>
  )
}
