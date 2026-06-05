type Option = { value: string; label: string }

type Props = {
  label?: string
  options: Option[]
  value: string
  onChange: (v: string) => void
  variant?: 'default' | 'accent'
}

/** active 樣式：default = 白底/zinc-700，accent = violet 填色 */
const activeClasses: Record<'default' | 'accent', string> = {
  default: 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm',
  accent:  'bg-violet-600 text-white shadow-sm',
}

export default function SegmentedControl({ label, options, value, onChange, variant = 'default' }: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && <span className="text-xs text-slate-400 dark:text-zinc-500">{label}</span>}
      <div className="flex gap-0.5 bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-sm rounded-md transition-colors cursor-pointer ${
              value === opt.value
                ? activeClasses[variant]
                : 'text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
