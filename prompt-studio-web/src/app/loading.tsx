export default function GlobalLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-9 h-9 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-xs text-slate-400 dark:text-zinc-500">載入中...</p>
      </div>
    </div>
  )
}
