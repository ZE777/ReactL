/**
 * 共用顏色型別與色票對照表
 *
 * 所有接受 color prop 的 UI 元件（Badge、Tag、IconButton 等）統一使用此型別與對應 map。
 * 各元件若有特殊需求，可在本地 spread 後覆蓋特定條目：
 *   const colorClasses = { ...badgeColorMap, slate: '自訂樣式' }
 */

/** 共用顏色 key，限制可接受的語意顏色名稱 */
export type Color = 'violet' | 'slate' | 'green' | 'red' | 'amber' | 'blue'

/**
 * 柔色系（Tag 使用）
 * bg-50 底色 + text-600 文字；border 由 Tag 自行附加
 */
export const softColorMap: Record<Color, string> = {
  violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  slate:  'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400',
  green:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  red:    'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  amber:  'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  blue:   'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
}

/**
 * 中等色系（Badge 使用）
 * bg-100 底色 + text-700 文字；無 border
 */
export const badgeColorMap: Record<Color, string> = {
  violet: 'bg-violet-100 dark:bg-violet-500/30 text-violet-700 dark:text-violet-200',
  slate:  'bg-slate-200 dark:bg-zinc-600/50 text-slate-600 dark:text-zinc-300',
  green:  'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-200',
  red:    'bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-200',
  amber:  'bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-200',
  blue:   'bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-200',
}

/**
 * 圖示按鈕色系（IconButton 使用）
 * 半透明底 + 圖示色 + hover 效果；blue 例外使用較輕淡底色
 */
export const iconColorMap: Record<Color, string> = {
  blue:   'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-800/50',
  red:    'text-red-600 dark:text-red-500 bg-red-300/70 dark:bg-red-600/30 hover:bg-red-400/70 dark:hover:bg-red-600/50 dark:hover:text-red-400',
  slate:  'text-slate-600 dark:text-zinc-400 bg-slate-300/70 dark:bg-zinc-600/30 hover:bg-slate-400/70 dark:hover:bg-zinc-500/50 hover:text-slate-800 dark:hover:text-zinc-200',
  violet: 'text-violet-600 dark:text-violet-500 bg-violet-300/70 dark:bg-violet-600/30 hover:bg-violet-400/70 dark:hover:bg-violet-600/50 dark:hover:text-violet-400',
  green:  'text-emerald-600 dark:text-emerald-500 bg-emerald-300/70 dark:bg-emerald-600/30 hover:bg-emerald-400/70 dark:hover:bg-emerald-600/50 dark:hover:text-emerald-400',
  amber:  'text-amber-500 dark:text-amber-500 bg-amber-300/70 dark:bg-amber-600/30 hover:bg-amber-400/70 dark:hover:bg-amber-600/50 dark:hover:text-amber-400',
}
