'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
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

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toggleTheme() {
    const html = document.documentElement
    const next = html.classList.toggle('dark')
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setIsDark(next)
  }

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-200',
      scrolled
        ? 'bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-slate-200/60 dark:border-zinc-800/60'
        : 'bg-transparent'
    )}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-100">
          <span className="text-violet-500 text-lg">⬡</span>
          Prompt Studio
        </Link>

        {/* Nav */}
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

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="切換深色模式"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
          >
            管理後台
          </Link>
        </div>
      </div>
    </header>
  )
}
