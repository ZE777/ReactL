import type { Color } from '../../tokens/colors'
import { badgeColorMap } from '../../tokens/colors'

type Size = 'sm' | 'md'

type Props = {
  children: React.ReactNode
  color?: Color
  size?: Size
  className?: string
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs font-medium',
  md: 'px-3.5 py-1.5 text-sm font-semibold',
}

export default function Badge({ children, color = 'slate', size = 'sm', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${badgeColorMap[color]} ${className}`}>
      {children}
    </span>
  )
}
