import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40'

const variants: Record<Variant, string> = {
  primary: 'bg-violet-500 hover:bg-violet-600 text-white shadow-sm',
  secondary: 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200',
  ghost: 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300',
  outline: 'border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
}

export default function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: Props) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  )
}
