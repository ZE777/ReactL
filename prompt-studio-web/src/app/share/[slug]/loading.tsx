import Header from '@/components/layout/Header'

// 模擬 share/[slug]/page.tsx 的版面：標頭區 + 交替訊息氣泡
function Skeleton({ className }: { className: string }) {
  return <div className={`bg-slate-200 dark:bg-zinc-800 rounded-xl animate-pulse ${className}`} />
}

export default function ShareLoading() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* 對話標頭區 */}
        <div className="mb-8 flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-3/4" />
        </div>

        {/* 訊息列表骨架（交替 user 右 / assistant 左） */}
        <div className="flex flex-col gap-4">
          {/* assistant */}
          <div className="flex items-start gap-2.5">
            <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
            <Skeleton className="h-16 w-[72%] rounded-tl-sm" />
          </div>
          {/* user */}
          <div className="flex items-start gap-2.5 flex-row-reverse">
            <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
            <Skeleton className="h-10 w-[55%] rounded-tr-sm" />
          </div>
          {/* assistant */}
          <div className="flex items-start gap-2.5">
            <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
            <Skeleton className="h-20 w-[80%] rounded-tl-sm" />
          </div>
          {/* user */}
          <div className="flex items-start gap-2.5 flex-row-reverse">
            <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
            <Skeleton className="h-10 w-[45%] rounded-tr-sm" />
          </div>
          {/* assistant */}
          <div className="flex items-start gap-2.5">
            <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
            <Skeleton className="h-14 w-[65%] rounded-tl-sm" />
          </div>
        </div>

        {/* 底部 CTA 區骨架 */}
        <div className="mt-10 border-t border-slate-100 dark:border-zinc-800 pt-6 flex flex-col items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-3 w-36" />
        </div>
      </main>
    </>
  )
}
