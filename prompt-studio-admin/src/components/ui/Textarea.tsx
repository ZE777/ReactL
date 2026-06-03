import type { TextareaHTMLAttributes } from 'react'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
  /** 只套紅框，不顯示 error 文字（由外部自行渲染 error/counter 列） */
  invalid?: boolean
}

export default function Textarea({ label, error, hint, invalid, id, required, className = '', ...props }: Props) {
  const errorId = id ? `${id}-error` : undefined
  const hintId = id ? `${id}-hint` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-slate-400 dark:text-zinc-400">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        aria-describedby={error && errorId ? errorId : hint && hintId ? hintId : undefined}
        aria-invalid={(error || invalid) ? true : undefined}
        className={`w-full px-3 py-2 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all resize-none border disabled:bg-slate-100 dark:disabled:bg-zinc-700/50 disabled:text-slate-400 dark:disabled:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-70 ${
          (error || invalid)
            ? 'border-red-400 dark:border-red-500'
            : 'border-slate-300 dark:border-zinc-700'
        } ${className}`}
        {...props}
      />
      {hint && !error && <p id={hintId} className="text-sm text-slate-400 dark:text-zinc-400">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
