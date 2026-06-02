/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  【練習 1/3】全域 Loading UI — App Router 檔案約定           ║
 * ║  對應學習：Phase 5-B.3（Next.js App Router 基礎）           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * 這個檔案實作「全域 Loading Fallback」。
 *
 * 背景知識：
 *   App Router 的 loading.tsx 是 React Suspense 的語法糖。
 *   Next.js 會自動把 page.tsx 包進 <Suspense fallback={<Loading />}>，
 *   當 page.tsx 是 async Server Component 且還在 await 資料時，
 *   就會顯示這個 Loading 元件。
 *
 *   繼承規則：
 *     app/loading.tsx           ← 你現在在這，所有 page 都吃這個 fallback
 *     app/share/[slug]/loading.tsx ← 更深層的 loading 會覆蓋這個（練習 3/3）
 *
 * 你的任務：
 *   實作一個全站通用的「骨架屏（Skeleton）」或「載入動畫」。
 *   設計要求：
 *   - 要有視覺上的載入感（旋轉圈、跳動點、或骨架線條都可以）
 *   - 需要 dark mode 支援（dark: 前綴）
 *   - 高度要佔滿視窗（不要只佔一個角落）
 *
 * 完成後的效果：
 *   當你在瀏覽器中直接進入 /share/[slug] 這類 SSR 頁面時，
 *   會短暫看到這個元件，然後 page 內容逐漸串流進來。
 *
 * 參考實作（可以刪掉換成你自己的）：
 */

export default function GlobalLoading() {
  // TODO: 實作你自己的全站 loading UI。
  // 以下是最簡單的佔位實作，請替換成有設計感的版本。
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  )
}
