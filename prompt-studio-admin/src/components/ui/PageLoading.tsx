type Props = { text?: string }

export default function PageLoading({ text = '載入中' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center select-none">
      <div className="w-14 h-14 animate-spin">
        <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
          <circle cx="28" cy="28" r="22" strokeWidth="3.5" className="stroke-slate-100 dark:stroke-zinc-800" />
          <circle
            cx="28" cy="28" r="22"
            strokeWidth="3.5"
            strokeDasharray="46 92"
            strokeLinecap="round"
            className="stroke-violet-500"
          />
        </svg>
      </div>
      <p className="text-lg font-semibold text-slate-800 dark:text-zinc-100">{text}</p>
    </div>
  )
}
