import type { Color } from '../../tokens/colors'
import { iconColorMap } from '../../tokens/colors'

type Props = {
  color?: Color
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  title?: string
  'aria-label'?: string
  className?: string
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
}

export default function IconButton({
  color,
  onClick,
  disabled,
  title,
  'aria-label': ariaLabel,
  className = '',
  children,
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${color ? iconColorMap[color] : ''} ${className}`}
    >
      {children}
    </button>
  )
}
