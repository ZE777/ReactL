import { useState, useEffect } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { AiKey } from '../types/ai'
import { fetchAiKeys } from '../api/aiKeys'
import ConversationSidebar from '../components/ConversationSidebar'

/** 強制設定金鑰前唯一可停留的頁面 */
const AI_KEYS_PATH = '/settings/ai-keys'

type ConversationListItem = { id: string; title: string }

type UserProfile = { mustChangePassword?: boolean }

/** 強制改密碼前唯一可停留的頁面 */
const CHANGE_PASSWORD_PATH = '/change-password'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/chat':          { title: '對話測試',    subtitle: '測試 Persona 與 AI 回應' },
  '/conversations': { title: '對話記錄',    subtitle: '所有測試對話' },
  '/personas':      { title: '角色',        subtitle: '管理 AI 角色設定' },
  '/prompts':       { title: 'Prompt 模板', subtitle: '管理提示詞模板庫' },
  '/bots':          { title: 'Bot 管理',    subtitle: 'Line / Discord Bot 綁定' },
  '/access-codes':  { title: '存取碼',      subtitle: '管理邀請連結與存取權限' },
  '/monitor':       { title: '對話監控',    subtitle: '外部平台對話記錄' },
  '/stats':         { title: '統計',        subtitle: 'Token 用量與使用分析' },
  '/settings':      { title: '設定',        subtitle: '帳號與系統設定' },
  '/settings/ai-keys': { title: 'AI 金鑰',   subtitle: '管理各供應商 API Key' },
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

  // 首次登入強制改密碼：mustChangePassword 為 true 時鎖死整個後台，導向改密碼頁
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<UserProfile>>('/users/me').then(unwrap),
  })

  // C 方案：硬性強制——使用者尚未設定任何自帶 AI 金鑰前，鎖定在 AI 金鑰頁，
  // 不得使用後台其他功能（前台公開聊天室為獨立專案、走系統預設 key，不受影響）
  const { data: aiKeys, isLoading: keysLoading } = useQuery<AiKey[]>({
    queryKey: ['ai-keys'],
    queryFn: fetchAiKeys,
    enabled: !profile?.mustChangePassword,
  })
  const mustSetKey = !keysLoading && !!aiKeys && aiKeys.length === 0
  // 鎖定時仍允許停留在 AI 金鑰頁與帳號設定（後者不消耗 AI，新使用者可先改名稱/密碼）
  const gated = mustSetKey
    && location.pathname !== AI_KEYS_PATH
    && location.pathname !== '/settings'

  // 強制改密碼優先於任何頁面與 AI 金鑰鎖定
  if (profile?.mustChangePassword) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 page-enter">
      <ConversationSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} locked={mustSetKey} />

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
          {gated ? <Navigate to={AI_KEYS_PATH} replace /> : <Outlet />}
        </div>
      </main>
    </div>
  )
}
