import type { ButtonHTMLAttributes } from 'react'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
type Size = 'sm' | 'md' | 'icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-60',
  secondary: 'bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700',
  ghost:     'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200',
  danger:       'bg-red-600 hover:bg-red-500 text-white disabled:opacity-60',
  'danger-ghost': 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 hover:text-red-700 dark:hover:text-red-300',
}

const sizeClasses: Record<Size, string> = {
  sm:   'px-3 py-1.5 text-sm rounded-md',
  md:   'px-4 py-2 text-sm rounded-lg',
  icon: 'p-2 rounded-md',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className = '',
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" className="mx-auto" /> : children}
    </button>
  )
}
