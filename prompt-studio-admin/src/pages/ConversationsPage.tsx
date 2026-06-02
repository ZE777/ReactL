import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import type { ApiResponse, ApiError } from '../types/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import ModelPickerModal from '../components/ui/ModelPickerModal'

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
  const { data, isLoading } = useQuery<ConversationDetail>({
    queryKey: ['conv-preview', id],
    queryFn: () => api.get<ApiResponse<ConversationDetail>>(`/conversations/${id}`).then(unwrap),
    staleTime: 30_000,
  })

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
        <Link to={`/chat/${id}`}>
          <Button size="sm">繼續對話 →</Button>
        </Link>
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  /** 控制模型選擇 Modal 的顯示狀態 */
  const [showModelPicker, setShowModelPicker] = useState(false)

  const { data: conversations, isLoading } = useQuery<ConversationListItem[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get<ApiResponse<ConversationListItem[]>>('/conversations').then(unwrap),
  })

  const createMutation = useMutation({
    /** mutationFn 接受 model 與 title，由 ModelPickerModal 確認後傳入 */
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

  const convList = conversations ?? []

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 lg:p-8">
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
                {convList.length > 0 && (
                  <Button variant="danger" size="sm" onClick={enterManaging}>批次刪除</Button>
                )}
                <Button size="sm" loading={createMutation.isPending} onClick={() => setShowModelPicker(true)}>+ 新增對話</Button>
              </>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 py-4">
            <Spinner size="sm" /> 載入中...
          </div>
        )}

        {!isLoading && convList.length === 0 && (
          <EmptyState
            title="尚無對話記錄"
            description="新增一個對話開始測試你的 Persona"
            action={<Button size="sm" loading={createMutation.isPending} onClick={() => setShowModelPicker(true)}>開始對話</Button>}
          />
        )}

        {!isLoading && convList.length > 0 && (
          <div className="flex flex-col gap-2">
            {convList.map(conv => {
              const isExpanded = expandedId === conv.id
              const isSelected = isManaging && selectedIds.includes(conv.id)

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
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer'
                    }`}
                    onClick={() => {
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
                      <p className="text-base font-medium text-slate-700 dark:text-zinc-200 truncate">
                        {conv.isPinned ? '📌 ' : ''}{conv.title}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">
                        {conv.personaName ? `${conv.personaName} · ` : ''}
                        {conv.modelType} · {conv.messageCount} 則 · {new Date(conv.updatedAt).toLocaleDateString('zh-TW')}
                      </p>
                    </div>

                    {!isManaging && (
                      <div className="flex items-center gap-1 pl-2 pr-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => pinMutation.mutate({ id: conv.id, isPinned: !conv.isPinned })}
                          disabled={pinMutation.isPending && pinMutation.variables?.id === conv.id}
                          title={conv.isPinned ? '取消釘選' : '釘選'}
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 ${
                            conv.isPinned
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                              : 'text-slate-400 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/50 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill={conv.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(conv.id)}
                          disabled={deleteMutation.isPending}
                          title="刪除"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {!isManaging && (
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