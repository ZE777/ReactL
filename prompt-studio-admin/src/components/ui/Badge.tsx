type Color = 'violet' | 'slate' | 'green' | 'red' | 'amber' | 'blue'

type Props = {
  children: React.ReactNode
  color?: Color
  className?: string
}

const colorClasses: Record<Color, string> = {
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  slate:  'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400',
  green:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red:    'bg-red-500/10 text-red-600 dark:text-red-400',
  amber:  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  blue:   'bg-blue-500/10 text-blue-600 dark:text-blue-400',
}

export default function Badge({ children, color = 'slate', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  )
}
