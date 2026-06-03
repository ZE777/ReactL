type Props = {
  title?: string
  detail?: string
  onRetry?: () => void
}

export default function PageError({ title = '載入失敗', detail, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center select-none">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-red-400/20 dark:bg-red-500/15 animate-ping" />
        <div className="relative w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/25 flex items-center justify-center">
          <p className="text-3xl font-bold leading-none text-red-400 dark:text-red-500">!</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-slate-800 dark:text-zinc-100">{title}</p>
        {detail && (
          <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xs">{detail}</p>
        )}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          重新載入
        </button>
      )}
    </div>
  )
}
