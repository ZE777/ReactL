import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import type { ApiError, ApiResponse } from '../types/api'
import { useToast } from '../context/ToastContext'
import ModelPickerModal from './ui/ModelPickerModal'

type ConversationListItem = {
  id: string
  title: string
  modelType: string
  isPinned: boolean
  personaId: string | null
  personaName: string | null
  messageCount: number
  lastMessagePreview?: string | null
  lastMessageRole?: string | null
  createdAt: string
  updatedAt: string
}

type UserProfile = {
  id: string
  email: string
  displayName: string
  role: string
}

const setupNavItems = [
  { label: '角色',        path: '/personas' },
  { label: 'Prompt 模板', path: '/prompts' },
  { label: 'Bot 管理',    path: '/bots' },
]

const monitorNavItems = [
  { label: '監控',        path: '/monitor' },
  { label: '統計',        path: '/stats' },
]

const MAX_VISIBLE_CONVERSATIONS = 5

type Props = {
  isOpen: boolean
  onClose: () => void
  /** 尚未設定 AI 金鑰時鎖定：導覽與對話列表變灰、不可點，只留 AI 金鑰與登出 */
  locked?: boolean
}

export default function ConversationSidebar({ isOpen, onClose, locked = false }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push: toast } = useToast()
  const { theme, toggleTheme } = useTheme()

  const isOnChat = location.pathname === '/chat' || location.pathname.startsWith('/chat/')
  const activeChatId = location.pathname.startsWith('/chat/')
    ? location.pathname.slice('/chat/'.length)
    : null

  const [isConvOpen, setIsConvOpen] = useState(isOnChat)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  /** 控制模型選擇 Modal 的顯示狀態 */
  const [showModelPicker, setShowModelPicker] = useState(false)

  const { data: conversations } = useQuery<ConversationListItem[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get<ApiResponse<ConversationListItem[]>>('/conversations').then(unwrap),
  })

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<UserProfile>>('/users/me').then(unwrap),
  })

  const { data: personas } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['personas-list'],
    queryFn: () => api.get<ApiResponse<{ id: string; name: string }[]>>('/personas').then(unwrap),
    enabled: showModelPicker,
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    /** mutationFn 接受 model、title 與 personaId，由 ModelPickerModal 確認後傳入 */
    mutationFn: ({ model, title, personaId }: { model: string; title: string; personaId?: string | null }) =>
      api.post<ApiResponse<{ id: string }>>('/conversations', {
        title,
        modelType: model,
        personaId: personaId ?? null,
      }).then(unwrap),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/chat/${conv.id}`)
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '建立對話失敗'),
  })

  useEffect(() => {
    if (isOnChat) setIsConvOpen(true)
  }, [isOnChat])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('expiresAt')
    queryClient.clear()
    navigate('/login')
  }

  const convList = conversations ?? []
  const displayName = profile?.displayName ?? '使用者'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  return (
    <>
      {/* 手機遮罩：點擊關閉 sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col h-screen w-56 flex-shrink-0
        bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
      `}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-800 dark:bg-white flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white dark:bg-zinc-900" />
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Prompt Studio</span>
        </div>
      </div>

      {/* Nav（未設定金鑰時整區鎖定：變灰、不可點、不可展開） */}
      <nav
        className={`flex-1 overflow-y-auto py-3 ${locked ? 'opacity-50 pointer-events-none select-none' : ''}`}
        aria-disabled={locked || undefined}
      >

        {[
          ...setupNavItems,
          // 存取碼僅管理員可見（邀請連結與存取權限管理）
          ...(profile?.role === 'Admin' ? [{ label: '存取碼', path: '/access-codes' }] : []),
          ...monitorNavItems,
        ].map(item => (
          <Link
            to={item.path}
            key={item.label}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm cursor-pointer transition-all border-l-2 ${
              location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                : 'border-transparent text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <div className={`w-4 h-4 rounded transition-colors ${
              location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                ? 'bg-violet-500/40'
                : 'bg-slate-200 dark:bg-zinc-700/50'
            }`} />
            {item.label}
          </Link>
        ))}

        <div className="mx-4 my-2 border-t border-slate-100 dark:border-zinc-700/25" />

        {/* 對話夾層 */}
        <button
          onClick={() => setIsConvOpen(v => !v)}
          className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm cursor-pointer transition-all border-l-2 ${
            isOnChat
              ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300'
              : 'border-transparent text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className={`w-4 h-4 rounded transition-colors ${
            isOnChat ? 'bg-violet-500/40' : 'bg-slate-200 dark:bg-zinc-700/50'
          }`} />
          <span className="flex-1 text-left">對話</span>
          <span className={`text-sm transition-transform duration-200 opacity-50 ${isConvOpen ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {isConvOpen && !locked && (
          <div className="ml-4 mb-1 border-l border-slate-100 dark:border-zinc-700/25">
            {convList.slice(0, MAX_VISIBLE_CONVERSATIONS).map(conv => (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`flex items-start gap-2 pl-3 pr-3 py-2 cursor-pointer transition-all rounded-r-md group ${
                  activeChatId === conv.id
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
                    : 'text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200'
                }`}
              >
                <span className={`w-1 h-1 rounded-full shrink-0 mt-1.5 ${
                  activeChatId === conv.id ? 'bg-violet-500' : 'bg-slate-300 dark:bg-zinc-600'
                }`} />
                <p className="text-sm truncate min-w-0 flex-1">{conv.isPinned ? '📌 ' : ''}{conv.title}</p>
              </div>
            ))}

            {/* 永遠提供進入對話記錄頁的入口（即使少於上限），方便批量管理/刪除 */}
            <Link
              to="/conversations"
              className="block pl-3 pr-3 py-1 text-sm text-slate-400 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
            >
              {convList.length > MAX_VISIBLE_CONVERSATIONS
                ? `還有 ${convList.length - MAX_VISIBLE_CONVERSATIONS} 筆，查看全部 →`
                : '查看全部對話 →'}
            </Link>

            <button
              onClick={() => setShowModelPicker(true)}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 pl-3 pr-3 py-1.5 w-full text-left cursor-pointer transition-all rounded-r-md text-slate-400 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">+</span>
              <span className="text-sm">新增對話</span>
            </button>
          </div>
        )}

      </nav>

      {/* User section */}
      <div ref={menuRef} className="relative p-3 border-t border-slate-200 dark:border-zinc-800">
        <div className={`absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden transition-all duration-200 origin-bottom ${
          isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
        }`}>
          <div className="px-3 py-2.5 flex items-center justify-between">
            <span className="text-sm text-slate-400 dark:text-zinc-400">顯示模式</span>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? '切換淺色' : '切換深色'}
              className="relative flex items-center rounded-full bg-slate-100 dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 p-0.5 cursor-pointer"
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-zinc-500 shadow-sm transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
              }`} />
              <span className={`relative z-10 w-6 h-6 flex items-center justify-center text-sm ${theme === 'light' ? 'text-amber-500' : 'text-zinc-500'}`}>☀️</span>
              <span className={`relative z-10 w-6 h-6 flex items-center justify-center text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-slate-400'}`}>🌙</span>
            </button>
          </div>
          <div className="border-t border-slate-100 dark:border-zinc-700" />
          <Link to="/settings" onClick={() => setIsMenuOpen(false)} className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer text-left">
            <span className="text-sm">⚙️</span>
            <span className="text-sm text-slate-600 dark:text-zinc-400">帳號設定</span>
          </Link>
          <Link to="/settings/ai-keys" onClick={() => setIsMenuOpen(false)} className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer text-left">
            <span className="text-sm">🔑</span>
            <span className="text-sm text-slate-600 dark:text-zinc-400">AI 金鑰</span>
          </Link>
          <div className="border-t border-slate-100 dark:border-zinc-700" />
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer text-left"
          >
            <span className="text-sm">🚪</span>
            <span className="text-sm text-red-500 dark:text-red-400">登出</span>
          </button>
        </div>

        <div
          onClick={() => setIsMenuOpen(prev => !prev)}
          className={`flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer transition-colors ${
            isMenuOpen ? 'bg-slate-100 dark:bg-zinc-800' : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <div className="flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-sm font-semibold text-white">
              {avatarLetter}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 dark:text-zinc-200 truncate">{displayName}</p>
            <p className="text-sm text-slate-400 dark:text-zinc-400 truncate">{profile?.email ?? ''}</p>
          </div>
        </div>
      </div>
    </aside>

    {/* 模型選擇 Modal 放在 aside 外，避免 aside 的 transform 讓 fixed 定位失效 */}
    <ModelPickerModal
      open={showModelPicker}
      onClose={() => setShowModelPicker(false)}
      personas={personas ?? []}
      onConfirm={(model, title, personaId) => {
        setShowModelPicker(false)
        createMutation.mutate({ model, title: title || '新對話', personaId })
      }}
    />
    </>
  )
}
