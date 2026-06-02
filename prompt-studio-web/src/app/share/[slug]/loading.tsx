/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  【練習 3/3】分享頁 Loading Skeleton                        ║
 * ║  對應學習：Phase 5-B.6（Streaming + Suspense）              ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * 這個檔案是「針對 /share/[slug] 頁面的專屬 Loading Skeleton」。
 * 它會覆蓋 app/loading.tsx 的全域 fallback，提供更符合內容的骨架。
 *
 * 背景知識：
 *   「Skeleton Loader」的原則是：骨架形狀要模擬真實內容的版面。
 *   這樣使用者看到骨架時，腦中就能預測頁面長什麼樣子，減少
 *   「佈局飄移（Layout Shift）」帶來的不適感。
 *
 *   /share/[slug]/page.tsx 最終會長這樣（大致版面）：
 *   ┌──────────────────────────────────────────┐
 *   │  [ Persona 名稱 ]  [ 分享於 xx/xx ]      │  ← 標頭區
 *   ├──────────────────────────────────────────┤
 *   │  🧑  [使用者訊息的文字]                  │  ← 訊息 1
 *   │  🤖  [AI 回應的文字，可能多行]           │  ← 訊息 2
 *   │  🧑  [...]                               │  ← 訊息 3
 *   └──────────────────────────────────────────┘
 *
 * 你的任務：
 *   用「pulse 動畫的灰色方塊」模擬上面的版面結構。
 *   重點：
 *   1. 標頭區：一個短方塊（標題）+ 一個更短方塊（日期）
 *   2. 訊息區：交替呈現左對齊（AI）和右對齊（user）的氣泡骨架
 *      至少做 3–4 條，長短不一才自然
 *   3. 方塊用 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse
 *
 * 完成後可以對比：
 *   Skeleton → 資料載入後的真實頁面（練習 2/3 的 page.tsx）
 *   注意版面是否對齊，才代表骨架設計正確。
 */

export default function ShareLoading() {
  // TODO: 實作符合 /share/[slug]/page.tsx 版面的骨架屏。
  // 以下是最簡單的佔位實作，請替換成模擬訊息列表的版本。
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">
      <div className="h-6 w-48 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="mt-4 flex flex-col gap-3">
        {[80, 60, 90, 55].map((w, i) => (
          <div
            key={i}
            className={`h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl animate-pulse ${i % 2 === 0 ? 'self-end' : 'self-start'}`}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  )
}
