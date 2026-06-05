type Props = {
  className?: string
  children: React.ReactNode
}

export default function Card({ className = '', children }: Props) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl ${className}`}>
      {children}
    </div>
  )
}
