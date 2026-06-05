function Skeleton({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div style={style} className={`bg-slate-100 dark:bg-zinc-800 rounded-xl animate-pulse ${className}`} />
}

// 模擬 ChatClient 版面：sidebar + 聊天主區
export default function ChatLoading() {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      {/* Header 佔位 */}
      <div className="h-14 border-b border-slate-100 dark:border-zinc-800 shrink-0" />

      <div className="flex flex-1 min-h-0">
        {/* 角色側欄骨架（桌機） */}
        <aside className="hidden sm:flex flex-col w-56 border-r border-slate-100 dark:border-zinc-800 p-3 gap-2 shrink-0">
          <Skeleton className="h-4 w-16 mb-1" />
          {[100, 85, 90, 75].map((w, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
              <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
              <Skeleton className={`h-3.5`} style={{ width: `${w}%` } as React.CSSProperties} />
            </div>
          ))}
        </aside>

        {/* 聊天主區骨架 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 聊天標頭 */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 shrink-0">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* 訊息區（空白） */}
          <div className="flex-1" />

          {/* 輸入區骨架 */}
          <div className="border-t border-slate-100 dark:border-zinc-800 p-4 shrink-0">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-3 w-48 mx-auto mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
