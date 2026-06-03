import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import ConversationSidebar from '../components/ConversationSidebar'

type ConversationListItem = { id: string; title: string }

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/chat':          { title: '對話測試',    subtitle: '測試 Persona 與 AI 回應' },
  '/conversations': { title: '對話記錄',    subtitle: '所有測試對話' },
  '/personas':      { title: '角色',        subtitle: '管理 AI 角色設定' },
  '/prompts':       { title: 'Prompt 模板', subtitle: '管理提示詞模板庫' },
  '/bots':          { title: 'Bot 管理',    subtitle: 'Line / Discord Bot 綁定' },
  '/monitor':       { title: '對話監控',    subtitle: '外部平台對話記錄' },
  '/stats':         { title: '統計',        subtitle: 'Token 用量與使用分析' },
  '/settings':      { title: '設定',        subtitle: '帳號與系統設定' },
}

// Dynamic routes that can't be matched by static prefix
const dynamicTitles: Array<{ test: RegExp; title: string; subtitle: string }> = [
  { test: /^\/personas\/[^/]+\/versions$/, title: '版本歷史', subtitle: '角色 Prompt 版本管理' },
]

export default function AdminLayout() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 路由切換時自動收合 sidebar（手機）
  useEffect(() => { setIsSidebarOpen(false) }, [location.pathname])

  const dynamicMatch = dynamicTitles.find(d => d.test.test(location.pathname))
  const pageKey = dynamicMatch ? '' : (
    Object.keys(pageTitles).find(key => location.pathname === key) ??
    Object.keys(pageTitles).find(key => location.pathname.startsWith(key + '/'))
  ) ?? ''
  const page = dynamicMatch ?? pageTitles[pageKey] ?? { title: 'Prompt Studio', subtitle: '' }

  // 在 /chat/:id 時，顯示實際對話名稱
  const chatIdMatch = location.pathname.match(/^\/chat\/(.+)$/)
  const chatId = chatIdMatch?.[1] ?? null

  // 訂閱 conversation detail 快取（與 ChatPage 共用同一 queryKey，React Query 自動去重請求）
  const { data: convDetail } = useQuery<{ title: string }>({
    queryKey: ['conversation', chatId],
    queryFn: () => api.get<ApiResponse<{ title: string }>>(`/conversations/${chatId}`).then(unwrap),
    enabled: !!chatId,
    staleTime: 30_000,
  })

  const conversations = queryClient.getQueryData<ConversationListItem[]>(['conversations'])
  const activeChatTitle = chatId
    ? (conversations?.find(c => c.id === chatId)?.title ?? convDetail?.title ?? null)
    : null

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 page-enter">
      <ConversationSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          {/* 漢堡選單（手機才顯示） */}
          <button
            onClick={() => setIsSidebarOpen(o => !o)}
            aria-label={isSidebarOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={isSidebarOpen}
            className="lg:hidden flex flex-col items-center justify-center w-8 h-8 gap-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0"
          >
            <span className={`block w-4 h-0.5 bg-current transition-all duration-200 origin-center ${isSidebarOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-4 h-0.5 bg-current transition-all duration-200 ${isSidebarOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-4 h-0.5 bg-current transition-all duration-200 origin-center ${isSidebarOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
          <div>
            <h1 className="text-base font-semibold text-slate-800 dark:text-zinc-100">
              {activeChatTitle ?? page.title}
            </h1>
            <p className="text-sm text-violet-500 dark:text-violet-400">{page.subtitle}</p>
          </div>
        </div>

        {/* 子頁面渲染位置：
            - overflow-hidden + relative：供需要 absolute fill 的頁面（ChatPage、PersonasPage）
            - 這些頁面自己負責 overflow-y-auto；
              一般頁面（PromptsPage 等）需自帶 overflow-y-auto wrapper */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
