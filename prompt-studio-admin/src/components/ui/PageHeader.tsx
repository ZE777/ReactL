type Props = {
  title: string
  subtitle?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, className = '' }: Props) {
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
