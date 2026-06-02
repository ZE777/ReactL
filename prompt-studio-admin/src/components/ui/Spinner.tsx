type Props = { size?: 'sm' | 'md' | 'lg'; className?: string }

const sizeClasses = { sm: 'w-3 h-3 border', md: 'w-5 h-5 border-2', lg: 'w-8 h-8 border-2' }

export default function Spinner({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${sizeClasses[size]} border-slate-200 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin ${className}`}
    />
  )
}
