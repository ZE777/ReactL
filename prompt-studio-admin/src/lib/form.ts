import { useCallback, useRef, useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

/**
 * 包裝 react-hook-form 的 register：在 onChange 階段濾掉所有空白字元，
 * 讓 token / secret / 密碼這類敏感欄位不可能含空白（按空白鍵不產生字元、貼上含空白也自動清除）。
 *
 * 用法：{...noSpace(register('botToken', { ...rules }))}
 */
export function noSpace(reg: UseFormRegisterReturn): UseFormRegisterReturn {
  return {
    ...reg,
    onChange: (e: Parameters<UseFormRegisterReturn['onChange']>[0]) => {
      const el = e.target as HTMLInputElement
      const cleaned = el.value.replace(/\s/g, '')
      if (cleaned !== el.value) el.value = cleaned
      return reg.onChange(e)
    },
  }
}

/**
 * 與 noSpace 相同，但當空白真的被擋掉時，會給對應欄位一段「即時紅字提示」，
 * 並在 clearMs 毫秒後自動消失。
 *
 * 用法：
 *   const { noSpace, blockedHint } = useNoSpace()
 *   <Input {...noSpace(register('botToken', rules))}
 *          error={blockedHint('botToken') ?? errors.botToken?.message} />
 */
export function useNoSpace(clearMs = 2500) {
  const [blocked, setBlocked] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wrap = useCallback(
    (reg: UseFormRegisterReturn): UseFormRegisterReturn => ({
      ...reg,
      onChange: (e: Parameters<UseFormRegisterReturn['onChange']>[0]) => {
        const el = e.target as HTMLInputElement
        const cleaned = el.value.replace(/\s/g, '')
        if (cleaned !== el.value) {
          el.value = cleaned
          setBlocked(reg.name)
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => setBlocked(null), clearMs)
        }
        return reg.onChange(e)
      },
    }),
    [clearMs],
  )

  /** 回傳該欄位目前是否需要顯示「不可輸入空白」紅字（否則 undefined） */
  const blockedHint = useCallback(
    (name: string): string | undefined => (blocked === name ? '不可輸入空白' : undefined),
    [blocked],
  )

  return { noSpace: wrap, blockedHint }
}
