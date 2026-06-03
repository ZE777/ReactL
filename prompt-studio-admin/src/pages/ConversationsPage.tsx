import { useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import type { ApiResponse, ApiError } from '../types/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import PageLoading from '../components/ui/PageLoading'
import ModelPickerModal from '../components/ui/ModelPickerModal'

type ConversationListItem = {
  id: string
  title: string
  modelType: string
  isPinned: boolean
  isPublic: boolean
  shareSlug: string | null
  personaId: string | null
  personaName: string | null
  messageCount: number
  lastMessagePreview?: string | null
  lastMessageRole?: string | null
  createdAt: string
  updatedAt: string
}

type MessageDetail = {
  id: string
  role: string
  content: string
  createdAt: string
}

type ConversationDetail = {
  id: string
  title: string
  modelType: string
  messages: MessageDetail[]
  createdAt: string
  updatedAt: string
}

// ── 展開後顯示完整對話訊息的子元件 ────────────────────────────────────────────
function ConversationPreview({ id, createdAt }: { id: string; createdAt: string }) {
  const { push: toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading } = useQuery<ConversationDetail>({
    queryKey: ['conv-preview', id],
    queryFn: () => api.get<ApiResponse<ConversationDetail>>(`/conversations/${id}`).then(unwrap),
    staleTime: 30_000,
  })

  // CV-07：前端組裝 Markdown 並觸發下載，不依賴後端 /api/export/:id
  async function handleExport() {
    if (!data) return
    setIsExporting(true)
    try {
      const lines: string[] = [
        `# ${data.title}`,
        '',
        `> 建立時間：${new Date(data.createdAt).toLocaleString('zh-TW')} · 模型：${data.modelType}`,
        '',
        '---',
        '',
      ]
      for (const msg of data.messages) {
        lines.push(`**${msg.role === 'user' ? 'User' : 'Assistant'}**`)
        lines.push('')
        lines.push(msg.content)
        lines.push('')
        lines.push('---')
        lines.push('')
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // 過濾 Windows/Unix 非法字元與控制字元，避免檔名注入
      const safeTitle = data.title
        .replace(/[/\\?%*:|"<>\x00-\x1F\x7F]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .trim() || 'conversation'
      a.download = `${safeTitle}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast('error', '導出失敗')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="border-t border-slate-100 dark:border-zinc-700/25">
      {isLoading ? (
        <div className="flex items-center gap-2 px-5 py-4 text-slate-400 dark:text-zinc-500">
          <Spinner size="sm" />
          <span className="text-sm">載入中...</span>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {(!data?.messages || data.messages.length === 0) && (
            <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-4">尚無訊息記錄</p>
          )}
          {data?.messages.map(msg => {
            const isUser = msg.role === 'user'
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isUser
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                }`}>
                  {isUser ? 'U' : 'AI'}
                </div>
                <div className={`max-w-2xl px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isUser
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-700/25 flex items-center justify-between">
        <p className="text-sm text-slate-400 dark:text-zinc-400">
          建立於 {new Date(createdAt).toLocaleString('zh-TW')}
        </p>
        <div className="flex items-center gap-2">
          {data && (
            <Button size="sm" variant="secondary" loading={isExporting} onClick={handleExport}>
              導出 .md
            </Button>
          )}
          <Link to={`/chat/${id}`}>
            <Button size="sm">繼續對話 →</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// 前台 Web App 的 Base URL，用於組裝公開分享連結
const WEB_BASE_URL = (import.meta as { env: Record<string, string> }).env.VITE_WEB_BASE_URL ?? 'http://localhost:3000'

export default function ConversationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showModelPicker, setShowModelPicker] = useState(false)
  // CV-02：搜尋篩選
  const [searchQuery, setSearchQuery] = useState('')
  // CV-05：改名
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  // CV-08：分享 Modal 狀態
  const [shareModal, setShareModal] = useState<{ id: string; slug: string; url: string } | null>(null)

  const { data: conversations, isLoading } = useQuery<ConversationListItem[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get<ApiResponse<ConversationListItem[]>>('/conversations').then(unwrap),
  })

  const createMutation = useMutation({
    mutationFn: ({ model, title }: { model: string; title: string }) =>
      api.post<ApiResponse<ConversationListItem>>('/conversations', {
        title,
        modelType: model,
      }).then(unwrap),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/chat/${conv.id}`)
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '建立對話失敗'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/conversations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast('success', '對話已刪除')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '刪除失敗'),
  })

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      api.patch(`/conversations/${id}`, { isPinned }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast('success', vars.isPinned ? '已釘選' : '已取消釘選')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '操作失敗'),
  })

  // CV-05：改名 mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.patch(`/conversations/${id}`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setRenamingId(null)
    },
    onError: (e: AxiosError<ApiError>) => {
      toast('error', e.response?.data?.detail ?? '改名失敗')
      setRenamingId(null)
    },
  })

  // CV-08：切換公開分享狀態，啟用時後端回傳含 shareSlug 的更新資料
  const shareMutation = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      api.patch<ApiResponse<ConversationListItem>>(`/conversations/${id}`, { isPublic }).then(unwrap),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (conv.isPublic && conv.shareSlug) {
        setShareModal({ id: conv.id, slug: conv.shareSlug, url: `${WEB_BASE_URL}/share/${conv.shareSlug}` })
      } else {
        toast('success', '已關閉公開分享')
      }
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '操作失敗'),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => api.delete(`/conversations/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setSelectedIds([])
      setIsManaging(false)
      toast('success', '已批次刪除')
    },
  })

  function handleDelete(id: string) {
    deleteMutation.mutate(id)
    if (expandedId === id) setExpandedId(null)
    setSelectedIds(prev => prev.filter(x => x !== id))
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function enterManaging() { setIsManaging(true); setExpandedId(null) }
  function exitManaging() { setIsManaging(false); setSelectedIds([]) }

  // CV-05：進入改名模式
  function startRename(conv: ConversationListItem, e: MouseEvent) {
    e.stopPropagation()
    setRenamingId(conv.id)
    setRenameValue(conv.title)
    setExpandedId(null)
  }

  // CV-05：提交改名（空值或未變更則取消）
  function commitRename(id: string, originalTitle: string) {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === originalTitle) { setRenamingId(null); return }
    if (trimmed.length > 200) { toast('error', '名稱不可超過 200 個字元'); return }
    renameMutation.mutate({ id, title: trimmed })
  }

  // CV-08：分享按鈕點擊邏輯（已分享則直接顯示連結，未分享則呼叫 API 建立 slug）
  function handleShareClick(conv: ConversationListItem, e: MouseEvent) {
    e.stopPropagation()
    if (conv.isPublic && conv.shareSlug) {
      setShareModal({ id: conv.id, slug: conv.shareSlug, url: `${WEB_BASE_URL}/share/${conv.shareSlug}` })
    } else {
      shareMutation.mutate({ id: conv.id, isPublic: true })
    }
  }

  const convList = conversations ?? []
  // CV-02：依搜尋字串過濾（不區分大小寫）
  const filteredList = searchQuery.trim()
    ? convList.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : convList

  if (isLoading) return <PageLoading />

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">對話記錄</h2>
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">共 {convList.length} 筆對話</p>
          </div>
          <div className="flex items-center gap-2">
            {isManaging ? (
              <>
                {selectedIds.length > 0 && (
                  <Button variant="danger" size="sm" loading={bulkDeleteMutation.isPending} onClick={() => bulkDeleteMutation.mutate(selectedIds)}>
                    刪除 {selectedIds.length} 筆
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={exitManaging}>取消</Button>
              </>
            ) : (
              <>
                {/* CV-02：搜尋框放在批次刪除旁，即時過濾列表 */}
                {convList.length > 0 && (
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="搜尋對話..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-44 pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
                    />
                  </div>
                )}
                {convList.length > 0 && (
                  <Button variant="danger" size="sm" onClick={enterManaging}>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      批次刪除
                    </span>
                  </Button>
                )}
                <Button size="sm" loading={createMutation.isPending} onClick={() => setShowModelPicker(true)}>+ 新增對話</Button>
              </>
            )}
          </div>
        </div>

{convList.length === 0 && (
          <EmptyState
            title="尚無對話記錄"
            description="新增一個對話開始測試你的 Persona"
            action={<Button size="sm" loading={createMutation.isPending} onClick={() => setShowModelPicker(true)}>開始對話</Button>}
          />
        )}

        {/* CV-02：搜尋無結果提示 */}
        {convList.length > 0 && filteredList.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
            <p className="text-sm">找不到符合「{searchQuery}」的對話</p>
          </div>
        )}

        {filteredList.length > 0 && (
          <div className="flex flex-col gap-2">
            {filteredList.map(conv => {
              const isExpanded = expandedId === conv.id
              const isSelected = isManaging && selectedIds.includes(conv.id)
              const isRenaming = renamingId === conv.id

              return (
                <div
                  key={conv.id}
                  className={`bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden transition-colors ${
                    isSelected
                      ? 'border-violet-300/60 dark:border-violet-700/60 bg-violet-50/30 dark:bg-violet-900/10'
                      : isExpanded
                        ? 'border-violet-300/60 dark:border-violet-700/60'
                        : 'border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <div
                    className={`flex items-stretch transition-colors ${
                      isManaging
                        ? 'hover:bg-violet-50/50 dark:hover:bg-violet-900/10 cursor-pointer'
                        : isRenaming
                          ? ''
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (isRenaming) return
                      if (isManaging) toggleSelect(conv.id)
                      else setExpandedId(isExpanded ? null : conv.id)
                    }}
                  >
                    {isManaging && (
                      <label className="flex items-center pl-5 pr-3 cursor-pointer" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(conv.id)}
                          className="w-3.5 h-3.5 accent-violet-500 cursor-pointer"
                        />
                      </label>
                    )}

                    <div className={`flex-1 py-4 min-w-0 ${isManaging ? '' : 'pl-5'}`}>
                      {/* CV-05：改名模式下顯示 input，否則顯示標題文字 */}
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(conv.id, conv.title)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(conv.id, conv.title) }
                            if (e.key === 'Escape') { e.preventDefault(); setRenamingId(null) }
                          }}
                          onClick={e => e.stopPropagation()}
                          className="w-full text-base font-medium bg-transparent border-b border-violet-400 dark:border-violet-500 text-slate-700 dark:text-zinc-200 focus:outline-none pb-0.5 pr-2"
                        />
                      ) : (
                        <p className="text-base font-medium text-slate-700 dark:text-zinc-200 truncate">
                          {conv.isPinned ? '📌 ' : ''}{conv.title}
                        </p>
                      )}
                      <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">
                        {conv.personaName ? `${conv.personaName} · ` : ''}
                        {conv.modelType} · {conv.messageCount} 則 · {new Date(conv.updatedAt).toLocaleDateString('zh-TW')}
                      </p>
                    </div>

                    {!isManaging && (
                      <div className="flex items-center gap-1 pl-2 pr-2" onClick={e => e.stopPropagation()}>
                        {/* CV-05：改名按鈕 */}
                        <button
                          onClick={e => startRename(conv, e)}
                          title="改名"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* 釘選按鈕（既有） */}
                        <button
                          onClick={() => pinMutation.mutate({ id: conv.id, isPinned: !conv.isPinned })}
                          disabled={pinMutation.isPending && pinMutation.variables?.id === conv.id}
                          title={conv.isPinned ? '取消釘選' : '釘選'}
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 ${
                            conv.isPinned
                              ? 'text-amber-500 dark:text-amber-500 bg-amber-300/70 dark:bg-amber-600/30 hover:bg-amber-400/70 dark:hover:bg-amber-600/50 dark:hover:text-amber-400'
                              : 'text-slate-400 dark:text-zinc-400 bg-slate-200/70 dark:bg-zinc-600/30 hover:text-amber-500 hover:bg-amber-300/70 dark:hover:bg-amber-600/30'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill={conv.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>

                        {/* CV-08：公開分享按鈕（綠色代表已分享） */}
                        <button
                          onClick={e => handleShareClick(conv, e)}
                          disabled={shareMutation.isPending && shareMutation.variables?.id === conv.id}
                          title={conv.isPublic ? '已公開分享（點擊查看連結）' : '公開分享'}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 text-emerald-600 dark:text-emerald-500 bg-emerald-300/70 dark:bg-emerald-600/30 hover:bg-emerald-400/70 dark:hover:bg-emerald-600/50 dark:hover:text-emerald-400"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>

                        {/* 刪除按鈕（既有） */}
                        <button
                          onClick={() => handleDelete(conv.id)}
                          disabled={deleteMutation.isPending}
                          title="刪除"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-red-600 dark:text-red-500 bg-red-300/70 dark:bg-red-600/30 hover:bg-red-400/70 dark:hover:bg-red-600/50 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {!isManaging && !isRenaming && (
                      <div className="flex items-center pr-4">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isExpanded
                            ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-500'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400'
                        }`}>
                          <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4.5l4 3 4-3" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isManaging && isExpanded && (
                    <ConversationPreview id={conv.id} createdAt={conv.createdAt} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CV-08：公開分享 Modal */}
      {shareModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShareModal(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-100">公開分享連結</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">任何人均可透過此連結查看對話</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 mb-5">
              <span className="flex-1 text-sm text-slate-600 dark:text-zinc-300 truncate font-mono">{shareModal.url}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.url)
                  toast('success', '已複製連結')
                }}
                className="text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 text-sm font-medium flex-shrink-0 transition-colors"
              >
                複製
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  shareMutation.mutate({ id: shareModal.id, isPublic: false })
                  setShareModal(null)
                }}
                className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors"
              >
                關閉分享
              </button>
              <Button variant="secondary" size="sm" onClick={() => setShareModal(null)}>完成</Button>
            </div>
          </div>
        </div>
      )}

      {/* 模型選擇 Modal — 確認後以選取的 model 建立新對話 */}
      <ModelPickerModal
        open={showModelPicker}
        onClose={() => setShowModelPicker(false)}
        onConfirm={(model, title) => {
          setShowModelPicker(false)
          createMutation.mutate({ model, title: title || '新對話' })
        }}
      />
    </div>
  )
}
