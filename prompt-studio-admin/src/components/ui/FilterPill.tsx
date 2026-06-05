type Props = {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

export default function FilterPill({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${
        active
          ? 'bg-violet-500 text-white'
          : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
      }`}
    >
      {children}
    </button>
  )
}
