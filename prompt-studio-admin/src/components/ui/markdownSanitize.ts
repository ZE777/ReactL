import { defaultSchema } from 'rehype-sanitize'

/**
 * rehype-sanitize 白名單：在預設 GitHub schema 之上放行聊天輸出實際需要的標籤／屬性。
 *
 * 安全要點（後台雖為登入後的可信內容，仍沿用與前台一致的白名單以保持行為一致）：
 *  - 以預設 schema 為基礎，預設就會擋掉 <script>、on* 事件處理器、javascript: 連結。
 *  - 額外放行 <details>/<summary>（可折疊區塊）與全域 className/id
 *    （KaTeX、rehype-highlight、GFM footnotes 都靠 className/id 運作）。
 *  - 不放行 style；KaTeX 的 inline style 因其在 sanitize 之後才執行，故不受影響。
 *  - 影片／音訊／YouTube 不走 raw HTML，改由 img/a 映射偵測後以受控元件渲染。
 */
const attrs = defaultSchema.attributes ?? {}

export const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'details', 'summary'],
  attributes: {
    ...attrs,
    '*': [...((attrs['*'] as unknown[]) ?? []), 'className', 'id'],
    details: [...((attrs.details as unknown[]) ?? []), 'open'],
  },
} as typeof defaultSchema
