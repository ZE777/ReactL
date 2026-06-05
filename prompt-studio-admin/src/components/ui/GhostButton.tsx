type Props = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  title?: string
  className?: string
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
}

export default function GhostButton({ onClick, disabled, title, className = '', children, type = 'button' }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 text-sm px-2.5 py-1 rounded cursor-pointer transition-colors text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}
