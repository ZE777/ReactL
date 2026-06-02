import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeScript } from '@/components/ThemeScript'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Prompt Studio',
    template: '%s | Prompt Studio',
  },
  description: '用 AI 打造你的對話體驗。設計 Persona、管理 Prompt、部署到 Line 與 Discord。',
  openGraph: {
    type: 'website',
    siteName: 'Prompt Studio',
    locale: 'zh_TW',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-TW"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
        {children}
      </body>
    </html>
  )
}
