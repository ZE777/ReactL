export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-100 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="text-violet-500">⬡</span>
          <span>Prompt Studio</span>
          <span>·</span>
          <span>作品集專案</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Next.js 16 · ASP.NET Core 8 · MS SQL</span>
        </div>
      </div>
    </footer>
  )
}
