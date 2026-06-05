import type { Color } from '../../tokens/colors'
import { softColorMap } from '../../tokens/colors'

type Props = {
  children: React.ReactNode
  color?: Color
  className?: string
}

/** Tag 獨有的 border 顏色（softColorMap 不含 border，border 為 Tag 特有結構） */
const borderColorMap: Record<Color, string> = {
  green:  'border-emerald-200/60 dark:border-emerald-700/40',
  violet: 'border-violet-200/60 dark:border-violet-700/40',
  blue:   'border-blue-200/60 dark:border-blue-700/40',
  amber:  'border-amber-200/60 dark:border-amber-700/40',
  red:    'border-red-200/60 dark:border-red-700/40',
  slate:  'border-slate-200/60 dark:border-zinc-700/40',
}

export default function Tag({ children, color = 'slate', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border ${softColorMap[color]} ${borderColorMap[color]} ${className}`}>
      {children}
    </span>
  )
}
