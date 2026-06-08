import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import 'highlight.js/styles/github-dark.css'
import { markdownComponents, remarkPlugins, rehypePlugins } from '../components/ui/MarkdownComponents'
import { fetchPublicChatConversations, fetchPublicChatMessages, fetchPublicChatRetentionDays } from '../api/publicChatMonitor'
import type { PublicChatConversation } from '../types/publicChatMonitor'
import Badge from '../components/ui/Badge'
import GhostButton from '../components/ui/GhostButton'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import PageLoading from '../components/ui/PageLoading'
import PageError from '../components/ui/PageError'
import { useToast } from '../context/ToastContext'

/** 對話顯示名稱：優先標籤，其次存取碼，最後標示匿名 */
function convTitle(conv: PublicChatConversation): string {
  return conv.accessCodeLabel ?? conv.accessCodeText ?? '匿名訪客'
}

/** 模型字串 providerId:modelId → 顯示用短名（取 modelId 部分） */
function shortModel(modelType: string | null | undefined): string | null {
  if (!modelType) return null
  const idx = modelType.indexOf(':')
  return idx >= 0 ? modelType.slice(idx + 1) : modelType
}

export default function PublicChatMonitorPage() {
  const [convPage, setConvPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [selectedConv, setSelectedConv] = useState<PublicChatConversation | null>(null)
  const [msgPage, setMsgPage] = useState(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 左側：對話列表（以工作階段分組）。search 走後端比對存取碼/session
  const { data: convData, isLoading: convLoading, error: convError, refetch: convRefetch, isFetching: convFetching } =
    useQuery({
      queryKey: ['public-chat-conversations', convPage, search],
      queryFn: () => fetchPublicChatConversations({ page: convPage, search }),
      refetchInterval: 30_000,
    })

  // 聊天記錄保留天數（顯示於副標，提醒逾期自動清除）
  const { data: retentionDays } = useQuery({
    queryKey: ['public-chat-retention-days'],
    queryFn: fetchPublicChatRetentionDays,
    staleTime: 60 * 60 * 1000,
  })

  // 右側：選定對話的完整訊息記錄
  const { data: msgData, isLoading: msgLoading, refetch: msgRefetch, isFetching: msgFetching } =
    useQuery({
      queryKey: ['public-chat-messages', selectedSession, msgPage],
      queryFn: () => fetchPublicChatMessages({ sessionId: selectedSession!, page: msgPage }),
      enabled: selectedSession != null,
      refetchInterval: 30_000,
    })

  const conversations = convData?.items ?? []
  // 後端降序回傳，轉為升序（時間由舊到新）顯示
  const sortedMessages = [...(msgData?.items ?? [])].reverse()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [sortedMessages])

  function handleSelectConversation(conv: PublicChatConversation) {
    setSelectedSession(conv.sessionId)
    setSelectedConv(conv)
    setMsgPage(1)
  }

  function handleBack() {
    setSelectedSession(null)
    setSelectedConv(null)
  }

  if (convLoading) return <PageLoading text="載入前台對話列表" />
  if (convError) return <PageError title="載入前台對話列表失敗" onRetry={convRefetch} />

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* 頂部：標題 + 刷新 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <PageHeader
            title="前台聊天監控"
            subtitle={`公開聊天室（存取碼）訪客的對話記錄${retentionDays && retentionDays > 0 ? `，記錄保留 ${retentionDays} 天後自動清除` : ''}`}
          />
          <button
            onClick={() => convRefetch()}
            disabled={convFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${convFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {convFetching ? '更新中' : '全表刷新'}
          </button>
        </div>
      </div>

      {/* 分割面板 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：對話列表 */}
        <div className={`${selectedSession ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 lg:flex-shrink-0 flex-col border-r border-slate-200 dark:border-zinc-800 overflow-hidden`}>
          {/* 搜尋框 */}
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-100 dark:border-zinc-800">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setConvPage(1) }}
                placeholder="搜尋存取碼或工作階段…"
                className="w-full pl-8 pr-7 py-1.5 text-sm bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 rounded-lg border-0 outline-none focus:ring-1 focus:ring-violet-400 dark:focus:ring-violet-500 transition-shadow"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setConvPage(1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                  aria-label="清除搜尋"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title={search ? '找不到符合的對話' : '尚無前台聊天記錄'}
                description={search ? '請嘗試其他關鍵字' : '訪客在公開聊天室發訊息後會顯示在此'}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv, i) => {
                  const isSelected = selectedSession === conv.sessionId
                  return (
                    <button
                      key={conv.sessionId}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-900/20 border-l-2 border-violet-500'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                      } ${i < conversations.length - 1 ? 'border-b border-slate-100 dark:border-zinc-800' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                            {convTitle(conv).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-base font-semibold truncate text-slate-800 dark:text-zinc-100">
                              {convTitle(conv)}
                            </span>
                            <Badge color="violet" className="ml-auto flex-shrink-0">前台</Badge>
                          </div>
                          {conv.accessCodeText && (
                            <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 truncate mb-0.5">
                              {conv.accessCodeText}
                            </p>
                          )}
                          {/* 角色 · 模型（最近一次使用） */}
                          {(conv.personaName || conv.modelType) && (
                            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mb-0.5">
                              <span className="text-slate-600 dark:text-zinc-300">{conv.personaName ?? '無角色'}</span>
                              {shortModel(conv.modelType) && (
                                <span className="text-slate-400 dark:text-zinc-500 font-mono"> · {shortModel(conv.modelType)}</span>
                              )}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">{conv.messageCount} 則</span>
                            <span className="text-xs text-slate-300 dark:text-zinc-600">·</span>
                            <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono flex-shrink-0">↕{conv.totalTokens}</span>
                            <span className="text-xs text-slate-300 dark:text-zinc-500 ml-auto flex-shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleDateString('zh-TW')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 對話列表分頁 */}
              {convData && convData.totalCount > convData.pageSize && (
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-zinc-800">
                  <span className="text-xs text-slate-400 dark:text-zinc-500">
                    {convData.page} / {convData.totalPages} 頁
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={convPage <= 1}
                      onClick={() => setConvPage(p => p - 1)}
                      className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      disabled={!convData.hasNextPage}
                      onClick={() => setConvPage(p => p + 1)}
                      className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 右側：聊天室 */}
        <div className={`${selectedSession ? 'flex' : 'hidden lg:flex'} flex-1 flex-col overflow-hidden`}>
          {!selectedSession ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="選擇一個對話" description="從左側選取訪客來查看完整對話記錄" />
            </div>
          ) : (
            <>
              {/* 聊天室標頭 */}
              <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="lg:hidden p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-500 dark:text-zinc-400 transition-colors"
                  aria-label="返回列表"
                >
                  ←
                </button>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                    {selectedConv ? convTitle(selectedConv).charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-zinc-200 truncate">
                      {selectedConv ? convTitle(selectedConv) : ''}
                    </p>
                    <Badge color="violet">前台</Badge>
                  </div>
                  {selectedConv?.accessCodeText && (
                    <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 truncate">{selectedConv.accessCodeText}</p>
                  )}
                  {(selectedConv?.personaName || selectedConv?.modelType) && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                      {selectedConv?.personaName ?? '無角色'}
                      {shortModel(selectedConv?.modelType) && (
                        <span className="font-mono text-slate-400 dark:text-zinc-500"> · {shortModel(selectedConv?.modelType)}</span>
                      )}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">
                  {msgData?.totalCount ?? 0} 則訊息
                </span>
                <button
                  onClick={() => msgRefetch()}
                  disabled={msgFetching}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex-shrink-0"
                >
                  <svg className={`w-3.5 h-3.5 ${msgFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {msgFetching ? '更新中' : '刷新'}
                </button>
              </div>

              {/* 訊息列表（升序，舊訊息在上方） */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
                {msgLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-slate-400 dark:text-zinc-500">載入中…</span>
                  </div>
                ) : sortedMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <EmptyState title="此對話尚無訊息" description="" />
                  </div>
                ) : (
                  <>
                    {sortedMessages.map(msg => (
                      <MonitorMessageBubble
                        key={msg.id}
                        role={msg.role as 'user' | 'assistant'}
                        content={msg.content}
                        createdAt={msg.createdAt}
                        tokensIn={msg.tokensIn}
                        tokensOut={msg.tokensOut}
                        persona={msg.personaName}
                        model={msg.modelType}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* 訊息分頁 */}
              {msgData && msgData.totalCount > msgData.pageSize && (
                <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-2 border-t border-slate-200 dark:border-zinc-800">
                  <span className="text-xs text-slate-400 dark:text-zinc-500">
                    {msgData.page} / {msgData.totalPages} 頁
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={msgPage <= 1}
                      onClick={() => setMsgPage(p => p - 1)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      上一頁
                    </button>
                    <button
                      disabled={!msgData.hasNextPage}
                      onClick={() => setMsgPage(p => p + 1)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      下一頁
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type MonitorMessageBubbleProps = {
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  tokensIn: number
  tokensOut: number
  persona?: string | null
  model?: string | null
}

function MonitorMessageBubble({ role, content, createdAt, tokensIn, tokensOut, persona, model }: MonitorMessageBubbleProps) {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)
  const { push: toast } = useToast()

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
    } catch {
      toast('error', '複製失敗，請手動選取文字複製')
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`}>
      <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-500 text-white rounded-tr-sm whitespace-pre-wrap break-words'
            : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-sm'
        }`}>
          {isUser ? (
            content
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none
              prose-p:my-1
              prose-pre:bg-white dark:prose-pre:bg-zinc-900 prose-pre:rounded-lg
              prose-code:text-violet-600 dark:prose-code:text-violet-400
              prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={markdownComponents}>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* 時間 + Token 用量 + 複製按鈕 */}
        <div className={`flex items-center gap-2 px-1 w-full ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            {new Date(createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {/* 角色（每則訊息當下使用的角色，標在模型前） */}
          {persona && (
            <span className="text-xs text-violet-500 dark:text-violet-400 truncate max-w-[8rem]" title={persona}>
              {persona}
            </span>
          )}
          {!isUser && tokensIn > 0 && (
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
              ↑{tokensIn} ↓{tokensOut}
            </span>
          )}
          {!isUser && shortModel(model) && (
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono truncate" title={model ?? undefined}>
              {shortModel(model)}
            </span>
          )}
          <GhostButton onClick={handleCopy} title="複製訊息" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {copied ? (
              <>
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-500">已複製</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>複製</span>
              </>
            )}
          </GhostButton>
        </div>
      </div>
    </div>
  )
}
