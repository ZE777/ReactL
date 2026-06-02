import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
      <p className="text-7xl font-bold text-violet-500/20 dark:text-violet-400/20 select-none">
        404
      </p>
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 mb-1">
          找不到這個頁面
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          連結可能已失效或從未存在。
        </p>
      </div>
      <Link
        href="/"
        className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
      >
        返回首頁
      </Link>
    </div>
  )
}
