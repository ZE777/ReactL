'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

const NAV = [
  { href: '/', label: '首頁' },
  { href: '/chat', label: '聊天室' },
  { href: '/about', label: '關於' },
]

export default function Header() {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 點選選單外部時關閉
  useEffect(() => {
    if (!mobileOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mobileOpen])

  // 路由切換時關閉手機選單
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function toggleTheme() {
    const html = document.documentElement
    const next = html.classList.toggle('dark')
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setIsDark(next)
  }

  return (
    <header
      ref={menuRef}
      className={cn(
        'sticky top-0 z-50 transition-all duration-200 border-b [transform:translateZ(0)]',
        scrolled
          ? 'bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-slate-200/60 dark:border-zinc-800/60'
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-100 shrink-0">
          <span className="text-violet-500 text-lg">⬡</span>
          Prompt Studio
        </Link>

        {/* 桌機導覽 */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                pathname === item.href
                  ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 右側操作區 */}
        <div className="flex items-center gap-2">
          {/* 深色模式切換 */}
          <button
            onClick={toggleTheme}
            aria-label="切換深色模式"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* 管理後台（桌機） */}
          <Link
            href="/login"
            className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
          >
            管理後台
          </Link>

          {/* 漢堡選單（手機） */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={mobileOpen}
            className="sm:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <span className={cn('block w-4 h-0.5 bg-current transition-all duration-200 origin-center',
              mobileOpen && 'rotate-45 translate-y-2')} />
            <span className={cn('block w-4 h-0.5 bg-current transition-all duration-200',
              mobileOpen && 'opacity-0')} />
            <span className={cn('block w-4 h-0.5 bg-current transition-all duration-200 origin-center',
              mobileOpen && '-rotate-45 -translate-y-2')} />
          </button>
        </div>
      </div>

      {/* 手機展開選單 */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
          <nav className="flex flex-col px-4 py-2">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors',
                  pathname === item.href
                    ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 font-medium'
                    : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800'
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="mt-1 mb-1 flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
            >
              管理後台
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
