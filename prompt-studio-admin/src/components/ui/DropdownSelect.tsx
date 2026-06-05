import { useEffect, useRef, useState } from 'react'

export type SelectOption = {
  value: string
  label: string
  /** 顯示於選項右側或 trigger 左側的補充說明（例如平台名稱） */
  subLabel?: string
  /** 顯示於選項右側的彩色標籤（例如平台識別） */
  badge?: { label: string; color: 'green' | 'blue' | 'violet' | 'slate' }
}

export type SelectOptionGroup = {
  label: string
  options: SelectOption[]
}

type Props = {
  value: string
  onChange: (v: string) => void
  /** 平坦選項清單（與 groups 擇一） */
  options?: SelectOption[]
  /** 分組選項清單（與 options 擇一） */
  groups?: SelectOptionGroup[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  hasError?: boolean
  className?: string
}

/**
 * 統一下拉選單元件
 *
 * 視覺規範：
 * - Trigger：白底/zinc-900、border rounded-lg、focus ring violet
 * - Dropdown：fixed 定位（避免被 overflow 裁切）、rounded-xl、shadow-lg
 * - 已選項：violet 底色 + 勾選圖示
 * - 分組標頭：uppercase tracking-wide、sticky 置頂
 */
export default function DropdownSelect({
  value, onChange, options, groups,
  placeholder = '請選擇', disabled, loading, hasError, className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleToggle() {
    if (disabled || loading || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPanelStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setOpen(v => !v)
  }

  const allOptions = groups ? groups.flatMap(g => g.options) : (options ?? [])
  const selected = allOptions.find(o => o.value === value)

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={`w-full px-3 py-2 text-base bg-white dark:bg-zinc-900 border rounded-lg text-left flex items-center justify-between gap-2 transition-all outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed ${
          hasError
            ? 'border-red-400 dark:border-red-500'
            : open
              ? 'border-violet-500'
              : 'border-slate-300 dark:border-zinc-700'
        }`}
      >
        {loading ? (
          <span className="text-slate-400 dark:text-zinc-500 text-sm">載入中…</span>
        ) : selected ? (
          <span className="flex items-center gap-2 min-w-0">
            {selected.subLabel && (
              <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">{selected.subLabel}</span>
            )}
            <span className="text-slate-700 dark:text-zinc-200 truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-slate-400 dark:text-zinc-500 text-sm">{placeholder}</span>
        )}
        <svg
          className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          style={panelStyle}
          className="fixed z-[100] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
        >
          {groups ? (
            groups.map((group, idx) => (
              <div key={group.label}>
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wide bg-slate-50 dark:bg-zinc-800 sticky top-0">
                  {group.label}
                </div>
                {group.options.map(opt => (
                  <DropdownOption
                    key={opt.value}
                    option={opt}
                    isSelected={value === opt.value}
                    onSelect={() => { onChange(opt.value); setOpen(false) }}
                  />
                ))}
                {idx < groups.length - 1 && (
                  <div className="border-t border-slate-100 dark:border-zinc-700/25" />
                )}
              </div>
            ))
          ) : (
            (options ?? []).map(opt => (
              <DropdownOption
                key={opt.value}
                option={opt}
                isSelected={value === opt.value}
                onSelect={() => { onChange(opt.value); setOpen(false) }}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

const badgeClasses: Record<string, string> = {
  green:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/40',
  blue:   'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-700/40',
  violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-700/40',
  slate:  'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/40',
}

function DropdownOption({
  option, isSelected, onSelect,
}: { option: SelectOption; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
        isSelected
          ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-200 font-medium'
          : 'text-slate-600 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
      }`}
    >
      <span className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-violet-500' : 'text-transparent'}`}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="truncate">{option.label}</span>
      {option.badge && (
        <span className={`ml-auto flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${badgeClasses[option.badge.color]}`}>
          {option.badge.label}
        </span>
      )}
      {!option.badge && option.subLabel && (
        <span className="text-xs text-slate-400 dark:text-zinc-400 ml-auto flex-shrink-0">{option.subLabel}</span>
      )}
    </button>
  )
}
