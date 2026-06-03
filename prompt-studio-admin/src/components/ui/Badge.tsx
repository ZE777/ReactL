type Color = 'violet' | 'slate' | 'green' | 'red' | 'amber' | 'blue'
type Size = 'sm' | 'md'

type Props = {
  children: React.ReactNode
  color?: Color
  size?: Size
  className?: string
}

const colorClasses: Record<Color, string> = {
  violet: 'bg-violet-100 dark:bg-violet-500/30 text-violet-700 dark:text-violet-200',
  slate:  'bg-slate-200 dark:bg-zinc-600/50 text-slate-600 dark:text-zinc-300',
  green:  'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-200',
  red:    'bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-200',
  amber:  'bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-200',
  blue:   'bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-200',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-xs font-medium',
  md: 'px-3 py-1 text-sm font-semibold',
}

export default function Badge({ children, color = 'slate', size = 'sm', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  )
}
