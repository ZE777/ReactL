import { useEffect } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export default function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizeClasses[size]} max-h-[85vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col`}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-700/25">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-100">{title}</h3>
            {description && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-700/25 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
