import type { ButtonHTMLAttributes } from 'react'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'blue'
type Size = 'sm' | 'md' | 'icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:        'bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-60',
  secondary:      'bg-slate-500/80 dark:bg-zinc-400/30 hover:bg-slate-600 dark:hover:bg-zinc-500 text-white dark:text-white border border-slate-500 dark:border-zinc-600 disabled:opacity-50',
  ghost:          'bg-slate-300/80 dark:bg-zinc-400/30 text-slate-700 dark:text-white hover:bg-slate-400 dark:hover:bg-zinc-500 hover:text-slate-900 disabled:opacity-50',
  danger:         'bg-red-600 dark:bg-red-700/90 hover:bg-red-500 dark:hover:bg-red-600 text-white font-semibold border border-transparent disabled:opacity-60',
  'danger-ghost': 'bg-red-400 dark:bg-red-700/90 text-red-900 dark:text-white hover:bg-red-500 dark:hover:bg-red-500 hover:text-white disabled:opacity-50',
  blue:           'bg-blue-600 dark:bg-blue-600/90 hover:bg-blue-500 text-white disabled:opacity-60',
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
      {loading ? (
        <span className="inline-flex items-center gap-1.5">
          <Spinner size="sm" />
          <span>{children}</span>
        </span>
      ) : children}
    </button>
  )
}
