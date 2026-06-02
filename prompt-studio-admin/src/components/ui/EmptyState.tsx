type Props = {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center">
        <svg className="w-7 h-7 text-slate-300 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">{title}</p>
        {description && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
